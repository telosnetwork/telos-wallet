

import { BigNumber, ethers } from 'ethers';
import { BehaviorSubject, filter, map } from 'rxjs';
import { useEVMStore, useFeedbackStore, useRexStore } from 'src/antelope';
import {
    AntelopeError,
    ERC20_TYPE,
    EthereumProvider,
    EvmABI,
    EvmFunctionParam,
    EvmTransactionResponse,
    TokenClass,
    addressString,
    wtlosAbiDeposit,
    wtlosAbiWithdraw,
} from 'src/antelope/types';
import { EVMAuthenticator } from 'src/antelope/wallets';
import { AbiItem } from 'web3-utils';
import Web3 from 'web3';
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

    // EVMAuthenticator API ----------------------------------------------------------

    async signCustomTransaction(contract: string, abi: EvmABI, parameters: EvmFunctionParam[], value?: BigNumber): Promise<EvmTransactionResponse> {
        this.trace('signCustomTransaction', contract, [abi], parameters, value?.toString());
        // TODO: implement this method and remove this comment
        // https://github.com/telosnetwork/telos-wallet/issues/625

        const method = abi[0].name;
        if (abi.length > 1) {
            console.warn(
                `signCustomTransaction: abi contains more than one function,
                we asume the first one (${method}) is the one to be called`,
            );
        }

        return Promise.resolve({} as EvmTransactionResponse);
    }

    async wrapSystemToken(amount: BigNumber): Promise<EvmTransactionResponse> {
        this.trace('wrapSystemToken', amount.toString());
        const chainSettings = this.getChainSettings();
        const wrappedSystemTokenContractAddress = chainSettings.getWrappedSystemToken().address;
        let wrappedSystemTokenContractInstance: ethers.Contract | undefined;
        try {
            const signer = await this.getSigner();
            const wethContract = new ethers.Contract(wrappedSystemTokenContractAddress, wtlosAbiDeposit, signer);

            if (!wethContract) {
                this.trace('wrapSystemToken', 'address:', wrappedSystemTokenContractAddress, 'signer:', signer);
                throw 'Unable to get wrapped system contract instance';
            }
            wrappedSystemTokenContractInstance = wethContract;
        } catch (error) {
            throw new AntelopeError('antelope.wrap.error_getting_wrapped_contract', { error });
        }

        try {
            const transaction = (await wrappedSystemTokenContractInstance.deposit({ value: amount })) as EvmTransactionResponse;
            return transaction;
        } catch (error) {
            if ('ACTION_REJECTED' === ((error as { code: string }).code)) {
                throw new AntelopeError('antelope.evm.error_transaction_canceled');
            } else {
                console.error(error);
                throw new AntelopeError('antelope.wrap.error_wrap', { error });
            }
        }
    }

    async unwrapSystemToken(amount: BigNumber): Promise<EvmTransactionResponse> {
        this.trace('unwrapSystemToken', amount.toString());
        const chainSettings = this.getChainSettings();
        const wrappedSystemTokenContractAddress = chainSettings.getWrappedSystemToken().address;
        let wrappedSystemTokenContractInstance: ethers.Contract | undefined;

        try {
            const signer = await this.getSigner();
            const wrappedSystemTokenContract = new ethers.Contract(wrappedSystemTokenContractAddress, wtlosAbiWithdraw, signer);

            if (!wrappedSystemTokenContract) {
                this.trace('unwrapSystemToken', 'address:', wrappedSystemTokenContractAddress, 'signer:', signer);
                throw 'Unable to get wrapped system contract instance';
            }
            wrappedSystemTokenContractInstance = wrappedSystemTokenContract;
        } catch (error) {
            throw new AntelopeError('antelope.wrap.error_getting_wrapped_contract', { error });
        }

        try {
            const transaction = (await wrappedSystemTokenContractInstance.withdraw(amount)) as EvmTransactionResponse;
            return transaction;
        } catch (error) {
            if ('ACTION_REJECTED' === ((error as { code: string }).code)) {
                throw new AntelopeError('antelope.evm.error_transaction_canceled');
            } else {
                console.error(error);
                throw new AntelopeError('antelope.wrap.error_unwrap', { error });
            }
        }
    }

    async login(network: string): Promise<addressString | null> {
        const chainSettings = this.getChainSettings();
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
        const result:ethers.BigNumber = await contract.methods.balanceOf(account).call()
            .then((balance: never) => ethers.BigNumber.from(balance));
        this.trace('getERC20TokenBalance', [account], tokenAddress, '->', result.toString());
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

    /**
     * This method creates a Transaction to stake system tokens
     * @param amount amount of system tokens to stake
     * @returns transaction response with the hash and a wait() method to wait confirmation
     */
    async stakeSystemTokens(amount: BigNumber): Promise<EvmTransactionResponse> {
        this.trace('stakeSystemTokens', amount.toString());
        const stakedToken = this.getChainSettings().getStakedSystemToken();
        const evm = useEVMStore();
        const contract = await evm.getContract(this, stakedToken.address, stakedToken.type);
        if (contract) {
            const contractInstance = await contract.getContractInstance();
            const transaction = (await contractInstance.depositTLOS({ value: amount })) as EvmTransactionResponse;
            return transaction;
        } else {
            throw new AntelopeError('antelope.balances.error_token_contract_not_found', { address: stakedToken.address });
        }
    }

    /**
     * This method creates a Transaction to unstake system tokens
     * @param amount amount of system tokens to unstake
     * @returns transaction response with the hash and a wait() method to wait confirmation
     */
    async unstakeSystemTokens(amount: BigNumber): Promise<EvmTransactionResponse> {
        this.trace('unstakeSystemTokens', amount.toString());
        const stakedToken = this.getChainSettings().getStakedSystemToken();
        const evm = useEVMStore();
        const contract = await evm.getContract(this, stakedToken.address, stakedToken.type);
        if (contract) {
            const contractInstance = await contract.getContractInstance();
            const amountInWei = amount.toString();
            const address = this.getAccountAddress();
            return contractInstance.withdraw(amountInWei, address, address);
        } else {
            throw new AntelopeError('antelope.balances.error_token_contract_not_found', { address: stakedToken.address });
        }
    }

    /**
     * This method creates a Transaction to withdraw all unblocked staked tokens
     */
    async withdrawUnstakedTokens() : Promise<EvmTransactionResponse> {
        this.trace('withdrawUnstakedTokens');
        const contractInstance = await useRexStore().getEscrowContractInstance(this.label);
        return contractInstance.withdraw();
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
