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
    // TRANSFER_SIGNATURES,
    IndexerTransactionsFilter,
    // HyperionActionsFilter,
    ShapedTransactionRow,
    ParsedIndexerAccountTransactionsContract,
    EVMTransactionsPaginationData, TransactionValueData,
} from 'src/antelope/types';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { useChainStore } from 'src/antelope/stores/chain';
import { toRaw } from 'vue';
// import { formatWei, getGasInTlos, WEI_PRECISION } from 'src/antelope/stores/utils';
import { BigNumber } from 'ethers';
// import { useEVMStore } from 'src/antelope/stores/evm';
import { getAntelope, useContractStore } from '..';
import { formatUnits } from 'ethers/lib/utils';
import { formatWei, WEI_PRECISION } from 'src/antelope/stores/utils';
import { convertCurrency } from 'src/antelope/stores/utils/currency-utils';
// import { convertCurrency } from 'src/antelope/stores/utils/currency-utils';
// import { getCoingeckoUsdPrice } from 'src/api/price';
// import { parseUnits } from 'ethers/lib/utils';


export interface HistoryState {
    __evm_filter: IndexerTransactionsFilter;
    __evm_transactions: {
        [label: Label]: {
            transactions: EvmTransaction[],
        },
    }
    __shaped_evm_transaction_rows: {
        [label: Label]: ShapedTransactionRow[],
    };
    __evm_transactions_pagination_data: {
        [label: Label]: EVMTransactionsPaginationData,
    },
}

const store_name = 'history';

