/**
 * Tokens: This store is responsible for accessing the list of known tokens on the network to which
 * the current or logged-in account belongs.
 */


import { defineStore } from 'pinia';
import {
    createInitFunction,
    createTraceFunction,
} from 'src/antelope/stores/feedback';

export interface TokensState {
    __: string;
}

const store_name = 'tokens';

export const useTokensStore = defineStore(store_name, {
    state: (): TokensState => (tokensInitialState),
    getters: {
    },
    actions: {
        trace: createTraceFunction(store_name),
        init: createInitFunction(store_name),
    },
});

const tokensInitialState: TokensState = {
    __: '',
};
