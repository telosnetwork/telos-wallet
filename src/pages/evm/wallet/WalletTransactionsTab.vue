<script lang="ts">
import { defineComponent, toRaw } from 'vue';
import WalletTransactionRow from 'pages/evm/wallet/WalletTransactionRow.vue';

import TableControls from 'components/evm/TableControls.vue';
import { CURRENT_CONTEXT, getAntelope, useAccountStore, useFeedbackStore, useHistoryStore } from 'src/antelope';
import { AntelopeError } from 'src/antelope/types';


const historyStore = useHistoryStore();
const accountStore = useAccountStore();
const feedbackStore = useFeedbackStore();

const rowsPerPageOptions = [5, 10, 20, 50, 100];

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
        rowsPerPageUpdating: false, // used to ensure loading state is shown when rows per page is updated
    }),
    computed: {
        doLiveUpdate() {
            return this.address && this.pagination.page === 1 && !this.errorsFound;
        },
        hashes() {
            return this.shapedTransactions.map(tx => tx.id);
        },
        loading() {
            const txLoading = feedbackStore.isLoading('history.fetchEVMTransactionsForAccount');
            const transfersLoading = feedbackStore.isLoading('history.fetchEvmNftTransfersForAccount');
            const actionsInProgress = txLoading || transfersLoading;
            return actionsInProgress;
        },
        address() {
            return accountStore.loggedEvmAccount?.address ?? '';
        },
        shapedTransactions() {
            return historyStore.getShapedTransactionRows(CURRENT_CONTEXT) ?? [];
        },
        totalRows() {
            return historyStore.getEvmTransactionsRowCount(CURRENT_CONTEXT);
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
                    totalRows: this.totalRows,
                },
            );
        },
    },
    watch: {
        address() {
            // address can be initially undefined; wait to load txs until it's defined
            // also reload txs if the user switches accounts
            this.getTransactions();
        },
        pagination: {
            handler(newPagination, oldPagination) {
                if (newPagination.rowsPerPage !== oldPagination.rowsPerPage) {
                    this.rowsPerPageUpdating = true;
                }

                const { rowsPerPage, page } = newPagination;

                this.$router.replace({
                    name: 'evm-wallet',
                    query: {
                        ...this.$route.query,
                        rowsPerPage,
                        page,
                    },
                });
            },
            deep: true,
        },
        totalRows: {
            immediate: true,
            handler(newValue) {
                if (this.pagination.rowsNumber === 0) {
                    // this means we just arrived the page, so we got to take the page and rowsPerPage from the url
                    const page = +(this.$route.query.page ?? 1);
                    const rowsPerPage = +(this.$route.query.rowsPerPage ?? 5);
                    const rowsNumber = newValue;
                    this.pagination = {
                        page,
                        rowsPerPage,
                        rowsCurrentPage: rowsPerPage,
                        rowsNumber,
                    };
                } else {
                    this.pagination.rowsNumber = newValue;
                }
            },
        },
        $route(newRoute) {
            if (newRoute.name !== 'evm-wallet' || newRoute.query.tab !== 'transactions') {
                return;
            }

            this.pagination = {
                page: +(newRoute.query.page ?? 1),
                rowsPerPage: +(newRoute.query.rowsPerPage ?? 5),
                rowsCurrentPage: this.pagination.rowsPerPage,
                rowsNumber: this.pagination.rowsNumber,
            };

            this.getTransactions().finally(() => {
                this.rowsPerPageUpdating = false;
            });
        },
    },
    created() {
        if (this.shapedTransactions.length) {
            this.initialLoadComplete = true;
        }

        this.getTransactions();

        this.fetchTransactionsInterval = setInterval(() => {
            if (this.doLiveUpdate) {
                this.getTransactions();
            }
        }, 13000);
    },
    unmounted() {
        if (this.fetchTransactionsInterval) {
            clearInterval(this.fetchTransactionsInterval);
        }
    },
    methods: {
        async getTransactions() {


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
                    await historyStore.fetchEVMTransactionsForAccount(CURRENT_CONTEXT);
                    this.pagination.rowsNumber = historyStore.getEvmTransactionsRowCount(CURRENT_CONTEXT);
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
        border-bottom: 2px solid var(--accent-color-3);

        @media only screen and (min-width: $breakpoint-sm-min) {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
        }
    }
}
</style>
