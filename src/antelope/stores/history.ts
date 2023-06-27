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
    getAntelope,
    useFeedbackStore,
    useChainStore,
    useContractStore,
    useUserStore,
} from 'src/antelope';
import { createTraceFunction, isTracingAll } from 'src/antelope/stores/feedback';
import {
    Label,
    EvmTransaction,
    AntelopeError,
    IndexerTransactionsFilter,
    ShapedTransactionRow,
    ParsedIndexerAccountTransactionsContract,
    EVMTransactionsPaginationData, TransactionValueData, EvmSwapFunctionNames,
} from 'src/antelope/types';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { toRaw } from 'vue';
import { BigNumber } from 'ethers';
import { formatUnits } from 'ethers/lib/utils';
import { getGasInTlos, WEI_PRECISION } from 'src/antelope/stores/utils';
import { convertCurrency } from 'src/antelope/stores/utils/currency-utils';
import { getFiatPriceFromIndexer } from 'src/api/price';



export interface HistoryState {
    __evm_filter: IndexerTransactionsFilter;
    __evm_transactions: {
        [label: Label]: {
            transactions: EvmTransaction[],
        },
    };
    __total_evm_transaction_count: {
        [label: Label]: number,
    };
    __shaped_evm_transaction_rows: {
        [label: Label]: ShapedTransactionRow[],
    };
    __evm_transactions_pagination_data: {
        [label: Label]: EVMTransactionsPaginationData,
    };
}

const store_name = 'history';

export const useHistoryStore = defineStore(store_name, {
    state: (): HistoryState => (historyInitialState),
    getters: {
        getEVMTransactions: state => (label: Label): EvmTransaction[] => state.__evm_transactions[label].transactions,
        getEVMTransactionsFilter: state => state.__evm_filter,
        getShapedTransactionRows: state => (label: Label): ShapedTransactionRow[] => state.__shaped_evm_transaction_rows[label],
        getEVMTransactionsPagination: state => (label: Label): EVMTransactionsPaginationData => state.__evm_transactions_pagination_data[label],
        getEvmTransactionsRowCount: state => (label: Label): number => state.__total_evm_transaction_count[label],
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
            const userStore = useUserStore();
            const chain = useChainStore().getChain(label);
            const chain_settings = chain.settings as EVMChainSettings;
            const indexer = chain_settings.getIndexer();
            const contractStore = useContractStore();
            const chainSettings = (chain.settings as EVMChainSettings);

            feedbackStore.setLoading('history.fetchEVMTransactionsForAccount');

            try {
                const response = await chain_settings.getEVMTransactions(toRaw(this.__evm_filter));
                const contracts = response.contracts;
                const transactions = response.results;

                this.setEvmTransactionsRowCount(label, response.total_count);

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
                    const userAddressLower = this.__evm_filter.address.toLowerCase();

                    const gasUsedInTlosBn = BigNumber.from(tx.gasPrice).mul(tx.gasused);
                    const gasUsedInTlos = getGasInTlos(tx.gasused, tx.gasPrice);
                    const gasInUsdBn = convertCurrency(gasUsedInTlosBn, WEI_PRECISION, 2, tlosInUsd);
                    const gasInUsd = +(formatUnits(gasInUsdBn, 2));

                    // all contracts in transactions are cached, no need to use getContract
                    const toPrettyName = contractStore.__cachedContracts[tx.to?.toLowerCase()]?.name ?? '';
                    const fromPrettyName = contractStore.__cachedContracts[tx.from?.toLowerCase()]?.name ?? '';

                    const valuesIn: TransactionValueData[] = [];
                    const valuesOut: TransactionValueData[] = [];

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
                            const valueInFiatBn = convertCurrency(BigNumber.from(tx.value), WEI_PRECISION, 2, tlosInUsd);
                            const valueInFiat = +formatUnits(valueInFiatBn, 2);

                            if (tx.from?.toLowerCase() === userAddressLower) {
                                valuesOut.push({
                                    amount: +formatUnits(tx.value, WEI_PRECISION),
                                    symbol: chainSettings.getSystemToken().symbol,
                                    fiatValue: valueInFiat,
                                });
                            }
                            if (tx.to?.toLowerCase() === userAddressLower) {
                                valuesIn.push({
                                    amount: +formatUnits(tx.value, WEI_PRECISION),
                                    symbol: chainSettings.getSystemToken().symbol,
                                    fiatValue: valueInFiat,
                                });
                            }
                        }

                        for (const tokenXfer of transfers) {
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

                        if (isContractCreation) {
                            actionName = 'contractCreation';
                        } else if (+tx.value && transfers.length === 0 && !functionName) {
                            if (tx.from?.toLowerCase() === userAddressLower) {
                                actionName = 'send';
                            } else if (tx.to?.toLowerCase() === userAddressLower) {
                                actionName = 'receive';
                            }
                        } else if (EvmSwapFunctionNames.includes(functionName)) {
                            actionName = 'swap';
                        } else if (functionName) {
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
        setEvmTransactionsRowCount(label: Label, count: number) {
            this.trace('setEvmTransactionsRowCount', count);
            this.__total_evm_transaction_count[label] = count;
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
    __shaped_evm_transaction_rows: {},
    __evm_transactions_pagination_data: {},
};
