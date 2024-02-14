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
    AntelopeError,
} from 'src/antelope/types';
import { toRaw } from 'vue';
import { EvmAccountModel, useAccountStore } from 'src/antelope/stores/account';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { createTraceFunction, errorToString } from 'src/antelope/config';
import { truncateAddress } from 'src/antelope/stores/utils/text-utils';
import { subscribeForTransactionReceipt } from 'src/antelope/stores/utils/trx-utils';

// dependencies --
import {
    CURRENT_CONTEXT,
    getAntelope,
    useFeedbackStore,
    useChainStore,
    useEVMStore,
} from 'src/antelope';

export interface NFTsInventory {
    owner: Address;
    list: Collectible[];
    loading: boolean;
}

export interface NFTsCollection {
    contract: Address;
    list: Collectible[];
    loading: boolean;

    // this is to prevent the scenario where we fetch a single NFT from a collection, add it to a contract's `list`
    // and then in future checks we assume that the entire collection has been fetched (as we have at least one item in the list)
    entireCollectionFetched: boolean;
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
            const ant = getAntelope();
            ant.events.onAccountChanged.subscribe({
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
            ant.events.onClear.subscribe(({ label }) => {
                self.clearNFTs(label);
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

                        this.__contracts[network] = this.__contracts[network] || {};
                        nfts.forEach((nft) => {
                            const contractLower = nft.contractAddress.toLowerCase();
                            this.__contracts[network][contractLower] = this.__contracts[network][contractLower] ?? {
                                contract: contractLower,
                                list: [],
                                loading: false,
                            };

                            if (this.__contracts[network][contractLower].list.find(contractNft => contractNft.id === nft.id)) {
                                return;
                            }
                            this.__contracts[network][contractLower].list.push(nft);
                        });

                        this.trace('updateNFTsForAccount', 'indexer returned:', nfts);
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
                    type,
                };
                this.trace('fetchNftDetails', 'filter:', new_filter);

                // If we already have a contract for that network and contract, we search for the NFT in that list first
                this.__contracts[network] = this.__contracts[network] || {};

                if (this.__contracts[network]?.[contractLower]?.loading) {
                    let waitCount = 0;
                    while (this.__contracts[network][contractLower].loading && waitCount++ < 600) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                }

                if (this.__contracts[network]?.[contractLower]?.entireCollectionFetched) {
                    const nft = this.__contracts[network][contractLower].list.find(
                        nft => nft.contractAddress.toLowerCase() === contract.toLowerCase() && nft.id === tokenId,
                    );
                    if (nft) {
                        this.trace('fetchNftDetails', 'found in cache:', nft);
                        return nft;
                    }
                } else {
                    this.__contracts[network][contractLower] = {
                        contract: contractLower,
                        list: [],
                        loading: false,
                        entireCollectionFetched: false,
                    };
                }

                // we don't have the NFT on any cache, we fetch it from the indexer
                useFeedbackStore().setLoading('updateNFTsForAccount');
                if (chain.settings.isNative() || (chain.settings as EVMChainSettings).hasIndexerSupport()) {
                    this.trace('fetchNftDetails', 'fetching from indexer');
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
                        // we have the contract and the address so we try to fetch the NFT from the contract
                        this.trace('fetchNftDetails', 'indexer down, fetching from contract');
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

        async fetchNftsFromCollection(label: Label, contract: string): Promise<Collectible[] | null> {
            this.trace('fetchNftsFromCollection', label, contract);
            const contractLower = contract.toLowerCase();
            const feedbackStore = useFeedbackStore();
            const chain = useChainStore().getChain(label);
            const network = chain.settings.getNetwork();

            if (this.__contracts[network]?.[contractLower]?.loading) {
                let waitCount = 0;
                while (this.__contracts[network][contractLower].loading && waitCount++ < 600) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            if (this.__contracts[network]?.[contractLower]?.entireCollectionFetched) {
                return Promise.resolve(this.__contracts[network][contractLower].list);
            }

            if (!this.__contracts[network]) {
                this.__contracts[network] = {};
            }

            if (!this.__contracts[network][contractLower]) {
                this.__contracts[network][contractLower] = {
                    contract,
                    list: [],
                    loading: true,
                    entireCollectionFetched: false,
                };
            }

            this.__contracts[network][contractLower].loading = true;

            feedbackStore.setLoading('fetchNftsFromCollection');
            try {
                const nfts = await chain.settings.getNftsForCollection(contract, { limit: 10000 });
                this.__contracts[network][contractLower].list = nfts;
                this.__contracts[network][contractLower].entireCollectionFetched = true;

                return nfts;
            } catch {
                this.__contracts[network][contractLower].list = [];
                throw new AntelopeError('antelope.nfts.error_fetching_collection_nfts');
            } finally {
                feedbackStore.unsetLoading('fetchNftsFromCollection');
                this.__contracts[network][contractLower].loading = false;
            }
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
            const nft = this.__contracts[network][contractAddress.toLowerCase()].list.find(nft => nft.id === tokenId);

            return nft?.updateOwnerData() ?? Promise.reject('NFT not found');
        },

        async transferNft(
            label: Label,
            contractAddress: string,
            tokenId: string,
            type: NftTokenInterface,
            from: addressString,
            to: addressString,
            quantity?: number,
        ): Promise<TransactionResponse> {
            const funcname = 'transferNft';
            this.trace(funcname, label, contractAddress, tokenId, type);

            try {
                useFeedbackStore().setLoading(funcname);
                const account = useAccountStore().loggedAccount as EvmAccountModel;
                const transferNftResponse = await account.authenticator.transferNft(contractAddress, tokenId, type, from, to, quantity);
                const receiptPromise = this.subscribeForTransactionReceipt(account, transferNftResponse as TransactionResponse);

                receiptPromise.then(r => r.wait().then(() => {
                    setTimeout(() => {
                        this.updateNftOwnerData(label, contractAddress, tokenId);
                    }, 3000); // give the indexer some time to update owner information
                }));

                return receiptPromise;
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
        clearNFTs(label: Label) {
            this.trace('clearNFTs');
            this.__inventory[label] = {
                owner: '',
                list: [],
                loading: false,
            };
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
