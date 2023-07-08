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
import { createInitFunction, createTraceFunction } from 'src/antelope/stores/feedback';
import { initFuelUserWrapper } from 'src/api/fuel';
import {
    useFeedbackStore,
    useEVMStore,
} from 'src/antelope';
import { getAntelope, useChainStore } from 'src/antelope';
import { errorToString } from 'src/antelope/config';
import NativeChainSettings from 'src/antelope/chains/NativeChainSettings';
import {
    Action,
    Label,
    NativeTransactionResponse,
} from 'src/antelope/types';
import { getAccount, disconnect } from '@wagmi/core';
import { truncateAddress } from 'src/antelope/stores/utils/text-utils';

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
    address: string;
    displayAddress: string;
    isNative: false;
    associatedNative: string;
}


export interface AccountState {
    // accounts mapped by label
    __accounts: { [label: Label]: AccountModel };
}

const store_name = 'account';

export const useAccountStore = defineStore(store_name, {
    state: (): AccountState => (accountInitialState),
    getters: {
        isAuthenticated: state => !!state.__accounts['logged'],
        loggedAccount: state => state.__accounts['logged'],
        loggedIsNative: state => state.__accounts['logged']?.isNative,
        loggedEvmAccount: state => (state.__accounts['logged']?.isNative ?
            null : state.__accounts['logged']) as EvmAccountModel,
        loggedNativeAccount: state => (state.__accounts['logged']?.isNative ?
            state.__accounts['logged'] : null) as NativeAccountModel,
        currentAccount: state => ({ ...state.__accounts['current'] }),
        currentIsLogged: state =>
            state.__accounts['logged']?.account === state.__accounts['current']?.account &&
            state.__accounts['logged']?.network === state.__accounts['current']?.network,
        getAccount: state => (label: Label) => ({ ...state.__accounts[label] }),
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
                throw new Error('antelope.account.error_login_native');
            } finally {
                useFeedbackStore().unsetLoading('account.login');
            }
            return success;
        },

        async loginEVM({ network }: LoginEVMActionData): Promise<boolean> {
            this.trace('loginEVM', network);
            let success = false;
            let address = null;
            try {
                useFeedbackStore().setLoading('account.login');

                if (localStorage.getItem('wagmi.connected')){
                    address = getAccount().address;
                }else{
                    address = await useEVMStore().login(network);
                }

                if (address) {
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
                    console.error('Error: ', 'EVM login failed??');
                    throw new Error('antelope.account.error_login_evm');
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

                if (localStorage.getItem('wagmi.connected')){
                    disconnect();
                }

                if (this.__accounts['logged']?.isNative) {
                    const logged = this.__accounts['logged'] as NativeAccountModel;
                    const { authenticator } = logged;
                    try {
                        authenticator && (await authenticator.logout());
                    } catch (error) {
                        console.error('Authenticator logout error', error);
                    }
                }
                this.setLoggedAccount(null);
                getAntelope().events.onLoggedOut.next();
            } catch (error) {
                console.error('Error: ', errorToString(error));
            } finally {
                getAntelope().events.onLoggedOut.next();
            }
        },

        async autoLogin(): Promise<boolean> {
            this.trace('autoLogin');
            try {
                useFeedbackStore().setLoading('account.autoLogin');
                const network = localStorage.getItem('network');
                const account = localStorage.getItem('account');
                const isNative = localStorage.getItem('isNative') === 'true';
                const autoLogin = localStorage.getItem('autoLogin');
                this.trace('autoLogin', account, isNative, autoLogin);
                if (account && network && autoLogin && !this.__accounts['logged']) {
                    if (isNative) {
                        const authenticators = getAntelope().config.authenticatorsGetter();
                        const authenticator = authenticators.find(
                            a => a.getName() === autoLogin,
                        );
                        if (!authenticator) {
                            console.error(authenticators.map(a => a.getName()).join(', '));
                            throw new Error('antelope.account.error_auto_login');
                        }
                        this.loginNative({
                            authenticator,
                            network,
                        });
                    } else {
                        return this.loginEVM({ network });
                    }
                }
            } catch (error) {
                console.error('Error: ', errorToString(error));
            } finally {
                useFeedbackStore().unsetLoading('account.autoLogin');
            }
            return Promise.resolve(false);
        },
        async sendAction({ account, data, name, actor, permission }: SendActionData): Promise<NativeTransactionResponse> {
            this.trace('sendAction', account, data, name, actor, permission);
            try {
                useFeedbackStore().setLoading('account.sendAction');
                console.error('Account.sendAction() not implemented', account, data, name, actor, permission);
                return Promise.resolve({ hash: '0x0' } as NativeTransactionResponse);
            } catch (error) {
                console.error('Error: ', errorToString(error));
                throw error;
            } finally {
                useFeedbackStore().unsetLoading('account.sendAction');
            }
        },

        async sendTransaction(actions: Action[]) {
            this.trace('sendTransaction', actions);
            try {
                useFeedbackStore().setLoading('account.sendTransaction');
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
                    const chain = useChainStore().getChain(label).settings as NativeChainSettings;
                    const accountData = await chain.getAccount(nativeAccount.account);
                    nativeAccount.data = accountData;
                    if (label === 'logged') {
                        this.setLoggedAccount(nativeAccount);
                    }
                    if (label === 'current') {
                        this.setCurrentAccount(nativeAccount);
                    }
                } else {
                    // There's no account data for EVM accounts
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
            const label = 'current';
            const before = `${this.__accounts[label]?.account ?? ''} ${this.__accounts[label]?.network ?? ''}`;
            try {
                if (account) {
                    if (typeof account === 'string') {
                        const _account = {
                            account: account,
                            network: useChainStore().currentChain.settings.getNetwork(),
                            isNative: true,
                            data: null,
                        };
                        this.__accounts[label] = { ...this.__accounts[label], ..._account };
                    } else {
                        this.__accounts[label] = { ...this.__accounts[label], ...account };
                    }
                } else {
                    delete this.__accounts[label];
                }
            } catch (error) {
                console.error('Error: ', errorToString(error));
            } finally {
                const after = `${this.__accounts[label]?.account ?? ''} ${this.__accounts[label]?.network ?? ''}`;
                if (before !== after) {
                    getAntelope().events.onAccountChanged.next({
                        label, account: this.__accounts[label] as AccountModel,
                    });
                }
            }
        },

        setLoggedAccount(account: AccountModel | null) {
            this.trace('setLoggedAccount', account);
            const label = 'logged';
            const before = `${this.__accounts[label]?.account ?? ''} ${this.__accounts[label]?.network ?? ''}`;
            try {
                if (account) {
                    this.__accounts[label] = { ...this.__accounts[label], ...account };
                    useChainStore().setLoggedChain(account.network);
                } else {
                    delete this.__accounts[label];
                }
            } catch (error) {
                console.error('Error: ', errorToString(error));
            } finally {
                const after = `${this.__accounts[label]?.account ?? ''} ${this.__accounts[label]?.network ?? ''}`;
                if (before !== after) {
                    getAntelope().events.onAccountChanged.next({
                        label, account: this.__accounts[label] as AccountModel,
                    });
                }
            }
        },
    },
});

const accountInitialState: AccountState = {
    __accounts: {},
};

