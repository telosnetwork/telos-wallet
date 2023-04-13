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
    HyperionActionsFilter,
} from 'src/antelope/types';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { useChainStore } from 'src/antelope/stores/chain';
import { toRaw } from 'vue';
import { formatWei } from 'src/antelope/stores/utils';
import { ethers } from 'ethers';
import { useEVMStore } from 'src/antelope/stores/evm';
import { getAntelope } from '..';


export interface HistoryState {
    __filter: HyperionActionsFilter;
    __transactions: { [label: Label]: EvmTransaction[] };
}

const store_name = 'history';

export const useHistoryStore = defineStore(store_name, {
    state: (): HistoryState => (historyInitialState),
    getters: {
        getTransactions: state => (label: string) => state.__transactions[label],
        getFilter: state => state.__filter,
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
                            self.setFilter({ account: account.account });
                        } else {
                            self.setFilter({ address: account.account });
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
                    chain_settings.getTransactions(toRaw(this.__filter)).then(
                        async (transactions) => {
                            // Set as it comes for fast feedback
                            this.setTransactions(label, transactions);

                            // Proccess the transactions parsing on background
                            const promises = transactions.map(trx => this.processTransaction(trx));
                            Promise.allSettled(promises).then(() => {
                                useFeedbackStore().unsetLoading('evm.switchChainInjected');
                                this.trace('queryNextPage', label, 'done:', toRaw(this.getTransactions(label)));
                            });
                        },
                    );
                }
            } catch (e) {
                throw new AntelopeError('antelope.history.error_fetching_trasactions');
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
                if (transaction.input_data === '0x') {
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
                    transaction.input_data,
                );
                const parsedTrx = transaction as ParsedEvmTransaction;
                if (trxDescription) {
                    parsedTrx.isParsed = true;
                    parsedTrx.description = trxDescription;
                    parsedTrx.contract = contract;
                }
                // Get ERC20 transfer from main function call
                const signature = transaction.input_data.substring(0, 10);
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
        // commits ---
        setFilter(filter: HyperionActionsFilter) {
            this.trace('setFilter', filter);
            useHistoryStore().__filter = filter;
        },
        setTransactions(label: Label, transactions: EvmTransaction[]) {
            this.trace('setTransactions', label, transactions);
            useHistoryStore().__transactions[label] = transactions;
        },
    },
});

const historyInitialState: HistoryState = {
    __transactions: {},
    __filter: {},
};
