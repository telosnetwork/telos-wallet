/**
 * Tokens: This store is responsible for fetching and providing a list of tokens for the current network.
 */

import { defineStore } from 'pinia';
import {
    Label, TokenClass,
} from 'src/antelope/types';
import { getAntelope, useFeedbackStore, useChainStore, CURRENT_CONTEXT } from 'src/antelope';
import { toRaw } from 'vue';
import { errorToString } from 'src/antelope/config';
import { filter } from 'rxjs';
import { createTraceFunction, isTracingAll } from 'src/antelope/stores/feedback';
import { ChainModel } from 'src/antelope/stores/chain';

export interface TokensState {
    __tokens:  { [label: Label]: TokenClass[] };
}

const store_name = 'tokens';

export const useTokensStore = defineStore(store_name, {
    state: (): TokensState => (tokensInitialState),
    getters: {
        loggedTokens: state => state.__tokens[CURRENT_CONTEXT],
        currentTokens: state => state.__tokens[CURRENT_CONTEXT],
        getTokens: state => (label: string) => state.__tokens[label],
    },
    actions: {
        trace: createTraceFunction(store_name),
        init: () => {
            useFeedbackStore().setDebug(store_name, isTracingAll());
            getAntelope().events.onNetworkChanged.pipe(
                filter(e => e.label === CURRENT_CONTEXT),
            ).subscribe({
                next: ({ label, chain }) => {
                    useTokensStore().updateTokensForNetwork(label, toRaw(chain));
                },
            });
        },
        async updateTokensForNetwork(label: string, account: ChainModel) {
            this.trace('updateTokensForNetwork', label, account);
            try {
                useFeedbackStore().setLoading('updateTokensForNetwork');
                const chain = useChainStore().getChain(label);
                let tokens: TokenClass[] = [];
                tokens = await chain.settings.getTokenList();
                this.__tokens[label] = tokens;
                this.trace('updateTokensForNetwork', 'token: ', tokens);
            } catch (error) {
                console.error('Error: ', errorToString(error));
            } finally {
                useFeedbackStore().unsetLoading('updateTokensForNetwork');
            }
        },
    },
});

const tokensInitialState: TokensState = {
    __tokens: {},
};
