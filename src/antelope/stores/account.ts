/**
 * Account: This store is responsible for two closely related main tasks:
 *
 * The first task has to do with user authentication, where the user can use any of their accounts to log in,
 * which will require interaction with different wallets. Once authenticated, this store will be responsible
 * for maintaining the account information with the loggedAccount identifier, which will be used for all signed
 * operations of the application.
 *
 * The second task is more related to the exploration of other accounts, which are not necessarily those of the
 * authenticated user. For this, another identifier, the currentAccount, will be maintained, which will be used
 * to identify the account being explored at that time. This identifier can be the same as loggedAccount or not.
 * Either way, both identifiers will exist at the same time.
 */


import { Authenticator, User } from 'universal-authenticator-library';
import { defineStore } from 'pinia';
import { API } from '@greymass/eosio';
import { initFuelUserWrapper } from 'src/api/fuel';
import { createTraceFunction, errorToString } from 'src/antelope/config';
import NativeChainSettings from 'src/antelope/chains/NativeChainSettings';
import {
    Label,
    NativeTransactionResponse,
    addressString,
} from 'src/antelope/types';
import { EVMAuthenticator } from 'src/antelope/wallets';
import { truncateAddress } from 'src/antelope/stores/utils/text-utils';
import { toRaw } from 'vue';
import { getAddress } from 'ethers/lib/utils';

// dependencies --
import {
    CURRENT_CONTEXT,
    getAntelope,
    useChainStore,
    useFeedbackStore,
} from 'src/antelope';


export interface loginZeroActionData {
    authenticator: Authenticator,
    network: string,
}

export interface LoginEVMActionData {
    authenticator: EVMAuthenticator
    network: string,
    autoLogAccount?: string,
}

export interface SendActionData {
    name: string;       // action name
    account: string;    // contract account
    data: unknown;      // action data
    actor: string;      // account performing the action
    permission: string; // permission to use
}

export interface AccountModel {
    network: string;
    account: string | addressString;
    isNative: boolean;
    data: API.v1.AccountObject | null;
    authenticator: Authenticator | EVMAuthenticator;
}

export interface NativeAccountModel extends AccountModel {
    ualUser: User;
    isNative: true;
    associatedEvm: string;
    permission: string;
    authenticator: Authenticator;
}

export interface EvmAccountModel extends AccountModel {
    address: addressString;
    displayAddress: string;
    isNative: false;
    associatedNative: string;
    authenticator: EVMAuthenticator;
}

export interface AccountState {
    // accounts mapped by label
    __accounts: { [label: Label]: AccountModel };
}

const store_name = 'account';