export const useHistoryStore = defineStore(store_name, {
    state: (): HistoryState => (historyInitialState),
    getters: {
        getEVMTransactions: state => (label: Label): EvmTransaction[] => state.__evm_transactions[label].transactions,
        getEVMTransactionsFilter: state => state.__evm_filter,
        getShapedTransactionRows: state => (label: Label): ShapedTransactionRow[] => state.__shaped_evm_transaction_rows[label],
        getEVMTransactionsPagination: state => (label: Label): EVMTransactionsPaginationData => state.__evm_transactions_pagination_data[label],
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
        async fetchEVMTransactionsForAccount(label: Label = 'current') {
            const feedbackStore = useFeedbackStore();
            const chain = useChainStore().getChain(label);
            const chain_settings = chain.settings as EVMChainSettings;
            const contractStore = useContractStore();
            const chainSettings = (chain.settings as EVMChainSettings);

            feedbackStore.setLoading('history.fetchEVMTransactionsForAccount');

            try {
                const response = await chain_settings.getEVMTransactions(toRaw(this.__evm_filter));
                const contracts = response.contracts;
                const transactions = response.results;

                // eztodo implement pagination instead of get all
                // const paginationData = {
                //     total: response.total_count,
                //     more: response.more,
                // };

                const contractAddresses = Object.keys(contracts);
                const parsedContracts: Record<string, ParsedIndexerAccountTransactionsContract> = {};
                contractAddresses.forEach((address: string) => {
                    const extraInfo = JSON.parse(contracts[address].calldata);
                    parsedContracts[address] = {
                        ...contracts[address],
                        ...extraInfo,
                    };
                });

                contractAddresses.forEach((address) => {
                    contractStore.addContractToCache(address, parsedContracts[address]);
                });

                const tlosInUsd = await chainSettings.getUsdPrice();
                this.setEVMTransactions(label, transactions);

                const shapedTransactionRows: ShapedTransactionRow[] = [];

                for (const tx of transactions) {
                    const transfers = await contractStore.getTransfersFromTransaction(tx);
                    const userAddress = this.__evm_filter.address;

                    const gasUsedInTlosBn = BigNumber.from(tx.gasPrice).mul(tx.gasused);
                    // eztodo move gas jawn to util
                    const gasUsedInTlos = +formatWei(
                        gasUsedInTlosBn.toLocaleString(),
                        WEI_PRECISION,
                        5,
                    );
                    const gasInUsdBn = convertCurrency(gasUsedInTlosBn, WEI_PRECISION, 2, tlosInUsd);
                    const gasInUsd = +(formatUnits(gasInUsdBn, 2));

                    // all contracts in transactions are cached, no need to use getContract
                    const toPrettyName = contractStore.cachedContracts[tx.to.toLowerCase()]?.name ?? '';
                    const fromPrettyName = contractStore.cachedContracts[tx.from.toLowerCase()]?.name ?? '';

                    // eztodo xfers needs to support erc 1155 too
                    const valuesIn: TransactionValueData[] = [];
                    const valuesOut: TransactionValueData[] = [];

                    const isFailed = tx.status !== '0x1';
                    let functionName = '';

                    if (tx.to !== userAddress) {
                        // if the user interacted with a contract, the 'to' field is that contract's address
                        functionName = await contractStore.getFunctionNameFromTransaction(tx, tx.to);
                    }

                    let actionName = '';

                    if (!isFailed) {
                        if (tx.value) {
                            const valueInFiatBn = convertCurrency(BigNumber.from(tx.value), WEI_PRECISION, 2, tlosInUsd);
                            const valueInFiat = +formatUnits(valueInFiatBn, 2);

                            if (tx.from === this.__evm_filter.address) {
                                valuesOut.push({
                                    amount: +formatUnits(tx.value, WEI_PRECISION),
                                    symbol: chainSettings.getSystemToken().symbol,
                                    fiatValue: valueInFiat,
                                });
                            }
                            if (tx.to === this.__evm_filter.address) {
                                valuesIn.push({
                                    amount: +formatUnits(tx.value, WEI_PRECISION),
                                    symbol: chainSettings.getSystemToken().symbol,
                                    fiatValue: valueInFiat,
                                });
                            }
                        }

                        transfers.forEach((xfer) => {
                            if (xfer.symbol && xfer.decimals) {
                                if (xfer.from === this.__evm_filter.address) {
                                    // sent from user
                                    valuesOut.push({
                                        amount: +formatUnits(xfer.value, xfer.decimals),
                                        symbol: xfer.symbol,
                                        fiatValue: undefined, // eztodo
                                    });
                                } else {
                                    // sent to user
                                    valuesIn.push({
                                        amount: +formatUnits(xfer.value, xfer.decimals),
                                        symbol: xfer.symbol,
                                        fiatValue: undefined, // eztodo
                                    });
                                }
                            }
                        });

                        if (tx.value && transfers.length === 0) {
                            if (tx.from === userAddress) {
                                actionName = 'send';
                            } else if (tx.to === userAddress) {
                                actionName = 'receive';
                            }
                        }

                        if (functionName && !['send', 'receive'].includes(actionName)) {
                            actionName = functionName;
                        }
                    }


                    shapedTransactionRows.push({
                        id: tx.hash,
                        epoch: tx.timestamp / 1000,
                        actionName,
                        from: tx.from,
                        fromPrettyName,
                        to: tx.to,
                        toPrettyName,
                        valuesIn,
                        valuesOut,
                        gasUsed: gasUsedInTlos,
                        gasFiatValue: gasInUsd,
                        failed: isFailed,
                    });
                }


                // debugger;
                this.setShapedTransactionRows(label, shapedTransactionRows);
                feedbackStore.unsetLoading('history.fetchEVMTransactionsForAccount');
            } catch (error) {
                // debugger;

                feedbackStore.unsetLoading('history.fetchEVMTransactionsForAccount');
                throw new AntelopeError('antelope.history.error_fetching_transactions');
            }
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
        setEVMTransactionsPagination(label: Label, pagination: EVMTransactionsPaginationData) {
            this.trace('setEVMTransactionsPagination', pagination);
            this.__evm_transactions_pagination_data[label] = pagination;
        },
    },
});

const historyInitialState: HistoryState = {
    __evm_transactions: {
        current: {
            transactions: [],
        },
    },
    __evm_filter: {
        address: '',
    },
    __shaped_evm_transaction_rows: {},
    __evm_transactions_pagination_data: {},
};


// async queryNextPage(label = 'current') {
//     this.trace('queryNextPage', label);
//     useFeedbackStore().setLoading('evm.switchChainInjected');
//     try {
//         const chain = useChainStore().getChain(label);
//         if (chain.settings.isNative()) {
//             console.error('History.queryNextPage() Native chains not supported yet');
//         } else {
//             const chain_settings = chain.settings as EVMChainSettings;
//
//             // query the next page of transactions
//             return chain_settings.getTransactions(toRaw(this.__evm_filter)).then(
//                 async (transactions) => {
//                     // Set as it comes for fast feedback
//                     this.setTransactions(label, transactions);
//
//                     // Proccess the transactions parsing on background
//                     const promises = transactions.map(trx => this.processTransaction(trx));
//                     Promise.allSettled(promises).then(async (parsedTransactionsResults) => {
//                         const parsedTransactions: ParsedEvmTransaction[] = parsedTransactionsResults
//                             .filter((result): result is PromiseFulfilledResult<ParsedEvmTransaction> => result.status === 'fulfilled')
//                             .map(result => result.value);
//
//                         await this.shapeTransactions(label, parsedTransactions);
//
//                         useFeedbackStore().unsetLoading('evm.switchChainInjected');
//                         this.trace('queryNextPage', label, 'done:', toRaw(this.getTransactions(label)));
//                     });
//                 },
//             );
//         }
//     } catch (e) {
//         throw new AntelopeError('antelope.history.error_fetching_transactions');
//     }
// },
// async processTransaction(transaction: EvmTransaction): Promise<ParsedEvmTransaction> {
//     this.trace('processTransaction', transaction);
//     const evm = useEVMStore();
//     try {
//         if (typeof transaction.value === 'number') {
//             const num = transaction.value as number;
//             transaction.value = num.toLocaleString('en-US', { useGrouping: false });
//         }
//         const bn = ethers.BigNumber.from(transaction.value);
//         transaction.value = formatWei(bn, 18);
//         if (transaction.input === '0x') {
//             // eztodo what does this mean?
//             return transaction as ParsedEvmTransaction;
//         }
//         if(!transaction.to) {
//             return transaction as ParsedEvmTransaction;
//         }
//         const contract = await evm.getContract(
//             transaction.to,
//         );
//
//         if (!contract) {
//             return transaction as ParsedEvmTransaction;
//         }
//         const trxDescription = await contract.parseTransaction(
//             transaction.input,
//         );
//         const parsedTrx = transaction as ParsedEvmTransaction;
//         if (trxDescription) {
//             parsedTrx.isParsed = true;
//             parsedTrx.description = trxDescription;
//             parsedTrx.contract = contract;
//         }
//         // Get ERC20 transfer from main function call
//         const signature = transaction.input.substring(0, 10);
//         if (
//             signature &&
//             TRANSFER_SIGNATURES.includes(signature) &&
//             parsedTrx.description.args['amount']
//         ) {
//             const token = await evm.getTokenData(transaction.to, 'erc20');
//             if (parsedTrx.contract && token && token.decimals >= 0){
//                 parsedTrx.isTransfer = true;
//                 parsedTrx.transfer = {
//                     'value': `${formatWei(parsedTrx.description.args['amount'], token.decimals)}`,
//                     'symbol': token.symbol,
//                 };
//             }
//         }
//         return parsedTrx;
//     } catch (e) {
//         console.error(e);
//     }
//     return transaction as ParsedEvmTransaction;
// },
// async shapeTransactions(label: Label, transactions: ParsedEvmTransaction[]): Promise<void> {
//     const tlosToUsd = await getCoingeckoUsdPrice('telos');
//
//     const shapedRowPromises: Promise<ShapedTransactionRow>[] = transactions.map(async (trx) => {
//         /*
//         actionName
//         fromPrettyName
//         toPrettyName
//         x valuesIn
//         x valuesOut
//         gasFiatValue
//         failed
//          */
//         // console.log(trx);
//         const gasInTlos = getGasInTlos(trx.gasused, trx.gasPrice);
//         const gasInTlosWei = parseUnits(gasInTlos, 18);
//         // debugger;
//         const gasInFiatBn = convertCurrency(gasInTlosWei, WEI_PRECISION, 2, tlosToUsd);
//         const gasInFiat = +formatWei(gasInFiatBn, 2, 2);
//         const shapedTx: Partial<ShapedTransactionRow> = {};
//
//         shapedTx.id = trx.hash ?? '';
//         shapedTx.epoch = trx.timestamp / 1000;
//         shapedTx.gasUsed = +gasInTlos;
//         shapedTx.gasFiatValue = gasInFiat;
//         shapedTx.to = trx.to;
//         shapedTx.from = trx.from;
//         shapedTx.valuesIn = [];
//         shapedTx.valuesOut = [];
//
//         // eztodo is gasused in tlos?
//         // console.log(+trx.gasused);
//
//         return shapedTx as ShapedTransactionRow;
//     });
//
//     let shaped: ShapedTransactionRow[] = [];
//
//     await Promise.all(shapedRowPromises).then((shapedRows) => {
//         shaped = shapedRows;
//     });
//
//     this.setShapedTransactions(label, shaped);
// },
