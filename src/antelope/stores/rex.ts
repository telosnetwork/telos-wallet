/**
 * REX: This store is responsible for accessing and interacting with the EOSIO REX contract.
 *
 * When any of the accounts in the Account store change, the handles are called to retrieve
 * the state of that account in the REX system.
 */

import { defineStore } from 'pinia';
import { AccountModel } from 'src/antelope/stores/account';
import { errorToString } from 'src/antelope/config';
import {
    createInitFunction,
    createTraceFunction,
} from 'src/antelope/stores/feedback';

export interface RexState {
    __: string;
}

const store_name = 'rex';

export const useRexStore = defineStore(store_name, {
    state: (): RexState => (rexInitialState),
    getters: {
    },
    actions: {
        trace: createTraceFunction(store_name),
        init: createInitFunction(store_name),
        // Logged Handlers ----------------
        handleAccountLoggedIn(logged: AccountModel) {
            this.trace('handleAccountLoggedIn', logged);
            try {
                // TOOD: get rex data for the logged account
            } catch (error) {
                console.error('Error: ', errorToString(error));
            }
        },
        handleAccountLoggedOut() {
            this.trace('handleAccountLoggedOut');
            try {
                // TOOD: clear rex data
            } catch (error) {
                console.error('Error: ', errorToString(error));
            }
        },
    },
});

const rexInitialState: RexState = {
    __: '',
};
