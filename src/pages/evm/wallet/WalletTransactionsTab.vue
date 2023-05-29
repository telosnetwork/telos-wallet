<script lang="ts">
import { defineComponent } from 'vue';
import WalletTransactionRow from 'pages/evm/wallet/WalletTransactionRow.vue';

import TableControls from 'components/evm/TableControls.vue';
import { useAccountStore, useFeedbackStore, useHistoryStore } from 'src/antelope';


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
            rowsNumber: 0,
        },
    }),
    computed: {
        loading() {
            return feedbackStore.isLoading('history.fetchEVMTransactionsForAccount');
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
        this.getTransactions();
    },
    methods: {
        async getTransactions() {
            const offset = (this.pagination.page - 1) * this.pagination.rowsPerPage;
            const limit = this.pagination.rowsPerPage;

            if (this.address) {
                historyStore.setEVMTransactionsFilter({
                    address: this.address,
                    offset,
                    limit,
                    includeAbi: true,
                });
                await historyStore.fetchEVMTransactionsForAccount('current');
                this.pagination.rowsNumber = historyStore.getEvmTransactionsRowCount('current');
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
            v-for="i of pagination.rowsPerPage"
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

    <WalletTransactionRow
        v-for="(transaction, index) in shapedTransactions"
        v-else
        :key="`tx-${index}`"
        :transaction="transaction"
        class="q-mb-lg"
    />

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
