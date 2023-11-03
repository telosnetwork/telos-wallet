/**
 * NFTs: This store is responsible for all functionality pertaining to NFTs,
 * such as fetching them for a given account, getting information on a particular NFT, or transferring NFTs
 */

import { defineStore } from 'pinia';

import {
    Label,
    Network,
    Address,
    Collectible,
    NftTokenInterface,
    IndexerPaginationFilter,
    TransactionResponse,
    addressString,
} from 'src/antelope/types';

import { useFeedbackStore, getAntelope, useChainStore, useEVMStore, CURRENT_CONTEXT } from 'src/antelope';
import { createTraceFunction, isTracingAll } from 'src/antelope/stores/feedback';
import { toRaw } from 'vue';
import { EvmAccountModel, useAccountStore } from 'src/antelope/stores/account';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { errorToString } from 'src/antelope/config';
import { truncateAddress } from 'src/antelope/stores/utils/text-utils';
import { subscribeForTransactionReceipt } from 'src/antelope/stores/utils/trx-utils';

export interface NFTsInventory {
    owner: Address;
    list: Collectible[];
    loading: boolean;
}

export interface NFTsCollection {
    contract: Address;
    list: Collectible[];
    loading: boolean;
}

export interface UserNftFilter {
    searchTerm?: string;
    collection?: string;
}

