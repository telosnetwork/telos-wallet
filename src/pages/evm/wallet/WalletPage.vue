<script lang="ts">
import { defineComponent } from 'vue';

import { EvmToken } from 'src/antelope/types';

import AppPage from 'components/evm/AppPage.vue';
import WalletPageHeader from 'pages/evm/wallet/WalletPageHeader.vue';
import WalletBalanceRow from 'pages/evm/wallet/WalletBalanceRow.vue';
import { useBalancesStore, useFeedbackStore } from 'src/antelope';
import WalletTransactionsTab from 'pages/evm/wallet/WalletTransactionsTab.vue';

const feddback = useFeedbackStore();

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
        loadingStrings() {
            return feddback.getLoadings;
        },
        loading() {
            return feddback.isLoading('updateBalancesForAccount');
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
        <WalletBalanceRow
            v-for="(token, index) in allTokens"
            :key="`token-${index}`"
            :token="token"
            class="c-wallet-page__balance-row"
        />
        <div v-if="loading" class="c-wallet-page--loading">
            <q-spinner-dots
                color="primary"
                size="2em"
            />
        </div>
    </template>

    <template v-slot:transactions>
        <WalletTransactionsTab />
    </template>
</AppPage>
</template>

<style lang="scss">
.c-wallet-page {
    &--loading {
        text-align: center;
        margin-top: 20px;
    }

    &__balance-row {
        max-width: 1000px;
        margin: auto;
    }
}
</style>
