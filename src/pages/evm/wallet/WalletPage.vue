<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { EvmToken } from 'src/antelope/types';
import AppPage from 'components/evm/AppPage.vue';
import WalletPageHeader from 'pages/evm/wallet/WalletPageHeader.vue';
import WalletBalanceRow from 'pages/evm/wallet/WalletBalanceRow.vue';
import { useBalancesStore, useFeedbackStore } from 'src/antelope';
import WalletTransactionsTab from 'pages/evm/wallet/WalletTransactionsTab.vue';

const feedback = useFeedbackStore();
const tabs = ['balance', 'transactions'];
const totalFiatAmount = ref(0);

const allTokens = computed(() => useBalancesStore().loggedBalances as EvmToken[]);
const loadingStrings = computed(() => feedback.getLoadings);
const loading = computed(() => feedback.isLoading('updateBalancesForAccount'));

watch(allTokens, (newBalances: EvmToken[]) => {
    let newFiatBalance = 0;
    for (let balance of newBalances){
        if (balance.fiatBalance){
            newFiatBalance += parseFloat(balance.fiatBalance);
        }
    }
    totalFiatAmount.value = newFiatBalance;
}, { deep: true, immediate: true });
</script>

<template>
<AppPage :tabs="tabs">
    <template v-slot:header>
        <WalletPageHeader :total-balance="totalFiatAmount"/>
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
        <div
            :class="{
                'c-wallet-page__loading': true,
                'c-wallet-page__loading--hide': !loading
            }"
        >
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
.test {
    max-width: 1000px;
    margin: auto;
}

.c-wallet-page {
    &__loading {
        opacity: 1;
        text-align: center;
        margin-top: 20px;
        transition: opacity 0.4s linear 0.8s;
        &--hide {
            opacity: 0;
        }
    }
}
</style>
