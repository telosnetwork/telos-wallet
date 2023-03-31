/**
 * History: This store is responsible for obtaining transaction histories for accounts,
 * handling filtered pagination and exploring transaction details.
 *
 * The History store provides a set of methods for retrieving transaction histories for
 * specific accounts. It supports pagination and filtering of results, making it easy
 * to navigate through large sets of transaction data.
 *
 * At any given time, it is possible to designate a specific transaction as the "current"
 * transaction, which can be used to retrieve detailed information about that transaction.
 *
 */



import { defineStore } from 'pinia';
import {
    createInitFunction,
    createTraceFunction,
} from 'src/antelope/stores/feedback';


export interface HistoryState {
    __: string;
}

const store_name = 'history';

export const useHistoryStore = defineStore(store_name, {
    state: (): HistoryState => (historyInitialState),
    getters: {
    },
    actions: {
        trace: createTraceFunction(store_name),
        init: createInitFunction(store_name),
    },
});

const historyInitialState: HistoryState = {
    __: '',
};
