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
        hideLoadingState: false,
        fetchTransactionsInterval: null as null | NodeJS.Timer,
    }),
    computed: {
        doLiveUpdate() {
            return this.address && this.pagination.page === 1 && !this.errorsFound;
        },
        hashes() {
            return this.shapedTransactions.map(tx => tx.id);
        },
        loading() {
            return feedbackStore.isLoading('history.fetchEVMTransactionsForAccount') && !this.hideLoadingState;
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
        address() {
            // address can be initially undefined; wait to load txs until it's defined
            // also reload txs if the user switches accounts
            this.getTransactions();
        },
        pagination() {
            this.getTransactions();
        },
    },
    created() {
        if (this.shapedTransactions.length > 0) {
            this.hideLoadingState = true;
        }

        this.fetchTransactionsInterval = setInterval(() => {
            if (this.doLiveUpdate) {
                this.hideLoadingState = true;

                this.getTransactions().finally(() => {
                    this.enableLoadingState();
                });
            }
        }, 13000);

        this.getTransactions().finally(() => {
            this.enableLoadingState();
        });
    },
    unmounted() {
        if (this.fetchTransactionsInterval) {
            clearInterval(this.fetchTransactionsInterval);
        }
    },
    methods: {
        enableLoadingState() {
            // a timeout of 500ms is used in the history store to prevent the loading state from flashing; account for that here
            setTimeout(() => {
                this.hideLoadingState = false;
            }, 550);
        },
        isLoadingTransaction(i: number) {
            const loadingFlag = `history.shapeTransactions-${i}`;
            return feedbackStore.isLoading(loadingFlag);
        },
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
                    await historyStore.fetchEVMTransactionsForAccount('current');
                    this.pagination.rowsNumber = historyStore.getEvmTransactionsRowCount('current');
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

    <template
        v-for="i of pagination.rowsCurrentPage"
        v-else
        :key="`tx-${i}`"
    >
        <template v-if="!shapedTransactions[i-1]">
            <q-skeleton
                type="QToolbar"
                class="q-mb-lg"
            />
        </template>

        <WalletTransactionRow
            v-else
            :transaction="shapedTransactions[i-1]"
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
