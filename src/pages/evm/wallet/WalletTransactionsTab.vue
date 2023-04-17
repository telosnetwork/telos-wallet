<script lang="ts">
import { defineComponent } from 'vue';
import WalletTransactionRow from 'pages/evm/wallet/WalletTransactionRow.vue';

export default defineComponent({
    name: 'WalletTransactionsTab',
    components: {
        WalletTransactionRow,
    },
});
</script>

<template>
<WalletTransactionRow />
</template>

<style lang="scss">

</style>
