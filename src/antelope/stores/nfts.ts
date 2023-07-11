/**
 * NFTs: This store is responsible for all functionality pertaining to NFTs,
 * such as fetching them for a given account or getting information on a particular NFT
 */

import { defineStore } from 'pinia';

import { Label, Network, Address, IndexerTransactionsFilter, NFTClass, ERC721_TYPE } from 'src/antelope/types';

import { useFeedbackStore, getAntelope, useChainStore, useEVMStore } from 'src/antelope';
import { createTraceFunction, isTracingAll } from 'src/antelope/stores/feedback';
import { toRaw } from 'vue';
import { AccountModel } from 'src/antelope/stores/account';
import NativeChainSettings from 'src/antelope/chains/NativeChainSettings';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { errorToString } from 'src/antelope/config';
import { truncateAddress } from 'src/antelope/stores/utils/text-utils';

export interface NFTsInventory {
    owner: Address;
    list: NFTClass[];
    loading: boolean;
}

export interface NFTsCollection {
    contract: Address;
    list: NFTClass[];
    loading: boolean;
}

export interface UserNftFilter {
    searchTerm?: string;
    collection?: string;
}

export interface NftsState {
    __indexer_filter: IndexerTransactionsFilter;
    __user_filter: UserNftFilter;
    __inventory: Record<Label, NFTsInventory>;
    __contracts: Record<Network, Record<Address, NFTsCollection>>;
}

export interface NftCollectionListItem {
    contract: Address;
    name: string;
}

const store_name = 'nfts';

