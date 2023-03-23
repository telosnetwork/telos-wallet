/**
 * Profile: is responsible for obtaining and maintaining the profile data of the accounts stored in the Account store.
 *
 * Note: This store is highly specific to Telos Native and will not be available on any other chain.
 */


import { defineStore } from 'pinia';
import { AccountModel } from 'src/antelope/stores/account';
import { errorToString } from 'src/antelope/config';
import {
    createInitFunction,
    createTraceFunction,
} from 'src/antelope/stores/feedback';

export interface ProfileState {
    __: string;
}

const store_name = 'profile';

export const useProfileStore = defineStore(store_name, {
    state: (): ProfileState => (profileInitialState),
    getters: {
    },
    actions: {
        trace: createTraceFunction(store_name),
        init: createInitFunction(store_name),
        // Logged Handlers ----------------
        handleAccountLoggedIn(logged: AccountModel) {
            this.trace('handleAccountLoggedIn', logged);
            try {
                // TOOD: get profile data
            } catch (error) {
                console.error('Error: ', errorToString(error));
            }
        },
        handleAccountLoggedOut() {
            this.trace('handleAccountLoggedOut');
            try {
                // TOOD: clear profile data
            } catch (error) {
                console.error('Error: ', errorToString(error));
            }
        },
    },
});

const profileInitialState: ProfileState = {
    __: '',
};
