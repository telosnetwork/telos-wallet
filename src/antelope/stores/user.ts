/**
 * User: This store is responsible for storing the user entity as a person.
 * A person may eventually have multiple accounts on different blockchains,
 * yet still be the same user.
 *
 * This store will keep track of a list of identified users, with each user
 * being assigned an auto-generated ID and an arbitrary name for local deployment.
 * Additionally, it will maintain a record of all the accounts that each user
 * has on different blockchains.
 *
 * All this information will exist only locally using localStorage and
 * will not be stored on any server.
 */

import { defineStore } from 'pinia';
import { createTraceFunction, errorToString } from 'src/antelope/config';
import { AccountModel } from 'src/antelope/stores/account';

// dependencies --
import {
    getAntelope,
    useFeedbackStore,
} from 'src/antelope';

export type AccountList = Array<AccountId>;

export interface UserModel {
    id: string; // auto-generated
    name: string; // arbitrary name
    accounts: AccountList;
}

export interface UserId {
    id: string;
    name: string;
}

export interface AccountId {
    network: string;
    account: string;
}

// should be updated as new locales and currencies are added, e.g.
//     export type SupportedCurrencyLocale = 'en-US' | 'es-ES';
//     export type SupportedCurrency = 'USD' | 'MXN';
// as locales/currencies are added, unit tests for prettyPrintCurrency should be updated to ensure
// new currency formats are properly displayed
export type SupportedCurrencyLocale = 'en-US';
export type SupportedCurrency = 'USD';

export interface UserCurrencyPreference {
    fiatLocale: SupportedCurrencyLocale;
    fiatCurrency: SupportedCurrency;
}

const defaultCurrencyPreferences: UserCurrencyPreference = {
    fiatLocale: 'en-US',
    fiatCurrency: 'USD',
};

export interface UserState {
    __user_id: string;
    __user_name: string;
    __user_accounts: AccountList;
    __all_users: Array<UserModel>;
    __preferred_fiat_currency: UserCurrencyPreference,
}
const LOCAL_STORAGE_KEY = 'user-store';
const CURRENCY_PREFERENCES_KEY = 'currency-preferences';

const store_name = 'user';