export const useNftsStore = defineStore(store_name, {
    state: (): NftsState => (nftsInitialState),
    getters: {
        loggedInventory: state => state.__inventory['logged']?.list,
        loggedInventoryLoading: state => state.__inventory['logged']?.loading,
        getInventory: state => (label: string) => state.__inventory[label],
        getUserFilter: state => state.__user_filter,
        getCollectionList: state => (label: string): NftCollectionListItem[] => {
            // used to populate the 'collections' dropdown in the NFT inventory page
            const inventory = state.__inventory[label]?.list;
            if (!inventory) {
                return [];
            }
            const collection_list: NftCollectionListItem[] = [];
            inventory.forEach((nft) => {
                const collection = collection_list.find(c => c.contract === nft.contractAddress);
                if (!collection) {
                    collection_list.push({
                        contract: nft.contractAddress,
                        name: nft.contractPrettyName || truncateAddress(nft.contractAddress),
                    });
                }
            });
            // sort collection list such that items whose name begins with 0x are at the bottom, and those with names are at the top sorted alphabetically
            collection_list.sort((a, b) => {
                if (a.name.startsWith('0x') && !b.name.startsWith('0x')) {
                    return 1;
                } else if (!a.name.startsWith('0x') && b.name.startsWith('0x')) {
                    return -1;
                } else {
                    return a.name.localeCompare(b.name);
                }
            });
            return collection_list;
        },
        getUserFilteredInventory:  state => (label: string) => {
            let inventory = state.__inventory[label]?.list ?? [];
            const filter = state.__user_filter;

            if (filter.collection) {
                inventory = inventory.filter(nft => nft.contractAddress === filter.collection);
            }

            if (filter.searchTerm) {
                const searchTermLower = filter.searchTerm.toLowerCase();
                inventory = inventory.filter(nft =>
                    nft.name.toLowerCase().includes(searchTermLower) ||
                    nft.id.toLowerCase().includes(searchTermLower) ||
                    nft.description?.toLowerCase().includes(searchTermLower) ||
                    nft.contractPrettyName?.toLowerCase().includes(searchTermLower) ||
                    nft.contractAddress.toLowerCase().includes(searchTermLower) ||
                    nft.attributes.some(
                        attr => [attr.label?.toLowerCase(), attr.text?.toLowerCase()].some(
                            text => text?.includes(searchTermLower),
                        ),
                    ),
                );
            }

            return inventory;
        },
    },
    actions: {
        trace: createTraceFunction(store_name),
        init: () => {
            const self = useNftsStore();
            useFeedbackStore().setDebug(store_name, isTracingAll());
            getAntelope().events.onAccountChanged.subscribe({
                next: async ({ label, account }) => {
                    if (label) {
                        self.__inventory[label] = {
                            owner: account?.account || '',
                            list: [],
                            loading: true,
                        };
                    }
                },
            });
        },
        async updateNFTsForAccount(label: string, account: AccountModel | null) {
            this.trace('updateNFTsForAccount', label, account);
            if (!account?.account) {
                return;
            }

            const owner = account.account;

            // we initialize the inventory for this label or take the existing one
            this.__inventory[label] = this.__inventory[label] || {
                list: [],
                loading: true,
            };

            try {
                useFeedbackStore().setLoading('updateNFTsForAccount');
                const chain = useChainStore().getChain(label);
                if (chain.settings.isNative()) {
                    const chain_settings = chain.settings as NativeChainSettings;
                    chain_settings.getNFTsInventory(owner, toRaw(this.__indexer_filter)).then((nfts) => {
                        this.__inventory[label].list = nfts;
                        this.__inventory[label].loading = false;
                        this.trace('updateNFTsForAccount', 'indexer returned:', nfts);
                        useFeedbackStore().unsetLoading('updateNFTsForAccount');
                    });
                } else {
                    const chain_settings = chain.settings as EVMChainSettings;

                    if (chain_settings.hasIndexerSupport()) {
                        chain_settings.getNFTsInventory(owner, toRaw(this.__indexer_filter)).then((nfts) => {
                            this.__inventory[label].list = nfts;
                            this.__inventory[label].loading = false;
                            this.trace('updateNFTsForAccount', 'indexer returned:', nfts);
                            useFeedbackStore().unsetLoading('updateNFTsForAccount');
                            nfts.forEach((nft) => {
                                nft.watch(() => {
                                    // this forces an update for watchers to be called
                                    this.__inventory[label].list = [...nfts];
                                });
                            });
                        });
                    } else {
                        // In case the chain does not support index, we don't have any solution yet
                        this.trace('updateNFTsForAccount', 'No alternative for indexer, returning []');
                        this.__inventory[label].loading = false;
                    }
                }
            } catch (error) {
                this.__inventory[label].loading = false;
                useFeedbackStore().unsetLoading('updateNFTsForAccount');
                console.error('Error: ', errorToString(error));
            }
        },

        async fetchNftDetails(label: Label, contract: string, tokenId: string): Promise<NFTClass | null> {
            this.trace('fetchNftDetails', label, contract, tokenId);
            let promise = Promise.resolve(null) as Promise<NFTClass | null>;
            try {
                const chain = useChainStore().getChain(label);
                const network = chain.settings.getNetwork();

                // If we already have an inventory for that label, we search for the NFT in that list first
                if (this.__inventory[label]) {
                    const nft = this.__inventory[label].list.find(
                        nft => nft.item.contract.address.toLowerCase() === contract.toLowerCase() && nft.id === tokenId,
                    );
                    if (nft) {
                        return nft;
                    }
                }

                const new_filter = {
                    ...toRaw(this.__indexer_filter),
                    tokenId,
                };

                // If we already have a contract for that network and contract, we search for the NFT in that list first
                this.__contracts[network] = this.__contracts[network] || {};
                if (this.__contracts[network][contract]) {
                    const nft = this.__contracts[network][contract].list.find(
                        nft => nft.item.contract.address.toLowerCase() === contract.toLowerCase() && nft.id === tokenId,
                    );
                    if (nft) {
                        return nft;
                    }
                } else {
                    this.__contracts[network][contract] = {
                        contract,
                        list: [],
                        loading: false,
                    };
                }

                // we don't have the NFT on any cache, we fetch it from the indexer
                useFeedbackStore().setLoading('updateNFTsForAccount');
                if (chain.settings.isNative() || (chain.settings as EVMChainSettings).hasIndexerSupport()) {
                    promise = chain.settings.getNFTsCollection(contract, new_filter).then((nfts) => {
                        this.trace('fetchNftDetails', 'indexer returned:', nfts);
                        this.__contracts[network][contract].list = this.__contracts[network][contract].list.concat(nfts);
                        this.__contracts[network][contract].loading = false;
                        useFeedbackStore().unsetLoading('updateNFTsForAccount');
                        return nfts.find(nft => nft.id === tokenId) || null;
                    });
                } else {
                    if (!chain.settings.isNative()) {
                        // this means we have the indexer down
                        // we have the contract and the addres so we try to fetch the NFT from the contract
                        useEVMStore().getNFT(
                            contract,
                            tokenId,
                            ERC721_TYPE,
                        ).then((nft) => {
                            this.trace('fetchNftDetails', 'indexer fallback:', nft);
                            if (nft) {
                                this.__contracts[network][contract].list.push(nft);
                                this.__contracts[network][contract].loading = false;
                            }
                            useFeedbackStore().unsetLoading('updateNFTsForAccount');
                            return nft;
                        });
                    }
                }
            } catch (error) {
                useFeedbackStore().unsetLoading('updateNFTsForAccount');
                console.error('Error: ', errorToString(error));
            }

            return promise;
        },

        clearUserFilter() {
            this.setUserFilter({
                collection: '',
                searchTerm: '',
            });
        },


        // commits ---
        setPaginationFilter(filter: IndexerTransactionsFilter) {
            this.__indexer_filter = filter;
        },
        setUserFilter(filter: UserNftFilter) {
            this.__user_filter = filter;
        },
    },
});



const nftsInitialState: NftsState = {
    __indexer_filter: {
        address: '',
        limit: 10000, // override api limit default value of 50
    },
    __user_filter: {
        collection: '',
        searchTerm: '',
    },
    __inventory: {},
    __contracts: {},
};
