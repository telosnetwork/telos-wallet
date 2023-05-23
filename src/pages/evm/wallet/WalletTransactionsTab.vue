<script lang="ts">
import { defineComponent } from 'vue';
import WalletTransactionRow from 'pages/evm/wallet/WalletTransactionRow.vue';
import { ShapedTransactionRow } from 'src/antelope/types';



export default defineComponent({
    name: 'WalletTransactionsTab',
    components: {
        WalletTransactionRow,
    },
    computed: {
        shapedTransactions(): ShapedTransactionRow[] {
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
    },
});
</script>

<template>
<WalletTransactionRow
    v-for="(transaction, index) in shapedTransactions"
    :key="`tx-${index}`"
    :transaction="transaction"
    class="c-wallet-tx-tab__row"
/>

</template>

<style lang="scss">
.c-wallet-tx-tab {
    &__row {
        margin: auto;
    }
}
</style>
