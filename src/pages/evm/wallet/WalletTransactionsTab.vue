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
                id: '0x'.concat('1'.repeat(40)), // transaction id
                epoch: 1681775186, // timestamp - unix
                actionName: 'send', // send, receive, swap, anything else
                from: '0x'.concat('1'.repeat(40)), // address
                fromPrettyName: '', // blank or name like Swappi
                to: '0x'.concat('2'.repeat(40)), // address
                toPrettyName: '', // blank or name like Swappi
                valuesIn: [{
                    amount: 100, // number, already converted from wei
                    symbol: 'TLOS', // string e.g. TLOS
                    fiatValue: 100, // number
                }],
                valuesOut: [{
                    amount: 100, // number, already converted from wei
                    symbol: 'TLOS', // string e.g. TLOS
                    fiatValue: 100, // number
                }, {
                    amount: 35.1234, // number, already converted from wei
                    symbol: 'USDC', // string e.g. TLOS
                }],
                gasUsed: 0.15, // gas in tlos, number
                gasFiatValue: 0.03, // gas in fiat, number
            }, {
                id: '0x'.concat('1'.repeat(40)), // transaction id
                epoch: 1681775186, // timestamp - unix
                actionName: 'swap', // send, receive, swap, anything else
                from: '0x'.concat('1'.repeat(40)), // address
                fromPrettyName: '', // blank or name like Swappi
                to: '0x'.concat('2'.repeat(40)), // address
                toPrettyName: '', // blank or name like Swappi
                valuesIn: [{
                    amount: 100, // number, already converted from wei
                    symbol: 'FAIRY', // string e.g. TLOS
                    fiatValue: 100, // number
                }],
                valuesOut: [{
                    amount: 100, // number, already converted from wei
                    symbol: 'sFAIRY', // string e.g. TLOS
                    fiatValue: 100, // number
                }],
                gasUsed: 0.15, // gas in tlos, number
                gasFiatValue: 0.03, // gas in fiat, number
            },  {
                id: '0x'.concat('1'.repeat(40)), // transaction id
                epoch: 1681775186, // timestamp - unix
                actionName: 'receive', // send, receive, swap, anything else
                from: '0x'.concat('1'.repeat(40)), // address
                fromPrettyName: 'SomeAddress', // blank or name like Swappi
                to: '0x'.concat('2'.repeat(40)), // address
                toPrettyName: '', // blank or name like Swappi
                valuesIn: [{
                    amount: 100, // number, already converted from wei
                    symbol: 'USDT', // string e.g. TLOS
                }],
                valuesOut: [],
                gasUsed: 0.15, // gas in tlos, number
                gasFiatValue: 0.03, // gas in fiat, number
            }, {
                id: '0x'.concat('1'.repeat(40)), // transaction id
                epoch: 1681775186, // timestamp - unix
                actionName: 'stake', // send, receive, swap, anything else
                from: '0x'.concat('3'.repeat(40)), // address
                fromPrettyName: '', // blank or name like Swappi
                to: '0x'.concat('4'.repeat(40)), // address
                toPrettyName: 'SomeContract', // blank or name like Swappi
                valuesIn: [{
                    amount: 100, // number, already converted from wei
                    symbol: 'TLOS', // string e.g. TLOS
                    fiatValue: 100, // number
                }],
                valuesOut: [{
                    amount: 100, // number, already converted from wei
                    symbol: 'sTLOS', // string e.g. TLOS
                    fiatValue: 100, // number
                }],
                gasUsed: 0.15, // gas in tlos, number
                gasFiatValue: 0.03, // gas in fiat, number
            }, {
                id: '0x'.concat('1'.repeat(40)), // transaction id
                epoch: 1681775186, // timestamp - unix
                actionName: 'approve', // send, receive, swap, anything else
                from: '0x'.concat('3'.repeat(40)), // address
                fromPrettyName: '', // blank or name like Swappi
                to: '0x'.concat('4'.repeat(40)), // address
                toPrettyName: '', // blank or name like Swappi
                valuesIn: [],
                valuesOut: [],
                gasUsed: 0.15, // gas in tlos, number
                gasFiatValue: 0.03, // gas in fiat, number
            }, {
                id: '0x'.concat('1'.repeat(40)), // transaction id
                epoch: 1681775186, // timestamp - unix
                actionName: '', // send, receive, swap, anything else
                from: '0x'.concat('3'.repeat(40)), // address
                fromPrettyName: '', // blank or name like Swappi
                to: '0x'.concat('4'.repeat(40)), // address
                toPrettyName: '', // blank or name like Swappi
                valuesIn: [],
                valuesOut: [],
                failed: true,
            }, {
                id: '0x'.concat('1'.repeat(40)), // transaction id
                epoch: 1681775186, // timestamp - unix
                actionName: '', // send, receive, swap, anything else
                from: '0x'.concat('3'.repeat(40)), // address
                fromPrettyName: '', // blank or name like Swappi
                to: '0x'.concat('4'.repeat(40)), // address
                toPrettyName: '', // blank or name like Swappi
                valuesIn: [],
                valuesOut: [],
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
