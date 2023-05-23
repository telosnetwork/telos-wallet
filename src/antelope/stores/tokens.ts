/**
 * Tokens: This store is responsible for fetching and providing a list of tokens for the current network.
 */


import { defineStore } from 'pinia';
import {
    createTraceFunction,
    isTracingAll,
    useFeedbackStore,
} from 'src/antelope/stores/feedback';
import {
    Label,
} from 'src/antelope/types';
import { getAntelope, useAccountStore } from '..';
import { toRaw } from 'vue';
import {
    ChainModel,
    useChainStore,
} from 'src/antelope/stores/chain';
import NativeChainSettings from 'src/antelope/chains/NativeChainSettings';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { errorToString } from 'src/antelope/config';
import { filter } from 'rxjs';
import { TokenClass } from 'src/antelope/chains/Token';

export interface TokensState {
    __tokens:  { [label: Label]: TokenClass[] };
}

const store_name = 'tokens';

export const useTokensStore = defineStore(store_name, {
    state: (): TokensState => (tokensInitialState),
    getters: {
        loggedTokens: state => state.__tokens['logged'],
        currentTokens: state => state.__tokens['current'],
        getTokens: state => (label: string) => state.__tokens[label],
    },
    actions: {
        trace: createTraceFunction(store_name),
        init: () => {
            useFeedbackStore().setDebug(store_name, isTracingAll());
            getAntelope().events.onNetworkChanged.pipe(
                filter(e => e.label === 'current'),
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
                if (chain.settings.isNative()) {
                    const chain_settings = chain.settings as NativeChainSettings;
                    tokens = await chain_settings.getTokenList();
                } else {
                    const chain_settings = chain.settings as EVMChainSettings;
                    tokens = await chain_settings.getTokenList();
                    this.__tokens[label] = tokens;
                }
                const accountStore = useAccountStore();
                if (accountStore.currentIsLogged && label === 'current') {
                    this.__tokens['logged'] = tokens;
                }
                this.trace('updateTokensForNetwork', 'token: ', tokens);

            } catch (error) {
                console.error('Error: ', errorToString(error));
            }
        },
    },
});

const tokensInitialState: TokensState = {
    __tokens: {},
};
