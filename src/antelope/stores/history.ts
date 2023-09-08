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
    createTraceFunction,
    isTracingAll,
    useFeedbackStore,
} from 'src/antelope/stores/feedback';
import {
    Label,
    EvmTransaction,
    AntelopeError,
    IndexerTransactionsFilter,
    ShapedTransactionRow,
    ParsedIndexerAccountTransactionsContract,
    EVMTransactionsPaginationData,
    TransactionValueData,
    EvmTransfer,
    IndexerContractData,
    NftTransactionData,
    NftTokenInterface,
} from 'src/antelope/types';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { useChainStore } from 'src/antelope/stores/chain';
import { toRaw } from 'vue';
import { BigNumber } from 'ethers';
import { CURRENT_CONTEXT, getAntelope, useContractStore, useNftsStore, useUserStore } from '..';
import { formatUnits } from 'ethers/lib/utils';
import { getGasInTlos, WEI_PRECISION } from 'src/antelope/stores/utils';
import { convertCurrency } from 'src/antelope/stores/utils/currency-utils';
import { dateIsWithinXMinutes } from 'src/antelope/stores/utils/date-utils';
import { getFiatPriceFromIndexer } from 'src/api/price';

export const transfers_filter_limit = 10000;

export interface HistoryState {
    __evm_filter: IndexerTransactionsFilter;
    __evm_transactions: {
        [label: Label]: {
            transactions: EvmTransaction[],
        },
    }
    __total_evm_transaction_count: {
        [label: Label]: number,
    },
    __shaped_evm_transaction_rows: {
        [label: Label]: ShapedTransactionRow[],
    };
    __evm_transactions_pagination_data: {
        [label: Label]: EVMTransactionsPaginationData,
    },
    __evm_nft_transfers: {
        [label: Label]: {
            transfers: EvmTransfer[],
        },
    },
}

const store_name = 'history';

// these are used to prevent multiple fetches from happening at the same time;
// if a fetch is already running, the next fetch will be queued up and run after the current fetch is complete
// without ending the loading state. This prevents the loading state from flickering on and off if
// subsequent calls are made to the fetch method before it returns
// (e.g. when loading the balances tab, which prefetches transactions, and quickly switching to the transactions tab)
let fetchAccoutTransactionsIsRunning = false;
let shouldRefetchAccoutTransactions = false;

let nftTransfersUpdated : number | null = null; // the time in milliseconds since epoch when the NFT transfers were last updated

