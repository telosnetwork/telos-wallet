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
import { useChainStore } from 'src/antelope/stores/chain';
import { Action } from 'src/types/Actions';
import { FuelUserWrapper } from 'src/api/fuel';
import {
    createInitFunction,
    createTraceFunction,
    useFeedbackStore,
} from 'src/antelope/stores/feedback';
import { useEVMStore } from 'src/antelope/stores/evm';
import NativeChain from 'src/antelope/chains/NativeChain';
import { getAntelope } from '..';
import { errorToString } from 'src/antelope/config';

export interface LoginNativeActionData {
    authenticator: Authenticator,
    network: string,
}

export interface LoginEVMActionData {
    network: string,
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
    account: string;
    isNative: boolean;
    data: API.v1.AccountObject | null;
}

export interface NativeAccountModel extends AccountModel {
    ualUser: User;
    isNative: true;
    associatedEvm: string;
    permission: string;
    authenticator: Authenticator;
}

export interface EvmAccountModel extends AccountModel {
    isNative: false;
    associatedNative: string;
}


export interface AccountState {
    // reference to the logged account (authenticated with wallet or cleos)
    __logged_account: AccountModel | null;
    // reference to the current account (the one being explored in the app)
    __current_account: AccountModel | null;
}

const store_name = 'account';

