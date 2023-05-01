<script lang="ts">
import { defineComponent } from 'vue';

import { EvmToken } from 'src/antelope/types';

import AppPage from 'components/evm/AppPage.vue';
import WalletPageHeader from 'pages/evm/wallet/WalletPageHeader.vue';
import WalletBalanceRow from 'pages/evm/wallet/WalletBalanceRow.vue';
import { useBalancesStore } from 'src/antelope';
import WalletTransactionsTab from 'pages/evm/wallet/WalletTransactionsTab.vue';

export default defineComponent({
    name: 'WalletPage',
    components: {
        WalletTransactionsTab,
        AppPage,
        WalletBalanceRow,
        WalletPageHeader,
    },
    data: () => ({
        tabs: ['balance', 'transactions'],
    }),
    computed: {
        allTokens() {
            return useBalancesStore().loggedBalances as EvmToken[];
        },
    },
});
</script>

<template>
<AppPage :tabs="tabs">
    <template v-slot:header>
        <WalletPageHeader/>
    </template>

    <template v-slot:balance>
        <div class="test">
            <WalletBalanceRow
                v-for="(token, index) in allTokens"
                :key="`token-${index}`"
                :token="token"
                class="q-mb-xs"
            />
        </div>
    </template>

    <template v-slot:transactions>
        <WalletTransactionsTab />
    </template>
</AppPage>
</template>

<style lang="scss">
.test {
    max-width: 1000px;
    margin: auto;
}

.c-wallet-page {

}
</style>
