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
    ParsedEvmTransaction,
    TRANSFER_SIGNATURES,
    IndexerTransactionsFilter,
    HyperionActionsFilter, ShapedTransactionRow,
} from 'src/antelope/types';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { useChainStore } from 'src/antelope/stores/chain';
import { toRaw } from 'vue';
import { formatWei, getGasInTlos, WEI_PRECISION } from 'src/antelope/stores/utils';
import { ethers } from 'ethers';
import { useEVMStore } from 'src/antelope/stores/evm';
import { getAntelope } from '..';
import { convertCurrency } from 'src/antelope/stores/utils/currency-utils';
import { getCoingeckoUsdPrice } from 'src/api/price';
import { parseUnits } from 'ethers/lib/utils';


export interface HistoryState {
    __native_filter: HyperionActionsFilter;
    __evm_filter: IndexerTransactionsFilter;
    __transactions: { [label: Label]: EvmTransaction[] };
    __shaped_transactions: { [label: Label]: ShapedTransactionRow[] };
}

const store_name = 'history';

export const useHistoryStore = defineStore(store_name, {
    state: (): HistoryState => (historyInitialState),
    getters: {
        getTransactions: state => (label: string): EvmTransaction[] => state.__transactions[label],
        getNativeFilter: state => state.__native_filter,
        getEVMFilter: state => state.__evm_filter,
        getShapedTransactions: state => (label: string): ShapedTransactionRow[] => state.__shaped_transactions[label],
    },
    actions: {
        trace: createTraceFunction(store_name),
        init: () => {
            useFeedbackStore().setDebug(store_name, isTracingAll());
            getAntelope().events.onAccountChanged.subscribe({
                next: ({ account }) => {
                    const self = useHistoryStore();
                    if (account) {
                        if (account.isNative) {
                            self.setNativeFilter({ account: account.account });
                        } else {
                            self.setEVMFilter({ address: account.account });
                        }
                    }
                },
            });
        },
        async queryNextPage(label = 'current') {
            this.trace('queryNextPage', label);
            useFeedbackStore().setLoading('evm.switchChainInjected');
            try {
                const chain = useChainStore().getChain(label);
                if (chain.settings.isNative()) {
                    console.error('History.queryNextPage() Native chains not supported yet');
                } else {
                    const chain_settings = chain.settings as EVMChainSettings;

                    // query the next page of transactions
                    return chain_settings.getTransactions(toRaw(this.__evm_filter)).then(
                        async (transactions) => {
                            // Set as it comes for fast feedback
                            this.setTransactions(label, transactions);

                            // Proccess the transactions parsing on background
                            const promises = transactions.map(trx => this.processTransaction(trx));
                            Promise.allSettled(promises).then(async (parsedTransactionsResults) => {
                                const parsedTransactions: ParsedEvmTransaction[] = parsedTransactionsResults
                                    .filter((result): result is PromiseFulfilledResult<ParsedEvmTransaction> => result.status === 'fulfilled')
                                    .map(result => result.value);

                                await this.shapeTransactions(label, parsedTransactions);

                                useFeedbackStore().unsetLoading('evm.switchChainInjected');
                                this.trace('queryNextPage', label, 'done:', toRaw(this.getTransactions(label)));
                            });
                        },
                    );
                }
            } catch (e) {
                throw new AntelopeError('antelope.history.error_fetching_transactions');
            }
        },
        async processTransaction(transaction: EvmTransaction): Promise<ParsedEvmTransaction> {
            this.trace('processTransaction', transaction);
            const evm = useEVMStore();
            try {
                if (typeof transaction.value === 'number') {
                    const num = transaction.value as number;
                    transaction.value = num.toLocaleString('en-US', { useGrouping: false });
                }
                const bn = ethers.BigNumber.from(transaction.value);
                transaction.value = formatWei(bn, 18);
                if (transaction.input === '0x') {
                    return transaction as ParsedEvmTransaction;
                }
                if(!transaction.to) {
                    return transaction as ParsedEvmTransaction;
                }
                const contract = await evm.getContract(
                    transaction.to,
                );
                if (!contract) {
                    return transaction as ParsedEvmTransaction;
                }
                const trxDescription = await contract.parseTransaction(
                    transaction.input,
                );
                const parsedTrx = transaction as ParsedEvmTransaction;
                if (trxDescription) {
                    parsedTrx.isParsed = true;
                    parsedTrx.description = trxDescription;
                    parsedTrx.contract = contract;
                }
                // Get ERC20 transfer from main function call
                const signature = transaction.input.substring(0, 10);
                if (
                    signature &&
                    TRANSFER_SIGNATURES.includes(signature) &&
                    parsedTrx.description.args['amount']
                ) {
                    const token = await evm.getTokenData(transaction.to, 'erc20');
                    if (parsedTrx.contract && token && token.decimals >= 0){
                        parsedTrx.isTransfer = true;
                        parsedTrx.transfer = {
                            'value': `${formatWei(parsedTrx.description.args['amount'], token.decimals)}`,
                            'symbol': token.symbol,
                        };
                    }
                }
                return parsedTrx;
            } catch (e) {
                console.error(e);
            }
            return transaction as ParsedEvmTransaction;
        },
        async shapeTransactions(label: Label, transactions: EvmTransaction[]): Promise<void> {
            const tlosToUsd = await getCoingeckoUsdPrice('telos');

            const shapedRowPromises: Promise<ShapedTransactionRow>[] = transactions.map(async (trx) => {
                /*
                actionName
                fromPrettyName
                toPrettyName
                x valuesIn
                x valuesOut
                gasFiatValue
                failed
                 */
                // console.log(trx);
                const gasInTlos = getGasInTlos(trx.gasused, trx.gasPrice);
                const gasInTlosWei = parseUnits(gasInTlos, 18);
                // debugger;
                const gasInFiatBn = convertCurrency(gasInTlosWei, WEI_PRECISION, 2, tlosToUsd);
                const gasInFiat = +formatWei(gasInFiatBn, 18, 2);
                const shapedTx: Partial<ShapedTransactionRow> = {};

                shapedTx.id = trx.hash ?? '';
                shapedTx.epoch = trx.timestamp / 1000;
                shapedTx.gasUsed = +gasInTlos;
                shapedTx.gasFiatValue = gasInFiat;
                shapedTx.to = trx.to;
                shapedTx.from = trx.from;
                shapedTx.valuesIn = [];
                shapedTx.valuesOut = [];

                // eztodo is gasused in tlos?
                // console.log(+trx.gasused);

                return shapedTx as ShapedTransactionRow;
            });

            let shaped: ShapedTransactionRow[] = [];

            await Promise.all(shapedRowPromises).then((shapedRows) => {
                shaped = shapedRows;
            });

            this.setShapedTransactions(label, shaped);
        },

        // commits ---
        setNativeFilter(filter: HyperionActionsFilter) {
            this.trace('setNativeFilter', filter);
            useHistoryStore().__native_filter = filter;
        },
        setEVMFilter(filter: IndexerTransactionsFilter) {
            this.trace('setEVMFilter', filter);
            useHistoryStore().__evm_filter = filter;
        },
        setTransactions(label: Label, transactions: EvmTransaction[]) {
            this.trace('setTransactions', label, transactions);
            useHistoryStore().__transactions[label] = transactions;
        },
        setShapedTransactions(label: Label, transactions: ShapedTransactionRow[]) {
            this.trace('setShapedTransactions', transactions);
            this.__shaped_transactions[label] = transactions;
        },
    },
});

const historyInitialState: HistoryState = {
    __transactions: {},
    __native_filter: {},
    __evm_filter: {
        address: '',
    },
    __shaped_transactions: {},
};
