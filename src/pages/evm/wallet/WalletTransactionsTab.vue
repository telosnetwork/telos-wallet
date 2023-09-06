<script lang="ts">
import { defineComponent } from 'vue';
import WalletTransactionRow from 'pages/evm/wallet/WalletTransactionRow.vue';

import TableControls from 'components/evm/TableControls.vue';
import { getAntelope, useAccountStore, useFeedbackStore, useHistoryStore } from 'src/antelope';
import { AntelopeError } from 'src/antelope/types';


const historyStore = useHistoryStore();
const accountStore = useAccountStore();
const feedbackStore = useFeedbackStore();

export default defineComponent({
    name: 'WalletTransactionsTab',
    components: {
        TableControls,
        WalletTransactionRow,
    },
    data: () => ({
        pagination: {
            page: 1,
            rowsPerPage: 5,
            rowsCurrentPage: 5,
            rowsNumber: 0,
        },
        errorsFound: false,
        fetchTransactionsInterval: null as null | ReturnType<typeof setInterval>,
        initialLoadComplete: false,
    }),
    computed: {
        doLiveUpdate() {
            return this.address && this.pagination.page === 1 && !this.errorsFound;
        },
        hashes() {
            return this.shapedTransactions.map(tx => tx.id);
        },
        loading() {
            // eztodo when loading balances tab then clicking transactions tab, it says "showing 5 of 0 transactions"
            const txLoading = feedbackStore.isLoading('history.fetchEVMTransactionsForAccount');
            const transfersLoading = feedbackStore.isLoading('history.fetchEvmNftTransfersForAccount');
            const actionsInProgress = txLoading || transfersLoading;
            const hideLoadingState = this.pagination.page === 1 && this.initialLoadComplete;

            // don't show the loading state if we're on the first page and transactions are already present
            // this covers two scenarios, 1. the user came to the page from the balances page, meaning we prefetched transactions
            // or 2. the user is on the first page and we are re-fetching transactions on an interval
            return actionsInProgress && !hideLoadingState;
        },
        address() {
            return accountStore.loggedEvmAccount?.address ?? '';
        },
        shapedTransactions() {
            return historyStore.getShapedTransactionRows('current') ?? [];
        },
        totalRowsText() {
            if (this.loading) {
                return '';
            }
            const rowsPerPage = Math.min(this.pagination.rowsPerPage, this.shapedTransactions.length);
            return this.$t(
                'evm_wallet.viewing_n_transactions',
                {
                    rowsPerPage,
                    totalRows: this.pagination.rowsNumber,
                },
            );
        },
    },
    watch: {
        shapedTransactions(newValue) {
            this.pagination.rowsNumber = newValue.length;
        },
        // eztodo debounce fetch tx
        address() {
            // address can be initially undefined; wait to load txs until it's defined
            // also reload txs if the user switches accounts
            console.log('getting txs from addy change'); // eztodo

            this.getTransactions();
        },
        pagination() {
            this.getTransactions();
        },
    },
    created() {
        if (this.shapedTransactions.length) {
            this.initialLoadComplete = true;
        }

        // eztodo add interval for transfers
        this.fetchTransactionsInterval = setInterval(() => {
            if (this.doLiveUpdate) {
                // eztodo
                console.log('getting txs from interval');

                this.getTransactions();
            }
        }, 13000);

        // this.getTransactions().finally(() => {
        //     this.initialLoadComplete = true;
        // });
    },
    unmounted() {
        if (this.fetchTransactionsInterval) {
            clearInterval(this.fetchTransactionsInterval);
        }
    },
    methods: {
        async getTransactions() {
            console.log('getTransactions');

            const offset = (this.pagination.page - 1) * this.pagination.rowsPerPage;
            let limit = this.pagination.rowsPerPage;

            // if the user is on the last page, we need to adjust the limit and rows in current page
            const max = this.pagination.rowsNumber - this.pagination.rowsPerPage * (this.pagination.page - 1);
            if (this.pagination.rowsNumber > 0 && limit > max) {
                limit = max;
                this.pagination.rowsCurrentPage = limit;
            } else {
                this.pagination.rowsCurrentPage = this.pagination.rowsPerPage;
            }

            if (this.address) {
                historyStore.setEVMTransactionsFilter({
                    address: this.address,
                    offset,
                    limit,
                    includeAbi: true,
                });
                try {
                    if (historyStore.getEVMTransfers('current').length === 0) {
                        await historyStore.fetchEvmNftTransfersForAccount('current', this.address);
                    }
                    await historyStore.fetchEVMTransactionsForAccount('current');
                    this.pagination.rowsNumber = historyStore.getEvmTransactionsRowCount('current');
                    this.initialLoadComplete = true;
                } catch (e) {
                    if (e instanceof AntelopeError) {
                        getAntelope().config.notifyFailureMessage(e.message, e.payload);
                        this.errorsFound = true;
                    }
                }
            }
        },
    },
});
</script>

<template>
<div class="c-wallet-tx-tab">
    <div class="c-wallet-tx-tab__header-container">
        <h2>{{ $t('global.transactions') }}</h2>
        <span v-if="totalRowsText">{{ totalRowsText }}</span>
    </div>

    <template v-if="loading">
        <q-skeleton
            v-for="i of pagination.rowsCurrentPage"
            :key="i"
            type="QToolbar"
            class="q-mb-lg"
        />
    </template>

    <h5
        v-else-if="shapedTransactions.length === 0"
        class="text-center"
    >
        {{ $t('evm_wallet.no_transactions_found') }}
    </h5>

    <!-- eztodo transactions dont exist on teloscan -->
    <template v-else>
        <WalletTransactionRow
            v-for="(tx, index) of shapedTransactions"
            :key="`tx-${index}`"
            :transaction="tx"
            class="q-mb-lg"
        />
    </template>

    <div class="flex justify-center q-my-xl">
        <TableControls :pagination="pagination" @pagination-updated="pagination = $event" />
    </div>
</div>


</template>

<style lang="scss">
.c-wallet-tx-tab {
    max-width: 1000px;
    margin: auto;

    &__header-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding-bottom: 24px;
        margin-bottom: 24px;
        border-bottom: 2px solid $page-header;

        @media only screen and (min-width: $breakpoint-sm-min) {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
        }
    }
}
</style>