export const useAccountStore = defineStore(store_name, {
    state: (): AccountState => (accountInitialState),
    getters: {
        isAuthenticated: state => !!state.__accounts[CURRENT_CONTEXT],
        loggedAccount: state => state.__accounts[CURRENT_CONTEXT],
        loggedIsNative: state => state.__accounts[CURRENT_CONTEXT]?.isNative,
        loggedEvmAccount: state => (state.__accounts[CURRENT_CONTEXT]?.isNative ?
            null : state.__accounts[CURRENT_CONTEXT]) as EvmAccountModel,
        loggedNativeAccount: state => (state.__accounts[CURRENT_CONTEXT]?.isNative ?
            state.__accounts[CURRENT_CONTEXT] : null) as NativeAccountModel,
        currentAccount: state => ({ ...state.__accounts[CURRENT_CONTEXT] }),
        currentEvmAccount: state => (state.__accounts[CURRENT_CONTEXT]?.isNative ?
            null : state.__accounts[CURRENT_CONTEXT]) as EvmAccountModel,
        currentIsLogged: state =>
            state.__accounts[CURRENT_CONTEXT]?.account === state.__accounts[CURRENT_CONTEXT]?.account &&
            state.__accounts[CURRENT_CONTEXT]?.network === state.__accounts[CURRENT_CONTEXT]?.network,
        getAccount: state => (label: Label) => ({ ...state.__accounts[label] }),
        getAuthenticator: state => (label: Label) => state.__accounts[label]?.authenticator,
        getEVMAuthenticator: state => (label: Label) => state.__accounts[label]?.authenticator as EVMAuthenticator,
        getNativeAuthenticator: state => (label: Label) => state.__accounts[label]?.authenticator as Authenticator,
    },
    actions: {
        trace: createTraceFunction(store_name),
        async loginZero({ authenticator, network }: loginZeroActionData): Promise<boolean> {
            this.trace('loginZero', authenticator, network);
            let success = false;
            try {
                this.trace('loginZero', 'authenticator.init()...');
                await authenticator.init();
                this.trace('loginZero', 'authenticator.login()...');
                const ualUsers = await authenticator.login();
                if (ualUsers?.length) {
                    this.trace('loginZero', 'authenticator.login() OK! ualUsers:', ualUsers);
                    const ualUser = await initFuelUserWrapper(ualUsers[0]);
                    const permission = (ualUser as unknown as { requestPermission: string })
                        .requestPermission ?? 'active';
                    const account = await ualUser.getAccountName();

                    const nativeAccount = {
                        network,
                        account,
                        isNative: true,
                        associatedEvm: '',
                        data: null,
                        ualUser,
                        permission,
                        authenticator,
                    } as NativeAccountModel;
                    this.setAccount(nativeAccount);
                    localStorage.setItem('network', network);
                    localStorage.setItem('account', account);
                    localStorage.setItem('isNative', 'true');
                    localStorage.setItem('autoLogin', authenticator.getName());

                    success = true;
                    this.fetchAccountDataFor(CURRENT_CONTEXT, nativeAccount);
                    getAntelope().events.onLoggedIn.next(nativeAccount);
                }
            } catch (error) {
                console.error('Error: ', errorToString(error));
                throw new Error('antelope.account.error_login_native');
            }
            return success;
        },

        async loginEVM({ authenticator, network, autoLogAccount }: LoginEVMActionData): Promise<boolean> {
            this.trace('loginEVM', network);
            const label = authenticator.label;
            getAntelope().events.onClear.next({ label });

            let success = false;
            try {
                const rawAddress = autoLogAccount ? await authenticator.autoLogin(network, autoLogAccount) : await authenticator.login(network);
                this.trace('loginEVM', 'authenticator finished with address', rawAddress);

                if (rawAddress) {
                    const address = getAddress(rawAddress) as addressString;

                    const displayAddress = truncateAddress(address);

                    const account = address;

                    const evmAccount:EvmAccountModel = {
                        network,
                        address,
                        account,
                        isNative: false,
                        associatedNative: '',
                        data: null,
                        displayAddress,
                        authenticator,
                    };
                    this.setAccount(evmAccount);

                    localStorage.setItem('network', network);
                    localStorage.setItem('account', account);
                    localStorage.setItem('rawAddress', rawAddress);
                    localStorage.setItem('isNative', 'false');
                    localStorage.setItem('autoLogin', authenticator.getName());
                    success = true;
                    this.fetchAccountDataFor(CURRENT_CONTEXT, evmAccount);
                    getAntelope().events.onLoggedIn.next(evmAccount);
                } else {
                    console.error('Error: ', 'EVM login failed??');
                    throw new Error('antelope.account.error_login_evm');
                }
            } catch (error) {
                console.error('Error: ', error);
            } finally {
                useFeedbackStore().unsetLoading(`${authenticator.getName()}.login`);
            }
            return success;
        },

        async logout() {
            this.trace('logout');

            try {

                const logged = this.__accounts[CURRENT_CONTEXT];
                const { authenticator } = logged;

                if (authenticator instanceof EVMAuthenticator) {
                    const label = authenticator.label;
                    getAntelope().events.onClear.next({ label });
                }

                localStorage.removeItem('network');
                localStorage.removeItem('account');
                localStorage.removeItem('isNative');
                localStorage.removeItem('autoLogin');

                try {
                    authenticator && (await authenticator.logout());
                } catch (error) {
                    console.error('Authenticator logout error', error);
                }

                this.setAccount(null);
                getAntelope().events.onLoggedOut.next();
            } catch (error) {
                console.error('Error: ', errorToString(error));
            } finally {
                getAntelope().events.onLoggedOut.next();
            }
        },

        async autoLogin(): Promise<boolean> {
            this.trace('autoLogin');
            const label = CURRENT_CONTEXT;
            try {
                useFeedbackStore().setLoading('account.autoLogin');
                const network = localStorage.getItem('network');
                const account = localStorage.getItem('account');
                const rawAddress = localStorage.getItem('rawAddress');
                const isNative = localStorage.getItem('isNative') === 'true';
                const autoLogin = localStorage.getItem('autoLogin');
                this.trace('autoLogin', account, network, autoLogin, isNative, this.__accounts[label]);
                if (account && network && autoLogin && !this.__accounts[label]) {
                    // Ensure we are working with the correct network
                    useChainStore().setChain(label, network);
                    if (isNative) {
                        const authenticators = getAntelope().config.authenticatorsGetter();
                        const authenticator = authenticators.find(
                            a => a.getName() === autoLogin,
                        );
                        if (!authenticator) {
                            console.error(authenticators.map(a => a.getName()).join(', '));
                            throw new Error('antelope.account.error_auto_login');
                        }
                        this.loginZero({
                            authenticator,
                            network,
                        });
                    } else {
                        const authenticator = getAntelope().wallets.getEVMAuthenticator(autoLogin)?.newInstance(label);
                        if (!authenticator) {
                            console.error(getAntelope().wallets);
                            throw new Error('antelope.account.error_auto_login');
                        }
                        const autoLogAccount = rawAddress ?? account;
                        return this.loginEVM({
                            authenticator,
                            network,
                            autoLogAccount,
                        });
                    }
                } else {
                    this.trace('autoLogin', 'canceled!', account, network, autoLogin, !this.__accounts[label]);
                }
            } catch (error) {
                console.error('Error: ', errorToString(error));
            } finally {
                useFeedbackStore().unsetLoading('account.autoLogin');
            }
            return Promise.resolve(false);
        },

        async isConnectedToCorrectNetwork(label: string): Promise<boolean> {
            this.trace('isConnectedToCorrectNetwork', label);
            try {
                useFeedbackStore().setLoading('account.isConnectedToCorrectNetwork');
                const authenticator = useAccountStore().getAccount(label)?.authenticator as EVMAuthenticator;
                return authenticator.isConnectedToCorrectChain();
            } catch (error) {
                console.error('Error: ', errorToString(error));
                return Promise.resolve(false);
            } finally {
                useFeedbackStore().unsetLoading('account.isConnectedToCorrectNetwork');
            }
        },

        async assertNetworkConnection(label: string): Promise<boolean> {
            if (!await useAccountStore().isConnectedToCorrectNetwork(label)) {
                return new Promise<boolean>(async (resolve) => {
                    const ant = getAntelope();
                    const authenticator = useAccountStore().loggedAccount.authenticator as EVMAuthenticator;
                    try {
                        await authenticator.ensureCorrectChain();
                        if (!await useAccountStore().isConnectedToCorrectNetwork(label)) {
                            resolve(false);
                        } else {
                            resolve(true);
                        }
                    } catch (error) {
                        const message = (error as Error).message;
                        if (message === 'antelope.evm.error_switch_chain_rejected') {
                            ant.config.notifyNeutralMessageHandler(message);
                        }
                        resolve(false);
                    }
                });
            } else {
                return true;
            }
        },

        async sendAction({ account, data, name, actor, permission }: SendActionData): Promise<NativeTransactionResponse> {
            this.trace('sendAction', account, data, name, actor, permission);
            try {
                useFeedbackStore().setLoading('account.sendAction');
                return Promise.resolve({ hash: '0x0' } as NativeTransactionResponse);
            } catch (error) {
                console.error('Error: ', errorToString(error));
                throw error;
            } finally {
                useFeedbackStore().unsetLoading('account.sendAction');
            }
        },

        async fetchAccountDataFor(label: string, account: AccountModel) {
            this.trace('fetchAccountDataFor', account);
            try {
                useFeedbackStore().setLoading('account.fetchAccountDataFor');
                if (account.isNative) {
                    const nativeAccount = account as NativeAccountModel;
                    const chain = useChainStore().getChain(label).settings as NativeChainSettings;
                    const accountData = await chain.getAccount(nativeAccount.account);
                    nativeAccount.data = accountData;
                    this.setAccount(nativeAccount);
                } else {
                    // There's no account data for EVM accounts
                }
            } catch (error) {
                console.error('Error: ', errorToString(error));
            } finally {
                useFeedbackStore().unsetLoading('account.fetchAccountDataFor');
            }
        },

        // commits -------
        setAccount(account: AccountModel | null) {
            this.trace('setAccount', account);
            const label = CURRENT_CONTEXT;
            const before = `${this.__accounts[label]?.account ?? ''} ${this.__accounts[label]?.network ?? ''}`;
            try {
                if (account) {
                    this.__accounts[label] = { ...this.__accounts[label], ...account };
                    useChainStore().setChain(label, account.network);
                } else {
                    delete this.__accounts[label];
                }
            } catch (error) {
                console.error('Error: ', errorToString(error));
            } finally {
                const after = `${this.__accounts[label]?.account ?? ''} ${this.__accounts[label]?.network ?? ''}`;
                if (before !== after) {
                    getAntelope().events.onAccountChanged.next({
                        label, account: toRaw(this.__accounts[label]) as AccountModel,
                    });
                }
            }
        },
    },
});

const accountInitialState: AccountState = {
    __accounts: {},
};
