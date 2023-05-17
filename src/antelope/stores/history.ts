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
import { formatWei, getGasInTlos, WEI_PRECISION } from 'src/antelope/stores/utils';
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
                    const gasUsedInTlos = getGasInTlos(tx.gasused, tx.gasPrice);
                    const gasInUsdBn = convertCurrency(gasUsedInTlosBn, WEI_PRECISION, 2, tlosInUsd);
                    const gasInUsd = +(formatUnits(gasInUsdBn, 2));

                    // all contracts in transactions are cached, no need to use getContract
                    const toPrettyName = contractStore.cachedContracts[tx.to.toLowerCase()]?.name ?? '';
                    const fromPrettyName = contractStore.cachedContracts[tx.from.toLowerCase()]?.name ?? '';

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
                        gasUsed: +gasUsedInTlos,
                        gasFiatValue: gasInUsd,
                        failed: isFailed,
                    });
                }

                this.setShapedTransactionRows(label, shapedTransactionRows);
                feedbackStore.unsetLoading('history.fetchEVMTransactionsForAccount');
            } catch (error) {
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
