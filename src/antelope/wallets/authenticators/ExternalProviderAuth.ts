

import { ethers } from 'ethers';
import { BehaviorSubject, filter, map } from 'rxjs';
import { useEVMStore, useFeedbackStore } from 'src/antelope';
import { AntelopeError, ERC20_TYPE, EthereumProvider, EvmTransactionResponse, TokenClass, addressString } from 'src/antelope/types';
import { EVMAuthenticator } from 'src/antelope/wallets';
import { AbiItem } from 'web3-utils';
import Web3 from 'web3';

export abstract class ExternalProviderAuth extends EVMAuthenticator {
    onReady = new BehaviorSubject<boolean>(false);

    // this is just a dummy label to identify the authenticator base class
    constructor(label: string) {
        super(label);
        useEVMStore().initExternalProvider(this);
    }
    abstract getProvider(): EthereumProvider | null;

    async getSigner(): Promise<ethers.Signer> {
        const web3Provider = await this.web3Provider();
        return web3Provider.getSigner();
    }

    async ensureInitializedProvider(): Promise<ethers.providers.ExternalProvider> {
        return new Promise((resolve, reject) => {
            this.onReady.asObservable().pipe(
                filter(ready => ready),
                map(() => this.getProvider()),
            ).subscribe((provider) => {
                if (provider) {
                    resolve(provider);
                } else {
                    reject(new AntelopeError('antelope.evm.error_no_provider'));
                }
            });
        });
    }

    // this action is used by MetamaskAuth.transferTokens()
    async sendSystemToken(to: string, value: ethers.BigNumber): Promise<EvmTransactionResponse> {
        this.trace('sendSystemToken', to, value);

        // Send the transaction
        return (await this.getSigner()).sendTransaction({
            to,
            value,
        }).then(
            (transaction: ethers.providers.TransactionResponse) => transaction,
        ).catch((error) => {
            if ('ACTION_REJECTED' === ((error as {code:string}).code)) {
                throw new AntelopeError('antelope.evm.error_transaction_canceled');
            } else {
                // unknown error we print on console
                console.error(error);
                throw new AntelopeError('antelope.evm.error_send_transaction', { error });
            }
        });
    }

    // EVMAuthenticator API ----------------------------------------------------------

    async login(network: string): Promise<addressString | null> {
        this.trace('login', network);
        useFeedbackStore().setLoading(`${this.getName()}.login`);
        const response = await super.login(network);
        useFeedbackStore().unsetLoading(`${this.getName()}.login`);
        return response;
    }

    async logout(): Promise<void> {
        this.trace('logout');
    }

    async getSystemTokenBalance(address: addressString | string): Promise<ethers.BigNumber> {
        this.trace('getSystemTokenBalance', address);
        const provider = await this.web3Provider();
        if (provider) {
            return provider.getBalance(address);
        } else {
            throw new AntelopeError('antelope.evm.error_no_provider');
        }
    }

    async getERC20TokenBalance(account: addressString | string, tokenAddress: addressString | string): Promise<ethers.BigNumber> {
        this.trace('getERC20TokenBalance', [account], tokenAddress);
        const erc20ABI = useEVMStore().getTokenABI(ERC20_TYPE) as AbiItem[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const web3 = new Web3(this.getProvider() as any);
        const contract = new web3.eth.Contract(erc20ABI, tokenAddress);
        const result:ethers.BigNumber = contract.methods.balanceOf(account).call()
            .then((balance: never) => ethers.BigNumber.from(balance));
        this.trace('getERC20TokenBalance', [account], tokenAddress, '->', result);
        return result;
    }

    async transferTokens(token: TokenClass, amount: ethers.BigNumber, to: addressString): Promise<EvmTransactionResponse> {
        this.trace('transferTokens', token, amount, to);
        if (token.isSystem) {
            return this.sendSystemToken(to, amount);
        } else {
            const evm = useEVMStore();
            const contract = await evm.getContract(this, token.address, token.type);
            if (contract) {
                const contractInstance = await contract.getContractInstance();
                const amountInWei = amount.toString();
                return contractInstance.transfer(to, amountInWei);
            } else {
                throw new AntelopeError('antelope.balances.error_token_contract_not_found', { address: token.address });
            }
        }
    }

    prepareTokenForTransfer(token: TokenClass | null, amount: ethers.BigNumber, to: string): Promise<void> {
        this.trace('prepareTokenForTransfer', [token], amount, to);
        return new Promise((resolve) => {
            resolve();
        });
    }

    async isConnectedTo(chainId: string): Promise<boolean> {
        this.trace('isConnectedTo', chainId);
        return useEVMStore().isProviderOnTheCorrectChain(await this.web3Provider(), chainId);
    }

    async externalProvider(): Promise<ethers.providers.ExternalProvider> {
        return this.ensureInitializedProvider();
    }

    async web3Provider(): Promise<ethers.providers.Web3Provider> {
        this.trace('web3Provider');
        const web3Provider = new ethers.providers.Web3Provider(await this.externalProvider());
        await web3Provider.ready;
        return web3Provider;
    }



}
