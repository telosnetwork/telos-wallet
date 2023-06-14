/**
 * NFTs: This store is responsible for fetching and providing a list of NFTs for the current network.
 */

import { defineStore } from 'pinia';
import {
    getAntelope,
    useAccountStore,
    useFeedbackStore,
    useChainStore,
} from 'src/antelope';
import { toRaw } from 'vue';
import { errorToString } from 'src/antelope/config';
import {
    Label,
    NFTClass,
    IndexerTransactionsFilter,
} from 'src/antelope/types';
import { createTraceFunction, isTracingAll } from 'src/antelope/stores/feedback';
import NativeChainSettings from 'src/antelope/chains/NativeChainSettings';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { AccountModel } from 'src/antelope/stores/account';


export interface NFTState {
    __filter: IndexerTransactionsFilter;
    __inventory:  { [label: Label]: NFTClass[] };
}

const store_name = 'nfts';

export const useNFTsStore = defineStore(store_name, {
    state: (): NFTState => (NFTsInitialState),
    getters: {
        loggedNFTs: state => state.__inventory['logged'],
        currentNFTs: state => state.__inventory['current'],
        getNFTs: state => (label: string) => state.__inventory[label],
    },
    actions: {
        trace: createTraceFunction(store_name),
        init: () => {
            useFeedbackStore().setDebug(store_name, isTracingAll());
            getAntelope().events.onAccountChanged.subscribe({
                next: async ({ label, account }) => {
                    await useNFTsStore().updateNFTsForAccount(label, toRaw(account));
                },
            });

            // update logged NFTs every 13 seconds only if the user is logged
            setInterval(async () => {
                if (useAccountStore().loggedAccount) {
                    await useNFTsStore().updateNFTsForAccount('logged', useAccountStore().loggedAccount);
                }
            }, 13000);

        },
        async updateNFTsForAccount(label: string, account: AccountModel | null) {
            this.trace('updateNFTsForAccount', label, account);
            if (!account) {
                return;
            }

            const new_filter = { ...toRaw(this.__filter), address: account.account };
            try {
                useFeedbackStore().setLoading('updateNFTsForAccount');
                const chain = useChainStore().getChain(label);
                if (chain.settings.isNative()) {
                    const chain_settings = chain.settings as NativeChainSettings;
                    this.__inventory[label] = await chain_settings.getNFTsInventory(new_filter);
                    useFeedbackStore().unsetLoading('updateNFTsForAccount');
                } else {
                    const chain_settings = chain.settings as EVMChainSettings;

                    if (chain_settings.hasIndexerSupport()) {
                        if (account?.account) {
                            this.__inventory[label] = await chain_settings.getNFTsInventory(new_filter);
                            useFeedbackStore().unsetLoading('updateNFTsForAccount');
                        }
                    } else {
                        // In case the chain does not support index, we don't have any solution yet
                        this.__inventory[label] = [];
                    }
                }
            } catch (error) {
                useFeedbackStore().unsetLoading('updateNFTsForAccount');
                console.error('Error: ', errorToString(error));
            }
        },

        // commits ---
        setPaginationFilter(filter: IndexerTransactionsFilter) {
            this.__filter = filter;
        },
    },
});

const NFTsInitialState: NFTState = {
    __filter: {
        address: '',
    },
    __inventory: {},
};
