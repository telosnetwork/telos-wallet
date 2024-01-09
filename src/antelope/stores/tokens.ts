/**
 * Tokens: This store is responsible for fetching and providing a list of tokens for the current network.
 */

import { defineStore } from 'pinia';
import {
    AntelopeError,
    Label,
    TokenClass,
    TokenPrice,
} from 'src/antelope/types';
import { toRaw } from 'vue';
import { createTraceFunction, errorToString } from 'src/antelope/config';
import { filter } from 'rxjs';
import { ChainModel } from 'src/antelope/stores/chain';
import { dateIsWithinXMinutes } from 'src/antelope/stores/utils/date-utils';
import { getTokenPriceDataFromIndexer } from 'src/api/price';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';

// dependencies --
import {
    CURRENT_CONTEXT,
    getAntelope,
    useFeedbackStore,
    useChainStore,
} from 'src/antelope';


export interface TokensState {
    __tokens:  { [label: Label]: TokenClass[] };
    __prices: {
        [network: string]: { // e.g. 'telos'
            [fiatCode: string]: { // e.g. USD
                [tokenAddress: string]: {
                    priceData: TokenPrice | null;
                    lastFetchTime?: number; // ms from epoch
                    // used to prevent redundant network calls for price data; because transaction rows
                    // are processed in parallel, there may be many calls to get the price of a particular
                    // token in quick succession,
                    // e.g. if there are 100 transactions displayed, and each one contains a transfer of WTLOS
                    promiseCache?: Promise<TokenPrice | null> | null;
                };
            },
        },
    },
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
        async fetchTokenPriceData(fiatCode: string, tokenAddress: string, tokenSymbol: string, network: string): Promise<TokenPrice | null> {
            this.trace('fetchTokenPriceData', fiatCode, tokenAddress, network);

            const tokenAddressLower = tokenAddress.toLowerCase();
            const feedbackStore = useFeedbackStore();

            feedbackStore.setLoading('fetchTokenPriceData');

            const cachedPriceData = this.__prices[network]?.[fiatCode]?.[tokenAddressLower];

            const indexerPriceUpdated = cachedPriceData?.priceData?.market?.info.updated;
            const indexerPriceUpdatedIsWithin10Minutes = Boolean(indexerPriceUpdated && dateIsWithinXMinutes(+indexerPriceUpdated, 10));
            const lastFetched = cachedPriceData?.lastFetchTime;
            const lastFetchIsWithin10Minutes = Boolean(lastFetched && dateIsWithinXMinutes(lastFetched, 10));

            // if we have fetched this marketData within the last 10 minutes, and that data is not stale, return the cached data
            if (cachedPriceData?.priceData?.market && indexerPriceUpdatedIsWithin10Minutes && lastFetchIsWithin10Minutes) {
                feedbackStore.unsetLoading('fetchTokenPriceData');
                return cachedPriceData.priceData;
            } else if (cachedPriceData && lastFetchIsWithin10Minutes) {
                // we fetched the price data recently but it was stale or incomplete at that time; do not refetch
                feedbackStore.unsetLoading('fetchTokenPriceData');
                return null;
            }

            if (!this.__prices[network]?.[fiatCode]?.[tokenAddressLower]?.promiseCache) {
                const getPriceData = async () => {
                    try {
                        const chainSettings = (useChainStore().getChain(CURRENT_CONTEXT).settings as EVMChainSettings);

                        const priceData = await getTokenPriceDataFromIndexer(
                            tokenSymbol,
                            tokenAddress,
                            fiatCode,
                            chainSettings.getIndexer(),
                            chainSettings,
                        );

                        this.setPriceForToken(fiatCode, tokenAddressLower, network, priceData);

                        return priceData;
                    } catch (e) {
                        throw new AntelopeError('antelope.evm.error_fetching_token_price');
                    } finally {
                        // clear the promise cache once data has been loaded
                        this.setPromiseCacheForToken(
                            fiatCode,
                            tokenAddressLower,
                            network,
                            null,
                        );
                        feedbackStore.unsetLoading('fetchTokenPriceData');
                    }
                };
                this.setPromiseCacheForToken(
                    fiatCode,
                    tokenAddressLower,
                    network,
                    getPriceData(),
                );
            }

            return this.__prices[network]?.[fiatCode]?.[tokenAddressLower]?.promiseCache ?? null;
        },

        // commits
        setPriceForToken(fiatCode: string, tokenAddress: string, network: string, priceData: TokenPrice | null) {
            this.trace('setPriceForToken', fiatCode, tokenAddress, network, priceData);
            if (!this.__prices[network]) {
                this.__prices[network] = {};
            }

            if (!this.__prices[network][fiatCode]) {
                this.__prices[network][fiatCode] = {};
            }

            this.__prices[network][fiatCode][tokenAddress] = {
                priceData,
                lastFetchTime: Date.now(),
                promiseCache: null,
            };
        },
        setPromiseCacheForToken(
            fiatCode: string,
            tokenAddress: string,
            network: string,
            promise: Promise<TokenPrice | null> | null,
        ) {
            this.trace('setPromiseCacheForToken', fiatCode, tokenAddress, network, promise);
            if (!this.__prices[network]) {
                this.__prices[network] = {};
            }

            if (!this.__prices[network][fiatCode]) {
                this.__prices[network][fiatCode] = {};
            }

            if (!this.__prices[network][fiatCode][tokenAddress]) {
                this.__prices[network][fiatCode][tokenAddress] = {
                    priceData: null,
                };
            }

            this.__prices[network][fiatCode][tokenAddress].promiseCache = promise;
        },
    },
});

const tokensInitialState: TokensState = {
    __tokens: {},
    __prices: {},
};
