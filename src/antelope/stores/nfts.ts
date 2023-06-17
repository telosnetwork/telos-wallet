/**
 * NFTs: This store is responsible for all functionality pertaining to NFTs,
 * such as fetching them for a given account or getting information on a particular NFT
 */

import { defineStore } from 'pinia';

import { Label, Network, Address, IndexerTransactionsFilter, NFTClass, ERC721_TYPE } from 'src/antelope/types';

import { useFeedbackStore, getAntelope, useAccountStore, useChainStore, useEVMStore } from 'src/antelope';
import { createTraceFunction, isTracingAll } from 'src/antelope/stores/feedback';
import { toRaw } from 'vue';
import { AccountModel } from 'src/antelope/stores/account';
import NativeChainSettings from 'src/antelope/chains/NativeChainSettings';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { errorToString } from 'src/antelope/config';

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

export interface NftsState {
    __filter: IndexerTransactionsFilter;
    __inventory: Record<Label, NFTsInventory>;
    __contracts: Record<Network, Record<Address, NFTsCollection>>;
}

const store_name = 'nfts';

export const useNftsStore = defineStore(store_name, {
    state: (): NftsState => (nftsInitialState),
    getters: {
        loggedInventory: state => state.__inventory['logged']?.list,
        loggedInventoryLoading: state => state.__inventory['logged']?.loading,
        getInventory: state => (label: string) => state.__inventory[label],
    },
    actions: {
        trace: createTraceFunction(store_name),
        init: () => {
            const self = useNftsStore();
            useFeedbackStore().setDebug(store_name, isTracingAll());
            getAntelope().events.onAccountChanged.subscribe({
                next: async ({ label, account }) => {
                    self.__inventory[label] = {
                        owner: account?.account || '',
                        list: [],
                        loading: true,
                    };
                    await self.updateNFTsForAccount(label, toRaw(account));
                },
            });

            useAccountStore();
            // update logged NFTs every 13 seconds only if the user is logged
            setInterval(async () => {
                if (useAccountStore().loggedAccount) {
                    await self.updateNFTsForAccount('logged', useAccountStore().loggedAccount);
                }
            }, 13000);
        },
        async updateNFTsForAccount(label: string, account: AccountModel | null) {
            this.trace('updateNFTsForAccount', label, account);
            if (!account?.account) {
                return;
            }

            // const owner = account.account;
            const owner = '0x13B745FC35b0BAC9bab9fD20B7C9f46668232607';

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
                    chain_settings.getNFTsInventory(owner, toRaw(this.__filter)).then((nfts) => {
                        this.__inventory[label].list = nfts;
                        this.__inventory[label].loading = false;
                        this.trace('updateNFTsForAccount', 'indexer returned:', nfts);
                        useFeedbackStore().unsetLoading('updateNFTsForAccount');
                    });
                } else {
                    const chain_settings = chain.settings as EVMChainSettings;

                    if (chain_settings.hasIndexerSupport()) {
                        chain_settings.getNFTsInventory(owner, toRaw(this.__filter)).then((nfts) => {
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

        async getNftDetails(label: Label, contract: string, tokenId: string): Promise<NFTClass | null> {
            this.trace('getNftDetails', label, contract, tokenId);
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
                    ...toRaw(this.__filter),
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
                        this.trace('getNftDetails', 'indexer returned:', nfts);
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
                            this.trace('getNftDetails', 'indexer fallback:', nft);
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


        // commits ---
        setPaginationFilter(filter: IndexerTransactionsFilter) {
            this.__filter = filter;
        },
    },
});



const nftsInitialState: NftsState = {
    __filter: {
        address: '',
    },
    __inventory: {},
    __contracts: {},
};