export interface NftsState {
    __pagination_filter: IndexerPaginationFilter;
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
        loggedInventory: state => state.__inventory[CURRENT_CONTEXT]?.list,
        loggedInventoryLoading: state => state.__inventory[CURRENT_CONTEXT]?.loading,
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
                        attr => [attr.label?.toString().toLowerCase(), attr.text?.toString().toLowerCase()].some(
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
        async updateNFTsForAccount(label: string, account: string) {
            this.trace('updateNFTsForAccount', label, account);
            const network = useChainStore().getChain(label).settings.getNetwork();

            const owner = account;

            // we initialize the inventory for this label or take the existing one
            this.__inventory[label] = this.__inventory[label] || {
                list: [],
                loading: true,
            };

            try {
                useFeedbackStore().setLoading('updateNFTsForAccount');
                const chain = useChainStore().getChain(label);
                if (chain.settings.isNative()) {
                    throw new Error('Method updateNFTsForAccount not implemented for native chain');
                } else {
                    const chain_settings = chain.settings as EVMChainSettings;

                    if (chain_settings.hasIndexerSupport()) {
                        const filter = toRaw(this.__pagination_filter);
                        const erc1155NftsPromise = chain_settings.getNftsForAccount(owner, { ...filter, type: 'ERC1155' });
                        const erc721NftsPromise  = chain_settings.getNftsForAccount(owner, { ...filter, type: 'ERC721'  });

                        const [erc1155Nfts, erc721Nfts] = await Promise.all([erc1155NftsPromise, erc721NftsPromise]);

                        const nfts = erc1155Nfts.concat(erc721Nfts);
                        const sortedNfts = nfts.sort((a, b) => b.updated - a.updated);

                        this.__inventory[label].list = sortedNfts;
                        this.__inventory[label].loading = false;

                        nfts.forEach((nft) => {
                            const contractLower = nft.contractAddress.toLowerCase();
                            this.__contracts[network] = this.__contracts[network] || {};
                            this.__contracts[network][contractLower] = this.__contracts[network][contractLower] ?? {
                                contract: contractLower,
                                list: [],
                                loading: false,
                            };

                            if (this.__contracts[network][contractLower].list.includes(nft)) {
                                return;
                            }
                            this.__contracts[network][contractLower].list.push(nft);
                        });

                        this.trace('updateNFTsForAccount', 'indexer returned:', nfts);

                        this.__contracts[network] = this.__contracts[network] || {};
                        sortedNfts.forEach((nft) => {
                            const contractLower = nft.contractAddress.toLowerCase();
                            this.__contracts[network][contractLower] = {
                                contract: contractLower,
                                list: [],
                                loading: false,
                            };
                            this.__contracts[network][contractLower].list.push(nft);
                        });
                        useFeedbackStore().unsetLoading('updateNFTsForAccount');
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

        async fetchNftDetails(
            label: Label,
            contract: string,
            tokenId: string,
            type?: NftTokenInterface,
        ): Promise<Collectible | null> {
            this.trace('fetchNftDetails', label, contract, tokenId, type);
            let promise = Promise.resolve(null) as Promise<Collectible | null>;
            try {
                const contractLower = contract.toLowerCase();
                const chain = useChainStore().getChain(label);
                const network = chain.settings.getNetwork();

                const new_filter = {
                    ...toRaw(this.__pagination_filter),
                    tokenId,
                };

                // If we already have a contract for that network and contract, we search for the NFT in that list first
                this.__contracts[network] = this.__contracts[network] || {};
                if (this.__contracts[network][contractLower]) {
                    const nft = this.__contracts[network][contractLower].list.find(
                        nft => nft.contractAddress.toLowerCase() === contract.toLowerCase() && nft.id === tokenId,
                    );
                    if (nft) {
                        return nft;
                    }
                } else {
                    this.__contracts[network][contractLower] = {
                        contract: contractLower,
                        list: [],
                        loading: false,
                    };
                }

                // we don't have the NFT on any cache, we fetch it from the indexer
                useFeedbackStore().setLoading('updateNFTsForAccount');
                if (chain.settings.isNative() || (chain.settings as EVMChainSettings).hasIndexerSupport()) {
                    promise = chain.settings.getNftsForCollection(contract, new_filter).then((nfts) => {
                        const contractLower = contract.toLowerCase();

                        this.trace('fetchNftDetails', 'indexer returned:', nfts);
                        this.__contracts[network][contractLower].list = this.__contracts[network][contractLower].list.concat(nfts);
                        this.__contracts[network][contractLower].loading = false;
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
                            (type ?? 'ERC721').toUpperCase(),
                        ).then((nft) => {
                            const contractLower = contract.toLowerCase();
                            this.trace('fetchNftDetails', 'indexer fallback:', nft);
                            if (nft) {
                                this.__contracts[network][contractLower].list.push(nft);
                                this.__contracts[network][contractLower].loading = false;
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

        async subscribeForTransactionReceipt(account: EvmAccountModel, response: TransactionResponse): Promise<TransactionResponse> {
            this.trace('subscribeForTransactionReceipt', account.account, response.hash);
            return subscribeForTransactionReceipt(account, response).then(({ newResponse, receipt }) => {
                newResponse.wait().then(() => {
                    this.trace('subscribeForTransactionReceipt', newResponse.hash, 'receipt:', receipt.status, receipt);
                    this.updateNFTsForAccount(CURRENT_CONTEXT, account.account);
                });
                return newResponse;
            });
        },

        updateNftOwnerData(label: Label, contractAddress: string, tokenId: string): Promise<void> {
            this.trace('updateNftOwnerData', label, contractAddress, tokenId);
            const network = useChainStore().getChain(label).settings.getNetwork();
            const indexer = (useChainStore().getChain(label).settings as EVMChainSettings).getIndexer();
            const nft = this.__contracts[network][contractAddress.toLowerCase()].list.find(nft => nft.id === tokenId);

            return nft?.updateOwnerData(indexer) ?? Promise.reject('NFT not found');
        },

        async transferNft(label: Label, contractAddress: string, tokenId: string, type: NftTokenInterface, from: addressString, to: addressString): Promise<TransactionResponse> {
            const funcname = 'transferNft';
            this.trace(funcname, label, contractAddress, tokenId, type);

            try {
                useFeedbackStore().setLoading(funcname);
                const account = useAccountStore().loggedAccount as EvmAccountModel;
                return await account.authenticator.transferNft(contractAddress, tokenId, type, from, to)
                    .then(r => this.subscribeForTransactionReceipt(account, r as TransactionResponse))
                    .finally(() => {
                        setTimeout(() => {
                            this.updateNftOwnerData(label, contractAddress, tokenId);
                        }, 2000); // give the blockchain a moment to propogate owner changes
                    });
            } catch (error) {
                const trxError = getAntelope().config.transactionError('antelope.evm.error_transfer_nft', error);
                getAntelope().config.transactionErrorHandler(trxError, funcname);
                throw trxError;
            } finally {
                useFeedbackStore().unsetLoading(funcname);
            }
        },

        // commits ---
        setPaginationFilter(filter: IndexerPaginationFilter) {
            this.__pagination_filter = filter;
        },
        setUserFilter(filter: UserNftFilter) {
            this.__user_filter = filter;
        },
        clearNFTs() {
            this.trace('clearNFTs');
            this.__inventory = {};
            this.setUserFilter({});
            this.setPaginationFilter({
                offset: 0,
                limit: 10000,
            });
        },
    },
});



const nftsInitialState: NftsState = {
    __pagination_filter: {
        offset: 0,
        limit: 10000, // override api limit default value of 50
    },
    __user_filter: {
        collection: '',
        searchTerm: '',
    },
    __inventory: {},
    __contracts: {},
};