export const useAccountStore = defineStore(store_name, {
    state: (): AccountState => (accountInitialState),
    getters: {
        isAuthenticated: state => !!state.__logged_account,
        loggedAccount: state => ({ ...state.__logged_account }),
        currentAccount: state => ({ ...state.__current_account }),
        currentIsLogged: state =>
            state.__logged_account?.account === state.__current_account?.account &&
            state.__logged_account?.network === state.__current_account?.network,
    },
    actions: {
        trace: createTraceFunction(store_name),
        init: createInitFunction(store_name),
        async loginNative({ authenticator, network }: LoginNativeActionData): Promise<boolean> {
            this.trace('loginNative', authenticator, network);
            let success = false;
            try {
                useFeedbackStore().setLoading('account.login');
                await authenticator.init();
                const ualUsers = await authenticator.login();
                if (ualUsers?.length) {
                    const ualUser = new FuelUserWrapper(ualUsers[0]);
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
                    this.setCurrentAccount(nativeAccount);
                    this.setLoggedAccount(nativeAccount);

                    localStorage.setItem('network', network);
                    localStorage.setItem('account', account);
                    localStorage.setItem('isNative', 'true');
                    localStorage.setItem('autoLogin', authenticator.getName());

                    success = true;
                    this.fetchAccountDataFor('logged', nativeAccount);
                    getAntelope().events.onLoggedIn.next(nativeAccount);
                }
            } catch (error) {
                console.error('Error: ', errorToString(error));
                throw new Error('antelope.stores.account.error_login_native');
            } finally {
                useFeedbackStore().unsetLoading('account.login');
            }
            return success;
        },
        async loginEVM({ network }: LoginEVMActionData): Promise<boolean> {
            this.trace('loginEVM', network);
            let success = false;
            try {
                useFeedbackStore().setLoading('account.login');

                const address = await useEVMStore().login(network);
                if (address) {
                    const account = address;
                    const evmAccount:EvmAccountModel = {
                        network,
                        account,
                        isNative: false,
                        associatedNative: '',
                        data: null,
                    };
                    this.setLoggedAccount(evmAccount);

                    localStorage.setItem('network', network);
                    localStorage.setItem('account', account);
                    localStorage.setItem('isNative', 'false');
                    localStorage.setItem('autoLogin', 'evm');
                    success = true;
                    this.fetchAccountDataFor('logged', evmAccount);
                    getAntelope().events.onLoggedIn.next(evmAccount);
                } else {
                    // TODO: check when and how does this error happends if ever
                    console.error('Error: ', 'EVM login failed??');
                    throw new Error('antelope.stores.account.error_login_evm');
                }
            } catch (error) {
                console.error('Error: ', errorToString(error));
            } finally {
                useFeedbackStore().unsetLoading('account.login');
            }
            return success;
        },
        async logout() {
            this.trace('logout');
            try {
                localStorage.removeItem('network');
                localStorage.removeItem('account');
                localStorage.removeItem('isNative');
                localStorage.removeItem('autoLogin');

                if (this.__logged_account?.isNative) {
                    const logged = this.__logged_account as NativeAccountModel;
                    const { authenticator } = logged;
                    try {
                        authenticator && (await authenticator.logout());
                    } catch (error) {
                        console.log('Authenticator logout error', error);
                    }
                } else {
                    // useEVMStore().logout(); ?
                }
                this.setLoggedAccount(null);
                getAntelope().events.onLoggedOut.next();
            } catch (error) {
                console.error('Error: ', errorToString(error));
            } finally {
                getAntelope().events.onLoggedOut.next();
            }
        },
        async autoLogin() {
            this.trace('autoLogin');
            try {
                useFeedbackStore().setLoading('account.autoLogin');
                const network = localStorage.getItem('network') ?? useChainStore().__current_Chain.settings.getNetwork();
                const account = localStorage.getItem('account');
                const isNative = localStorage.getItem('isNative') === 'true';
                const autoLogin = localStorage.getItem('autoLogin');
                this.trace('autoLogin', account, isNative, autoLogin);
                if (account && !this.__logged_account) {
                    if (isNative) {
                        const authenticators = getAntelope().config.authenticatorsGetter();
                        const authenticator = authenticators.find(
                            a => a.getName() === autoLogin,
                        );
                        if (!authenticator) {
                            console.log(authenticators.map(a => a.getName()).join(', '));
                            throw new Error('antelope.stores.account.error_auto_login');
                        }
                        this.loginNative({
                            authenticator,
                            network,
                        });
                    } else {
                        this.loginEVM({ network });
                    }
                } else {
                    return null;
                }
            } catch (error) {
                console.error('Error: ', errorToString(error));
            } finally {
                useFeedbackStore().unsetLoading('account.autoLogin');
            }
        },
        async sendAction({ account, data, name, actor, permission }: SendActionData) {
            this.trace('sendAction', account, data, name, actor, permission);
            try {
                useFeedbackStore().setLoading('account.sendAction');
                // TODO: creates a list of one transaction and use the sendTransaction() function
                console.error('Account.sendAction() not implemented', account, data, name, actor, permission);
            } catch (error) {
                console.error('Error: ', errorToString(error));
            } finally {
                useFeedbackStore().unsetLoading('account.sendAction');
            }
        },
        async sendTransaction(actions: Action[]) {
            this.trace('sendTransaction', actions);
            try {
                useFeedbackStore().setLoading('account.sendTransaction');
                // TODO: creates a transaction with the actions and interacts with wallet and try to send a transaction
                console.error('Account.sendTransaction() not implemented', actions);
            } catch (error) {
                console.error('Error: ', errorToString(error));
            }
        },
        async fetchAccountDataFor(label: string, account: AccountModel) {
            this.trace('fetchAccountDataFor', account);
            try {
                useFeedbackStore().setLoading('account.fetchAccountDataFor');
                if (account.isNative) {
                    const nativeAccount = account as NativeAccountModel;
                    const chain = useChainStore().getChain(label).settings as NativeChain;
                    const accountData = await chain.getAccount(nativeAccount.account);
                    nativeAccount.data = accountData;
                    if (label === 'logged') {
                        this.setLoggedAccount(nativeAccount);
                    }
                    if (label === 'current') {
                        this.setCurrentAccount(nativeAccount);
                    }
                } else {
                    // TODO: implement EVM if there's a need
                    console.error('Accounts.fetchAccountDataFor() not implemented for EVM');
                }
            } catch (error) {
                console.error('Error: ', errorToString(error));
            } finally {
                useFeedbackStore().unsetLoading('account.fetchAccountDataFor');
            }
        },
        // commits
        setCurrentAccount(account: AccountModel | null | string) {
            this.trace('setCurrentAccount', account);
            const before = `${this.__current_account?.account ?? ''} ${this.__current_account?.network ?? ''}`;
            try {
                if (account) {
                    if (typeof account === 'string') {
                        const _account = {
                            account: account,
                            network: useChainStore().currentChain.settings.getNetwork(),
                            isNative: true,
                            data: null,
                        };
                        this.__current_account = { ...this.__current_account, ..._account };
                    } else {
                        this.__current_account = { ...this.__current_account, ...account };
                    }
                } else {
                    this.__current_account = null;
                }
            } catch (error) {
                console.error('Error: ', errorToString(error));
            } finally {
                const after = `${this.__current_account?.account ?? ''} ${this.__current_account?.network ?? ''}`;
                if (before !== after) {
                    getAntelope().events.onAccountChanged.next({
                        label: 'current',
                        account: this.currentAccount ? this.currentAccount as AccountModel : null,
                    });
                }
            }
        },
        setLoggedAccount(account: AccountModel | null) {
            this.trace('setLoggedAccount', account);
            try {
                if (account) {
                    this.__logged_account = { ...this.__logged_account, ...account };
                    useChainStore().setLoggedChain(account.network);
                    // TODO: this.setCurrentAccount(account);
                } else {
                    this.__logged_account = null;
                }
            } catch (error) {
                console.error('Error: ', errorToString(error));
            }
        },
    },
});

const accountInitialState: AccountState = {
    __logged_account: null,
    __current_account: null,
};