export const useHistoryStore = defineStore(store_name, {
    state: (): HistoryState => (historyInitialState),
    getters: {
        getEVMTransactions: state => (label: Label): EvmTransaction[] => state.__evm_transactions[label].transactions,
        getEVMTransactionsFilter: state => state.__evm_filter,
        getShapedTransactionRows: state => (label: Label): ShapedTransactionRow[] => state.__shaped_evm_transaction_rows[label],
        getEVMTransactionsPagination: state => (label: Label): EVMTransactionsPaginationData => state.__evm_transactions_pagination_data[label],
        getEvmTransactionsRowCount: state => (label: Label): number => state.__total_evm_transaction_count[label],
        getEVMTransfers: state => (label: Label): EvmTransfer[] => state.__evm_nft_transfers[label].transfers,
    },
    actions: {
        trace: createTraceFunction(store_name),
        init: () => {
            useFeedbackStore().setDebug(store_name, isTracingAll());
            getAntelope().events.onAccountChanged.subscribe({
                next: ({ account }) => {
                    const self = useHistoryStore();
                    if (account) {
                        self.setEVMTransactionsFilter({ address: account.account });
                    }
                },
            });
        },

        // actions ---

        // fetch all transactions for the account defined in __evm_filter.address
        async fetchEVMTransactionsForAccount(label: Label = CURRENT_CONTEXT) {
            this.trace('fetchEVMTransactionsForAccount', label);
            const feedbackStore = useFeedbackStore();

            if (!fetchAccoutTransactionsIsRunning) {
                feedbackStore.setLoading('history.fetchEVMTransactionsForAccount');
                fetchAccoutTransactionsIsRunning = true;
            } else {
                shouldRefetchAccoutTransactions = true;
                return;
            }

            const chain = useChainStore().getChain(label);
            const chain_settings = chain.settings as EVMChainSettings;
            const contractStore = useContractStore();


            try {
                shouldRefetchAccoutTransactions = false;
                // for NFTs (ERC1155 and ERC721), we need to fetch information from the transfers endpoint,
                // which returns data required for the UI
                // so if the user has not fetched NFT transfers yet, or if the NFT transfers are stale (3 mins),
                // fetch them now
                if (
                    !this.__evm_nft_transfers[label].transfers.length ||
                    (nftTransfersUpdated && dateIsWithinXMinutes(nftTransfersUpdated, 3))
                ) {
                    await this.fetchEvmNftTransfersForAccount(label, this.__evm_filter.address);
                }

                const transactionsResponse = await chain_settings.getEVMTransactions(toRaw(this.__evm_filter));
                const contracts = transactionsResponse.contracts;
                const transactions = transactionsResponse.results;

                this.setEvmTransactionsRowCount(label, transactionsResponse.total_count);

                const contractAddresses = Object.keys(contracts);
                const parsedContracts: Record<string, ParsedIndexerAccountTransactionsContract> = {};
                contractAddresses.forEach((address: string) => {
                    const extraInfo = JSON.parse(contracts[address]?.calldata ?? '{}');
                    parsedContracts[address] = {
                        ...contracts[address],
                        ...extraInfo,
                    };
                });

                // cache contracts
                contractAddresses.forEach((address) => {
                    contractStore.addContractToCache(address, parsedContracts[address]);
                });

                this.setEVMTransactions(label, transactions);

                await this.shapeTransactions(label, transactions);
            } catch (error) {
                console.error(error);
                throw new AntelopeError('antelope.history.error_fetching_transactions');
            } finally {
                fetchAccoutTransactionsIsRunning = false;

                if (shouldRefetchAccoutTransactions) {
                    await this.fetchEVMTransactionsForAccount(label);
                } else {
                    feedbackStore.unsetLoading('history.fetchEVMTransactionsForAccount');
                }
            }
        },

        // fetch all NFT transfers for an account (erc721, erc155)
        async fetchEvmNftTransfersForAccount(label: Label, account: string): Promise<void> {
            const feedbackStore = useFeedbackStore();
            const contractStore = useContractStore();

            this.trace('fetchEvmNftTransfersForAccount', label);

            feedbackStore.setLoading('history.fetchEvmNftTransfersForAccount');

            const chainSettings = useChainStore().getChain(label).settings as EVMChainSettings;

            try {
                // get all erc721 and erc1155 transfers for the given account
                const [
                    erc721TransferResponse,
                    erc1155TransferResponse,
                ] = await Promise.all(['erc721', 'erc1155'].map(
                    type => chainSettings.getEVMTransfers({
                        includePagination: true,
                        account,
                        limit: transfers_filter_limit,
                        type: type as 'erc721' | 'erc1155',
                    }),
                ));

                const erc721Contracts  = erc721TransferResponse.contracts;
                const erc1155Contracts = erc1155TransferResponse.contracts;

                // cache all contracts
                [erc721Contracts, erc1155Contracts].forEach((contracts) => {
                    const contractAddresses = Object.keys(contracts);
                    const parsedContracts: Record<string, IndexerContractData> = {};
                    contractAddresses.forEach((address: string) => {
                        const extraInfo = JSON.parse(contracts[address]?.calldata ?? '{}');

                        parsedContracts[address] = {
                            ...contracts[address],
                            ...extraInfo,
                        };
                    });
                    contractAddresses.forEach((address) => {
                        contractStore.addContractToCache(address, parsedContracts[address]);
                    });
                });

                const transfers = [
                    ...erc721TransferResponse.results,
                    ...erc1155TransferResponse.results,
                ];

                // sort transfers from new to old
                transfers.sort((a, b) => b.timestamp - a.timestamp);

                this.setEVMTransfers(label, transfers);
            } catch (error) {
                this.clearEvmNftTransfers();
                throw new AntelopeError('antelope.history.error_fetching_nft_transfers');
            } finally {
                nftTransfersUpdated = (new Date()).getTime();
                feedbackStore.unsetLoading('history.fetchEvmNftTransfersForAccount');
            }
        },

        async shapeTransactions(label: Label = CURRENT_CONTEXT, transactions: EvmTransaction[]) {
            this.trace('shapeTransactions', label);
            const userStore = useUserStore();
            const chain = useChainStore().getChain(label);
            const nftStore = useNftsStore();
            const chain_settings = chain.settings as EVMChainSettings;
            const indexer = chain_settings.getIndexer();
            const contractStore = useContractStore();
            const chainSettings = (chain.settings as EVMChainSettings);
            const tlosInUsd = await chainSettings.getUsdPrice();

            const allNftTransfers = this.__evm_nft_transfers[label].transfers;

            const transactionShapePromises = transactions.map(async (tx) => {
                const erc20Transfers = await contractStore.getErc20TransfersFromTransaction(tx);
                const userAddressLower = this.__evm_filter.address.toLowerCase();

                const gasUsedInTlosBn = BigNumber.from(tx.gasPrice).mul(tx.gasused);
                const gasUsedInTlos = getGasInTlos(tx.gasused, tx.gasPrice);
                const gasInUsdBn = convertCurrency(gasUsedInTlosBn, WEI_PRECISION, 2, tlosInUsd);
                const gasInUsd = +(formatUnits(gasInUsdBn, 2));

                const systemTokenDecimals = chainSettings.getSystemToken().decimals;

                // all contracts in transactions are already cached, no need to use getContract
                const toPrettyName = contractStore.__cachedContracts[tx.to?.toLowerCase()]?.name ?? '';
                const fromPrettyName = contractStore.__cachedContracts[tx.from?.toLowerCase()]?.name ?? '';

                const valuesIn: TransactionValueData[] = [];
                const valuesOut: TransactionValueData[] = [];

                const nftsIn: NftTransactionData[] = [];
                const nftsOut: NftTransactionData[] = [];

                const isFailed = tx.status !== '0x1';
                const isContractCreation = !tx.to && !!tx.contractAddress;
                let functionName = '';

                if (!isContractCreation && tx.to && tx.to.toLowerCase() !== userAddressLower) {
                    // if the user interacted with a contract, the 'to' field is that contract's address
                    const contract = await contractStore.getContract(tx.to);
                    if (contract && contract.abi) {
                        functionName = await contractStore.getFunctionNameFromTransaction(tx, contract);
                    }
                }

                let actionName = '';

                if (!isFailed) {
                    if (+tx.value) {
                        const valueInFiatBn = convertCurrency(BigNumber.from(tx.value), systemTokenDecimals, 2, tlosInUsd);
                        const valueInFiat = +formatUnits(valueInFiatBn, 2);

                        if (tx.from?.toLowerCase() === userAddressLower) {
                            valuesOut.push({
                                amount: +formatUnits(tx.value, systemTokenDecimals),
                                symbol: chainSettings.getSystemToken().symbol,
                                fiatValue: valueInFiat,
                            });
                        }
                        if (tx.to?.toLowerCase() === userAddressLower) {
                            valuesIn.push({
                                amount: +formatUnits(tx.value, systemTokenDecimals),
                                symbol: chainSettings.getSystemToken().symbol,
                                fiatValue: valueInFiat,
                            });
                        }
                    }

                    const nftTransfersInTx = allNftTransfers.filter(transfer => transfer.transaction.toLowerCase() === tx.hash.toLowerCase());

                    if (nftTransfersInTx.length > 0) {
                        // there is at least 1 NFT transfer in this transaction,
                        // so we need to fetch the NFT details for each transfer in this transaction
                        const nftDetailList = await Promise.all(
                            nftTransfersInTx.map(
                                transfer => nftStore.fetchNftDetails(
                                    label,
                                    transfer.contract,
                                    transfer.id ?? '',
                                    transfer.type.toUpperCase() as NftTokenInterface,
                                ),
                            ),
                        );

                        nftDetailList.forEach((nftDetails, index) => {
                            if (nftDetails) {
                                let nftMediaType: 'image' | 'video' | 'audio' | 'unknown' = 'unknown';

                                if (nftDetails.audioSrc) {
                                    nftMediaType = 'audio';
                                } else if (nftDetails.videoSrc) {
                                    nftMediaType = 'video';
                                } else if (nftDetails.imageSrcFull) {
                                    nftMediaType = 'image';
                                }

                                const transferInfo = nftTransfersInTx[index];
                                const shapedNftTransfer = {
                                    quantity: +(transferInfo.amount || 1),
                                    tokenId: transferInfo.id ?? '',
                                    tokenName: nftDetails.name,
                                    collectionAddress: transferInfo.contract,
                                    collectionName: nftDetails.contractPrettyName,
                                    type: nftMediaType,
                                    nftInterface: transferInfo.type.toUpperCase() as NftTokenInterface,
                                    imgSrc: nftDetails.imageSrcFull,
                                    videoSrc: nftDetails.videoSrc,
                                    audioSrc: nftDetails.audioSrc,
                                };

                                if (transferInfo.from.toLowerCase() === userAddressLower) {
                                    nftsOut.push(shapedNftTransfer);
                                } else if (transferInfo.to.toLowerCase() === userAddressLower) {
                                    nftsIn.push(shapedNftTransfer);
                                }
                            }
                        });
                    }

                    for (const tokenXfer of erc20Transfers) {
                        if (tokenXfer.symbol && tokenXfer.decimals) {
                            let transferAmountInFiat: number | undefined;

                            if (tokenXfer.symbol) {
                                const tokenFiatPrice = await getFiatPriceFromIndexer(
                                    tokenXfer.symbol,
                                    tokenXfer.address,
                                    userStore.fiatCurrency,
                                    indexer,
                                    chain_settings,
                                );

                                transferAmountInFiat = tokenFiatPrice ?
                                    tokenFiatPrice * +formatUnits(tokenXfer.value, tokenXfer.decimals) :
                                    undefined;
                            }

                            if (tokenXfer.from?.toLowerCase() === userAddressLower) {
                                // sent from user
                                valuesOut.push({
                                    amount: +formatUnits(tokenXfer.value, tokenXfer.decimals),
                                    symbol: tokenXfer.symbol,
                                    fiatValue: transferAmountInFiat,
                                });
                            } else if (tokenXfer.to?.toLowerCase() === userAddressLower) {
                                // sent to user
                                valuesIn.push({
                                    amount: +formatUnits(tokenXfer.value, tokenXfer.decimals),
                                    symbol: tokenXfer.symbol,
                                    fiatValue: transferAmountInFiat,
                                });
                            }
                        }
                    }

                    const txIsASwap    = (valuesIn.length  > 0 || nftsIn.length  > 0) && (valuesOut.length > 0 || nftsOut.length > 0);
                    const txIsASend    = (valuesOut.length > 0 || nftsOut.length > 0) && (valuesIn.length  === 0 && nftsIn.length  === 0);
                    const txIsAReceive = (valuesIn.length  > 0 || nftsIn.length  > 0) && (valuesOut.length === 0 && nftsOut.length === 0);

                    if (isContractCreation) {
                        actionName = 'contractCreation';
                    } else if (txIsASend) {
                        actionName = 'send';
                    } else if (txIsAReceive) {
                        actionName = 'receive';
                    } else if (txIsASwap) {
                        actionName = 'swap';
                    } else if (functionName) {
                        actionName = functionName;
                    }
                }

                return {
                    id: tx.hash,
                    epoch: tx.timestamp / 1000,
                    actionName,
                    from: tx.from,
                    fromPrettyName,
                    to: tx.to,
                    toPrettyName,
                    valuesIn,
                    valuesOut,
                    nftsIn,
                    nftsOut,
                    gasUsed: +gasUsedInTlos,
                    gasFiatValue: gasInUsd,
                    failed: isFailed,
                } as ShapedTransactionRow;
            });

            const shapedTransactions = await Promise.all(transactionShapePromises);
            this.setShapedTransactionRows(label, shapedTransactions);
        },


        // commits ---
        setEVMTransactionsFilter(filter: IndexerTransactionsFilter) {
            this.trace('setEVMFilter', filter);
            useHistoryStore().__evm_filter = filter;
        },
        setEVMTransactions(label: Label, transactions: EvmTransaction[]) {
            this.trace('setTransactions', label, transactions);
            useHistoryStore().__evm_transactions[label].transactions = transactions;
        },
        setShapedTransactionRows(label: Label, transactions: ShapedTransactionRow[]) {
            this.trace('setShapedTransactionRows', transactions);
            this.__shaped_evm_transaction_rows[label] = transactions;
        },
        setEvmTransactionsRowCount(label: Label, count: number) {
            this.trace('setEvmTransactionsRowCount', count);
            this.__total_evm_transaction_count[label] = count;
        },
        clearEvmTransactions() {
            this.trace('clearEvmTransactions');
            this.setEVMTransactionsFilter({ address: '' });
            this.setEVMTransactions(CURRENT_CONTEXT, []);
            this.setShapedTransactionRows(CURRENT_CONTEXT, []);
            this.setEvmTransactionsRowCount(CURRENT_CONTEXT, 0);
        },
        setEVMTransfers(label: Label, transfers: EvmTransfer[]): void {
            this.trace('setEVMTransfers', transfers);
            this.__evm_nft_transfers[label].transfers = transfers;
        },
        clearEvmNftTransfers(): void {
            this.trace('clearEvmNftTransfers');
            this.setEVMTransfers(CURRENT_CONTEXT, []);
        },
    },
});

const historyInitialState: HistoryState = {
    __evm_transactions: {
        current: {
            transactions: [],
        },
    },
    __total_evm_transaction_count: {
        current: 0,
    },
    __evm_filter: {
        address: '',
    },
    __shaped_evm_transaction_rows: {
        current: [],
    },
    __evm_transactions_pagination_data: {},
    __evm_nft_transfers: {
        current: {
            transfers: [],
        },
    },
};
