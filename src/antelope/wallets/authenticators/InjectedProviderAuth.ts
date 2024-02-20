

import { BigNumber, ethers } from 'ethers';
import { BehaviorSubject, filter, map } from 'rxjs';
import { useAccountStore, useChainStore, useEVMStore, useFeedbackStore } from 'src/antelope';
import {
    AntelopeError,
    EthereumProvider,
    EvmABI,
    EvmFunctionParam,
    EvmTransactionResponse,
    addressString,
} from 'src/antelope/types';
import { EVMAuthenticator } from 'src/antelope/wallets';
import { TELOS_NETWORK_NAMES, TELOS_ANALYTICS_EVENT_NAMES } from 'src/antelope/chains/chain-constants';
import { BraveAuthName, MetamaskAuthName, SafePalAuthName } from 'src/antelope/wallets';

export abstract class InjectedProviderAuth extends EVMAuthenticator {
    onReady = new BehaviorSubject<boolean>(false);

    // this is just a dummy label to identify the authenticator base class
    constructor(label: string) {
        super(label);
        this.initInjectedProvider(this);
    }

    async initInjectedProvider(authenticator: InjectedProviderAuth): Promise<void> {
        this.trace('initInjectedProvider', authenticator.getName(), [authenticator.getProvider()]);
        const provider: EthereumProvider | null = authenticator.getProvider();

        if (provider && !provider.__initialized) {
            this.trace('initInjectedProvider', authenticator.getName(), 'initializing provider');
            // ensure this provider actually has the correct methods
            // Check consistency of the provider
            const methods = ['request', 'on'];
            const candidate = provider as unknown as Record<string, unknown>;
            for (const method of methods) {
                if (typeof candidate[method] !== 'function') {
                    console.warn(`MetamaskAuth.getProvider: method ${method} not found`);
                    throw new AntelopeError('antelope.evm.error_invalid_provider');
                }
            }

            provider.on('accountsChanged', async (value) => {
                const accounts = value as string[];
                const network = useChainStore().currentChain.settings.getNetwork();
                this.trace('provider.accountsChanged', ...accounts);

                if (accounts.length > 0) {
                    // If we are here one of two possible things had happened:
                    // 1. The user has just logged in to the wallet
                    // 2. The user has switched the account in the wallet

                    // if we are in case 1, then we are in the middle of the login process and we don't need to do anything
                    // We can tell because the account store has no logged account

                    // But if we are in case 2 and have a logged account, we need to re-login the account using the same authenticator
                    // overwriting the previous logged account, which in turn will trigger all account data to be reloaded
                    if (useAccountStore().loggedAccount) {
                        // if the user is already authenticated we try to re login the account using the same authenticator
                        const authenticator = useAccountStore().loggedAccount.authenticator as EVMAuthenticator;
                        if (!authenticator) {
                            console.error('Inconsistency: logged account authenticator is null', authenticator);
                        } else {
                            useAccountStore().loginEVM({ authenticator,  network });
                        }
                    }
                } else {
                    // the user has disconnected the all the accounts from the wallet so we logout
                    useAccountStore().logout();
                }
            });

            // This initialized property is not part of the standard provider, it's just a flag to know if we already initialized the provider
            provider.__initialized = true;
            useEVMStore().addInjectedProvider(authenticator);
        }
        authenticator.onReady.next(true);
    }


    async login(network: string): Promise<addressString | null> {
        const chainSettings = this.getChainSettings();
        const authName = this.getName();

        this.trace('login', network);
        useFeedbackStore().setLoading(`${this.getName()}.login`);

        this.trace('login', 'trackAnalyticsEvent -> login started');
        chainSettings.trackAnalyticsEvent(TELOS_ANALYTICS_EVENT_NAMES.loginStarted);

        const response = await super.login(network).then((res) => {
            if (TELOS_NETWORK_NAMES.includes(network)) {
                let successfulLoginEventName = '';

                if (authName === MetamaskAuthName) {
                    successfulLoginEventName = TELOS_ANALYTICS_EVENT_NAMES.loginSuccessfulMetamask;
                } else if (authName === SafePalAuthName) {
                    successfulLoginEventName = TELOS_ANALYTICS_EVENT_NAMES.loginSuccessfulSafepal;
                } else if (authName === BraveAuthName) {
                    successfulLoginEventName = TELOS_ANALYTICS_EVENT_NAMES.loginSuccessfulBrave;
                }

                if (successfulLoginEventName) {
                    this.trace('login', 'trackAnalyticsEvent -> login succeeded', authName, successfulLoginEventName);
                    chainSettings.trackAnalyticsEvent(successfulLoginEventName);
                }

                this.trace('login', 'trackAnalyticsEvent -> generic login succeeded', authName, TELOS_ANALYTICS_EVENT_NAMES.loginSuccessful);
                chainSettings.trackAnalyticsEvent(TELOS_ANALYTICS_EVENT_NAMES.loginSuccessful);
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
                    failedLoginEventId = TELOS_ANALYTICS_EVENT_NAMES.loginFailedMetamask;
                } else if (authName === SafePalAuthName) {
                    failedLoginEventId = TELOS_ANALYTICS_EVENT_NAMES.loginFailedSafepal;
                } else if (authName === BraveAuthName) {
                    failedLoginEventId = TELOS_ANALYTICS_EVENT_NAMES.loginFailedBrave;
                }

                if (failedLoginEventId) {
                    this.trace('login', 'trackAnalyticsEvent -> login failed', authName, failedLoginEventId);
                    chainSettings.trackAnalyticsEvent(failedLoginEventId);
                }
            }
        }).finally(() => {
            useFeedbackStore().unsetLoading(`${this.getName()}.login`);
        });

        return response ?? null;
    }

    abstract getProvider(): EthereumProvider | null;

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleCatchError(error: any): AntelopeError {
        this.trace('handleCatchError', error);
        if ('ACTION_REJECTED' === ((error as {code:string}).code)) {
            return new AntelopeError('antelope.evm.error_transaction_canceled');
        } else {
            // unknown error we print on console
            console.error(error);
            return new AntelopeError('antelope.evm.error_send_transaction', { error });
        }
    }

    // this action is used by MetamaskAuth.transferTokens()
    async sendSystemToken(to: string, amount: ethers.BigNumber): Promise<EvmTransactionResponse> {
        this.trace('sendSystemToken', to, amount);
        const value = amount.toHexString();

        // Send the transaction
        return (await this.getSigner()).sendTransaction({
            to,
            value,
        }).then(
            (transaction: ethers.providers.TransactionResponse) => transaction,
        ).catch((error) => {
            throw this.handleCatchError(error);
        });
    }

    // EVMAuthenticator API ----------------------------------------------------------

    async signCustomTransaction(contract: string, abi: EvmABI, parameters: EvmFunctionParam[], value?: BigNumber): Promise<EvmTransactionResponse> {
        this.trace('signCustomTransaction', contract, [abi], parameters, value?.toString());

        const method = abi[0].name;
        if (abi.length > 1) {
            console.warn(
                `signCustomTransaction: abi contains more than one function,
                we asume the first one (${method}) is the one to be called`,
            );
        }

        const signer = await this.getSigner();
        const contractInstance = new ethers.Contract(contract, abi, signer);
        const transaction = await contractInstance[method](...parameters, { value });
        return transaction;
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
