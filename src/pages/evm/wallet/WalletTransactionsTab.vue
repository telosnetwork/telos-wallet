<script lang="ts">
import { defineComponent } from 'vue';
import WalletTransactionRow from 'pages/evm/wallet/WalletTransactionRow.vue';
import { ShapedTransactionRow } from 'src/antelope/types';

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
        shapedTransactionsOld(): ShapedTransactionRow[] {
            return [{
                id: '0x'.concat('1'.repeat(40)),
                epoch: 1681775186,
                actionName: 'send',
                from: '0x'.concat('1'.repeat(40)),
                fromPrettyName: '',
                to: '0x'.concat('2'.repeat(40)),
                toPrettyName: '',
                valuesIn: [{
                    amount: 100,
                    symbol: 'TLOS',
                    fiatValue: 100,
                }],
                valuesOut: [{
                    amount: 100,
                    symbol: 'TLOS',
                    fiatValue: 100,
                }, {
                    amount: 35.1234,
                    symbol: 'USDC',
                }],
                gasUsed: 0.15,
                gasFiatValue: 0.03,
            }, {
                id: '0x'.concat('1'.repeat(40)),
                epoch: 1681775186,
                actionName: 'swap',
                from: '0x'.concat('1'.repeat(40)),
                fromPrettyName: '',
                to: '0x'.concat('2'.repeat(40)),
                toPrettyName: '',
                valuesIn: [{
                    amount: 100,
                    symbol: 'FAIRY',
                    fiatValue: 100,
                }],
                valuesOut: [{
                    amount: 100,
                    symbol: 'sFAIRY',
                    fiatValue: 100,
                }],
                gasUsed: 0.15,
                gasFiatValue: 0.03,
            },  {
                id: '0x'.concat('1'.repeat(40)),
                epoch: 1681775186,
                actionName: 'receive',
                from: '0x'.concat('1'.repeat(40)),
                fromPrettyName: 'SomeAddress',
                to: '0x'.concat('2'.repeat(40)),
                toPrettyName: '',
                valuesIn: [{
                    amount: 100.54121,
                    symbol: 'NERD',
                }, {
                    amount: 357542547.674235,
                    symbol: 'SHIB',
                }, {
                    amount: 1307.45,
                    symbol: 'TLOS',
                    fiatValue: 54.45123513,
                }],
                valuesOut: [],
                gasUsed: 0.15,
                gasFiatValue: 0.03,
            }, {
                id: '0x'.concat('1'.repeat(40)),
                epoch: 1681775186,
                actionName: 'stake',
                from: '0x'.concat('3'.repeat(40)),
                fromPrettyName: '',
                to: '0x'.concat('4'.repeat(40)),
                toPrettyName: 'SomeContract',
                valuesIn: [{
                    amount: 100,
                    symbol: 'TLOS',
                    fiatValue: 100,
                }],
                valuesOut: [{
                    amount: 100,
                    symbol: 'sTLOS',
                    fiatValue: 100,
                }],
                gasUsed: 0.15,
                gasFiatValue: 0.03,
            }, {
                id: '0x'.concat('1'.repeat(40)),
                epoch: 1681775186,
                actionName: 'approve',
                from: '0x'.concat('3'.repeat(40)),
                fromPrettyName: '',
                to: '0x'.concat('4'.repeat(40)),
                toPrettyName: '',
                valuesIn: [],
                valuesOut: [],
                gasUsed: 0.15,
                gasFiatValue: 0.03,
            }, {
                id: '0x'.concat('1'.repeat(40)),
                epoch: 1681775186,
                actionName: '',
                from: '0x'.concat('3'.repeat(40)),
                fromPrettyName: '',
                to: '0x'.concat('4'.repeat(40)),
                toPrettyName: '',
                valuesIn: [],
                valuesOut: [],
                gasUsed: 0.15,
                gasFiatValue: 0.03,
                failed: true,
            }, {
                id: '0x'.concat('1'.repeat(40)),
                epoch: 1681775186,
                actionName: '',
                from: '0x'.concat('3'.repeat(40)),
                fromPrettyName: '',
                to: '0x'.concat('4'.repeat(40)),
                toPrettyName: '',
                valuesIn: [],
                valuesOut: [],
                gasUsed: 0.15,
                gasFiatValue: 0.03,
            }];
        },
        transactionsToShow() {
            const { page, rowsPerPage } = this.pagination;
            const start = (page - 1) * rowsPerPage;
            const end = start + rowsPerPage;

            return this.shapedTransactions.slice(start, end);
        },
        totalRowsText() {
            if (this.loading) {
                return '';
            }

            // eztodo: i18n
            return `Viewing ${this.pagination.rowsPerPage} of ${this.shapedTransactions.length} transactions`;
        },
    },
    watch: {
        shapedTransactions(newValue) {
            this.pagination.rowsNumber = newValue.length;
        },
        async address (address) {
            // eztodo also do this on created
            // address can be initially undefined; wait to load txs until it's defined
            if (address) {
                historyStore.setEVMTransactionsFilter({ address, includeAbi: true });
                await historyStore.fetchEVMTransactionsForAccount('current');
            }
        },
    },
    async created() {
        if (this.address) {
            historyStore.setEVMTransactionsFilter({ address: this.address, includeAbi: true });
            await historyStore.fetchEVMTransactionsForAccount('current');
        }
    },
});
</script>

<template>
<div class="c-wallet-tx-tab">
    <div class="c-wallet-tx-tab__header-container">
        <!--eztodo i18n-->
        <span class="c-wallet-tx-tab__header-text">Transactions</span>
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

    <!--eztodo icons showing up late-->
    <WalletTransactionRow
        v-for="(transaction, index) in transactionsToShow"
        v-else
        :key="`tx-${index}`"
        :transaction="transaction"
        class="q-mb-lg"
    />

    <div class="flex justify-center q-my-xl">
        <TableControls :pagination="pagination" @pagination-updated="pagination = $event"/>
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

    &__header-text {
        font-weight: 600;
        font-size: 20px;
        line-height: 130%;
    }

}
</style>
