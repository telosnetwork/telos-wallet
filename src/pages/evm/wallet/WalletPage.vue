<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { TokenBalance } from 'src/antelope/types';
import AppPage from 'components/evm/AppPage.vue';
import WalletPageHeader from 'pages/evm/wallet/WalletPageHeader.vue';
import WalletBalanceRow from 'pages/evm/wallet/WalletBalanceRow.vue';
import { useBalancesStore, useFeedbackStore } from 'src/antelope';
import WalletTransactionsTab from 'pages/evm/wallet/WalletTransactionsTab.vue';

const feedback = useFeedbackStore();
const tabs = ['balance', 'transactions'];
const totalFiatAmount = ref(0);

const allBalances = computed(() => useBalancesStore().loggedBalances);
const loading = computed(() => feedback.isLoading('updateBalancesForAccount'));

watch(allBalances, (newBalances: TokenBalance[]) => {
    let newFiatBalance = 0;
    for (let balance of newBalances){
        if (balance.token.price.isAvailable) {
            newFiatBalance += +balance.fiatStr;
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
                v-for="(balance, index) in allBalances"
                :key="`balance-${index}`"
                :balance="balance"
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
.c-wallet-page {
    &__row {
        max-width: 800px;
        margin: auto;
    }

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
