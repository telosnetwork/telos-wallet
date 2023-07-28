

import { BigNumber, ethers } from 'ethers';
import { BehaviorSubject, filter, map } from 'rxjs';
import { useChainStore, useEVMStore, useFeedbackStore } from 'src/antelope';
import { AntelopeError, ERC20_TYPE, EthereumProvider, EvmTransactionResponse, TokenClass, addressString } from 'src/antelope/types';
import { EVMAuthenticator } from 'src/antelope/wallets';
import { AbiItem } from 'web3-utils';
import Web3 from 'web3';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { TELOS_NETWORK_NAMES, TELOS_ANALYTICS_EVENT_IDS } from 'src/antelope/chains/chain-constants';
import { MetamaskAuthName, SafePalAuthName } from 'src/antelope/wallets';

export abstract class InjectedProviderAuth extends EVMAuthenticator {
    onReady = new BehaviorSubject<boolean>(false);

    // this is just a dummy label to identify the authenticator base class
    constructor(label: string) {
        super(label);
        useEVMStore().initInjectedProvider(this);
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

    async wrapSystemToken(amount: BigNumber): Promise<EvmTransactionResponse> {
        const wrappedSystemTokenContractAddress = (useChainStore().currentChain.settings as EVMChainSettings).getWrappedSystemToken().address;
        const wrappedSystemTokenContractInstance = await (await useEVMStore().getContract(this, wrappedSystemTokenContractAddress, 'logged', ERC20_TYPE))?.getContractInstance();
        if (wrappedSystemTokenContractInstance) {
            const test = wrappedSystemTokenContractInstance.functions;
            debugger;
            const transaction = (await wrappedSystemTokenContractInstance.functions.deposit()) as EvmTransactionResponse;
            return transaction;
        } else {
            throw 'eztodo this error';
        }
    }


    // EVMAuthenticator API ----------------------------------------------------------

    async login(network: string): Promise<addressString | null> {
        const chainSettings = useChainStore().currentChain.settings as EVMChainSettings;
        const authName = this.getName();

        this.trace('login', network);
        useFeedbackStore().setLoading(`${this.getName()}.login`);

        this.trace('login', 'trackAnalyticsEvent -> login started');
        chainSettings.trackAnalyticsEvent(
            { id: TELOS_ANALYTICS_EVENT_IDS.loginStarted },
        );

        const response = await super.login(network).then((res) => {
            if (TELOS_NETWORK_NAMES.includes(network)) {
                let successfulLoginEventId = '';

                if (authName === MetamaskAuthName) {
                    successfulLoginEventId = TELOS_ANALYTICS_EVENT_IDS.loginSuccessfulMetamask;
                } else if (authName === SafePalAuthName) {
                    successfulLoginEventId = TELOS_ANALYTICS_EVENT_IDS.loginSuccessfulSafepal;
                }

                if (successfulLoginEventId) {
                    this.trace('login', 'trackAnalyticsEvent -> login succeeded', authName, successfulLoginEventId);
                    chainSettings.trackAnalyticsEvent(
                        { id: successfulLoginEventId },
                    );
                }

                this.trace('login', 'trackAnalyticsEvent -> generic login succeeded', TELOS_ANALYTICS_EVENT_IDS.loginSuccessful);
                chainSettings.trackAnalyticsEvent(
                    { id: TELOS_ANALYTICS_EVENT_IDS.loginSuccessful },
                );
            }

            return res;
        }).catch((error) => {
            // if the user rejects the connection, we don't want to track it as an error
            if (
                TELOS_NETWORK_NAMES.includes(network) &&
                error.message !== 'antelope.evm.error_connect_rejected'
            ) {
                let failedLoginEventId = '';

                if (authName === MetamaskAuthName) {
                    failedLoginEventId = TELOS_ANALYTICS_EVENT_IDS.loginFailedMetamask;
                } else if (authName === SafePalAuthName) {
                    failedLoginEventId = TELOS_ANALYTICS_EVENT_IDS.loginFailedSafepal;
                }

                if (failedLoginEventId) {
                    this.trace('login', 'trackAnalyticsEvent -> login failed', authName, failedLoginEventId);
                    chainSettings.trackAnalyticsEvent(
                        { id: failedLoginEventId },
                    );
                }
            }
        }).finally(() => {
            useFeedbackStore().unsetLoading(`${this.getName()}.login`);
        });

        return response ?? null;
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

    async ensureCorrectChain(): Promise<ethers.providers.Web3Provider> {
        this.trace('ensureCorrectChain');
        return super.ensureCorrectChain();
    }

}
