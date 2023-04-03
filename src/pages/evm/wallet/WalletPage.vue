<script lang="ts">
import { defineComponent } from 'vue';
import AppPage from 'components/evm/AppPage.vue';
import WalletPageHeader from 'pages/evm/wallet/WalletPageHeader.vue';

export default defineComponent({
    name: 'WalletPage',
    components: {
        WalletPageHeader,
        AppPage,
    },
    data: () => ({
        tabs: ['balance', 'transactions'],
    }),

});
</script>

<template>
<AppPage :tabs="tabs">
    <template v-slot:header>
        <WalletPageHeader />
    </template>

    <template v-slot:balance>
        <p>balance tab</p>
    </template>

    <template v-slot:transactions>
        <p>txns tab</p>
    </template>
</AppPage>
</template>

<style lang="scss">
.c-wallet-page {

}
</style>