export const useUserStore = defineStore(store_name, {
    // convert to a function
    state: (): UserState => (userInitialState),
    getters: {
        id: state => state.__user_id,
        name: state => state.__user_name,
        accounts: state => state.__user_accounts,
        allUsers: state => state.__all_users,
        currencyPreferences: state => state.__preferred_fiat_currency,
        fiatLocale: state => state.__preferred_fiat_currency?.fiatLocale || '',
        fiatCurrency: state => state.__preferred_fiat_currency?.fiatCurrency || '',
    },
    actions: {
        trace: createTraceFunction(store_name),
        init: () => {
            const ant = getAntelope();
            // we want to react when the logged account changes
            ant.events.onLoggedIn.subscribe((acc: AccountModel) => useUserStore().handleAccountLoggedIn(acc));
            ant.events.onLoggedOut.subscribe(() => useUserStore().handleAccountLoggedOut());
        },
        async loadUsers(): Promise<void> {
            this.trace('loadUsers');
            try {
                useFeedbackStore().setLoading('user.loadUsers');
                const allUsers = localStorage.getItem(LOCAL_STORAGE_KEY) ?? '[]';
                this.setAllUsers(JSON.parse(allUsers) as Array<UserModel>);
            } catch (error) {
                console.error('Error: ', errorToString(error));
            } finally {
                useFeedbackStore().unsetLoading('user.loadUsers');
            }

            this.loadCurrencyPreferences();
        },
        loadCurrencyPreferences() {
            this.trace('loadCurrencyPreferences');
            let shouldSetDefaultPreferences = false;

            try {
                const { fiatLocale, fiatCurrency } = JSON.parse(localStorage.getItem(CURRENCY_PREFERENCES_KEY) || '{}');

                // if stored locale or currency is undefined, set both to defaults
                if (![typeof fiatLocale, typeof fiatCurrency].every(type => type === 'string')) {
                    shouldSetDefaultPreferences = true;
                } else {
                    this.setCurrencyPreferences({
                        fiatLocale,
                        fiatCurrency,
                    }, false);
                }

            } catch(error) {
                console.error('Error: ', errorToString(error));

                shouldSetDefaultPreferences = true;
            }

            if (shouldSetDefaultPreferences) {
                this.setCurrencyPreferences(defaultCurrencyPreferences, true);
            }
        },
        async saveUsers(): Promise<void> {
            this.trace('saveUsers');
            try {
                useFeedbackStore().setLoading('user.saveUsers');
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.allUsers));
            } catch (error) {
                console.error('Error: ', errorToString(error));
            } finally {
                useFeedbackStore().unsetLoading('user.saveUsers');
            }
        },
        // Logged Handlers ----------------
        handleAccountLoggedIn(logged: AccountModel) {
            this.trace('handleAccountLoggedIn', logged);
            try {
                const user = this.allUsers.find(u =>
                    u.accounts.map(pair => `${pair.account}@${pair.network}`).includes(`${logged.account}@${logged.network}`),
                );
                if (user) {
                    this.setUser(user as UserModel);
                } else {
                    const newUser: UserModel = {
                        id: Number(Math.random() * 1000000).toString(),
                        name: logged.account,
                        accounts: [{ account: logged.account, network: logged.network }],
                    };
                    this.addUser(newUser);
                    this.setUser(newUser);
                }
            } catch (error) {
                console.error('Error: ', errorToString(error));
            }
        },
        handleAccountLoggedOut(){
            try {
                this.removeUser(this.__user_id);
                this.__user_name = '';
                this.__user_id = '';
                this.__user_accounts = [];
            } catch (error) {
                console.error('Error: ', errorToString(error));
            }
        },
        // Setters ----------------
        editName(id: string, name: string) {
            this.trace('editName', id, name);
            try {
                const index = this.__all_users.map(u => u.id).indexOf(id);
                if (index !== -1) {
                    this.__all_users[index].name = name;
                }
                if (this.__user_id === id) {
                    this.__user_name = name;
                }
            } catch (error) {
                console.error('Error: ', errorToString(error));
            }
        },
        addAccount(id: string, network: string, account: string) {
            this.trace('addAccount', id, network, account);
            try {
                const index = this.__all_users.map(u => u.id).indexOf(id);
                if (index !== -1) {
                    const a_index = this.__all_users[index].accounts.map(a => a.account).indexOf(account);
                    if (a_index === -1) {
                        this.__all_users[index].accounts.push({ account, network });
                    }
                    this.saveUsers();
                }
                if (this.__user_id === id) {
                    const a_index = this.__user_accounts.map(a => a.account).indexOf(account);
                    if (a_index === -1) {
                        this.__user_accounts.push({ account, network });
                    }
                }
            } catch (error) {
                console.error('Error: ', errorToString(error));
            }
        },
        removeAccount(id: string, blockchain: string, account: string) {
            this.trace('removeAccount', id, blockchain, account);
            try {
                const index = this.__all_users.map(u => u.id).indexOf(id);
                if (index !== -1) {
                    this.__all_users[index].accounts = this.__all_users[index].accounts.filter(a => a.account !== account);
                    this.saveUsers();
                }
                if (this.__user_id === id) {
                    this.__user_accounts = this.__user_accounts.filter(a => a.account !== account);
                }
                console.error('User.removeAccount() not implemented. id: ', id, ' blockchain: ', blockchain, ' account: ', account);
            } catch (error) {
                console.error('Error: ', errorToString(error));
            }
        },
        setCurrentUser(id: string) {
            this.trace('setCurrentUser', id);
            try {
                // search for all user in the user list and set id, name and accounts for tat user as que current user
                const user = this.allUsers.find(u => u.id === id);
                if (user) {
                    this.setUser(user);
                }
                console.error('User.setCurrentUser() not implemented. id: ', id);
            } catch (error) {
                console.error('Error: ', errorToString(error));
            }
        },
        addUser(user: UserModel) {
            this.trace('addUser', user);
            try {
                this.__all_users.push(user);
                this.saveUsers();
            } catch (error)  {
                console.error('Error: ', errorToString(error));
            }
        },
        removeUser(id: string) {
            this.trace('removeUser', id);
            try {
                const index = this.__all_users.map(u => u.id).indexOf(id);
                if (index !== -1) {
                    this.__all_users.splice(index, 1);
                }
                this.saveUsers();
            } catch (error)  {
                console.error('Error: ', errorToString(error));
            }
        },
        setUser(user: UserModel) {
            this.trace('setUser', user);
            try {
                this.__user_name = user.name;
                this.__user_id = user.id;
                this.__user_accounts = user.accounts;
            } catch (error) {
                console.error('Error: ', errorToString(error));
            }
        },
        setAllUsers(users: Array<UserModel>) {
            this.trace('setAllUsers', users);
            try {
                this.__all_users = users;
            } catch (error) {
                console.error('Error: ', errorToString(error));
            }
        },
        setCurrencyPreferences(preferences: UserCurrencyPreference, setLocalStorage = false) {
            this.trace('setCurrencyPreferences', preferences);

            try {
                this.__preferred_fiat_currency = { ...preferences };

                if (setLocalStorage) {
                    localStorage.setItem(CURRENCY_PREFERENCES_KEY, JSON.stringify(preferences));
                }
            } catch (error) {
                console.error('Error: ', errorToString(error));

                this.__preferred_fiat_currency = { ...defaultCurrencyPreferences };

                if (setLocalStorage) {
                    localStorage.setItem(
                        CURRENCY_PREFERENCES_KEY,
                        JSON.stringify(defaultCurrencyPreferences),
                    );
                }
            }
        },
    },
});

export const userInitialState: UserState = {
    __user_id: '',
    __user_name: '',
    __user_accounts: [],
    __all_users: [],
    __preferred_fiat_currency: defaultCurrencyPreferences,
};

