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
                id: '', // transaction id
                epoch: 1681775186, // timestamp - unix
                actionName: 'send', // send, receive, swap, anything else
                from: '0x'.concat('1'.repeat(40)), // address
                fromPrettyName: '', // blank or name like Swappi
                to: '0x'.concat('2'.repeat(40)), // address
                toPrettyName: '', // blank or name like Swappi
                valueIn: {
                    amount: 100, // number, already converted from wei
                    symbol: '', // string e.g. TLOS
                    fiatValue: 100, // number
                },
                valueOut: {
                    amount: 100, // number, already converted from wei
                    symbol: '', // string e.g. TLOS
                    fiatValue: 100, // number
                },
                gasUsed: 0.15, // gas in tlos, number
                gasFiatValue: 0.03, // gas in fiat, number
            }, {
                id: '', // transaction id
                epoch: 1681775186, // timestamp - unix
                actionName: 'swapTokensForExactTokens', // send, receive, swapTokensForExactTokens, anything else
                from: '0x'.concat('1'.repeat(40)), // address
                fromPrettyName: '', // blank or name like Swappi
                to: '0x'.concat('2'.repeat(40)), // address
                toPrettyName: '', // blank or name like Swappi
                valueIn: {
                    amount: 100, // number, already converted from wei
                    symbol: '', // string e.g. TLOS
                    fiatValue: 100, // number
                },
                valueOut: {
                    amount: 100, // number, already converted from wei
                    symbol: '', // string e.g. TLOS
                    fiatValue: 100, // number
                },
                gasUsed: 0.15, // gas in tlos, number
                gasFiatValue: 0.03, // gas in fiat, number
            },  {
                id: '', // transaction id
                epoch: 1681775186, // timestamp - unix
                actionName: 'receive', // send, receive, swapTokensForExactTokens, anything else
                from: '0x'.concat('1'.repeat(40)), // address
                fromPrettyName: 'SomeAddress', // blank or name like Swappi
                to: '0x'.concat('2'.repeat(40)), // address
                toPrettyName: '', // blank or name like Swappi
                valueIn: {
                    amount: 100, // number, already converted from wei
                    symbol: '', // string e.g. TLOS
                    fiatValue: 100, // number
                },
                valueOut: {
                    amount: 100, // number, already converted from wei
                    symbol: '', // string e.g. TLOS
                    fiatValue: 100, // number
                },
                gasUsed: 0.15, // gas in tlos, number
                gasFiatValue: 0.03, // gas in fiat, number
            }, {
                id: '', // transaction id
                epoch: 1681775186, // timestamp - unix
                actionName: 'stake', // send, receive, swap, anything else
                from: '0x'.concat('3'.repeat(40)), // address
                fromPrettyName: '', // blank or name like Swappi
                to: '0x'.concat('4'.repeat(40)), // address
                toPrettyName: 'SomeContract', // blank or name like Swappi
                valueIn: {
                    amount: 100, // number, already converted from wei
                    symbol: '', // string e.g. TLOS
                    fiatValue: 100, // number
                },
                valueOut: {
                    amount: 100, // number, already converted from wei
                    symbol: '', // string e.g. TLOS
                    fiatValue: 100, // number
                },
                gasUsed: 0.15, // gas in tlos, number
                gasFiatValue: 0.03, // gas in fiat, number
            }, {
                id: '', // transaction id
                epoch: 1681775186, // timestamp - unix
                actionName: 'approve', // send, receive, swap, anything else
                from: '0x'.concat('3'.repeat(40)), // address
                fromPrettyName: '', // blank or name like Swappi
                to: '0x'.concat('4'.repeat(40)), // address
                toPrettyName: '', // blank or name like Swappi
                valueIn: {
                    amount: 100, // number, already converted from wei
                    symbol: '', // string e.g. TLOS
                    fiatValue: 100, // number
                },
                valueOut: {
                    amount: 100, // number, already converted from wei
                    symbol: '', // string e.g. TLOS
                    fiatValue: 100, // number
                },
                gasUsed: 0.15, // gas in tlos, number
                gasFiatValue: 0.03, // gas in fiat, number
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
/>
</template>

<style lang="scss">

</style>
