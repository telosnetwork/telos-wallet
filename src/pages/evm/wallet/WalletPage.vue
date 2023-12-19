<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { TokenBalance } from 'src/antelope/types';
import AppPage from 'components/evm/AppPage.vue';
import WalletPageHeader from 'pages/evm/wallet/WalletPageHeader.vue';
import WalletBalanceRow from 'pages/evm/wallet/WalletBalanceRow.vue';
import { CURRENT_CONTEXT, useAccountStore, useBalancesStore, useFeedbackStore, useHistoryStore } from 'src/antelope';
import WalletTransactionsTab from 'pages/evm/wallet/WalletTransactionsTab.vue';
// import { metakeepCache } from 'src/antelope/wallets/ual/utils/metakeep-cache';
import { useI18n } from 'vue-i18n';

const route = useRoute();
const { t: $t } = useI18n();
const historyStore = useHistoryStore();
const accountStore = useAccountStore();
const feedback = useFeedbackStore();

const tabs = ['balance', 'transactions'];

// data
const totalFiatAmount = ref(0);

// computed
const allBalances = computed(() => useBalancesStore().currentBalances);
const loading = computed(() => feedback.isLoading('updateBalancesForAccount'));

// watchers
watch(allBalances, (newBalances: TokenBalance[]) => {
    let newFiatBalance = 0;
    for (let balance of newBalances){
        if (balance.token.price.isAvailable) {
            newFiatBalance += +balance.fiatStr;
        }
    }
    totalFiatAmount.value = newFiatBalance;

}, { deep: true, immediate: true });

watch(accountStore, (newAccountStoreState) => {
    const newAccount = newAccountStoreState.loggedEvmAccount;

    // if user is on the balances screen, prefetch transactions & transfers
    if (newAccount?.address && route.query.tab !== 'transactions') {
        historyStore.setEVMTransactionsFilter({
            address: newAccount.address,
            offset: 0,
            limit: 5,
            includeAbi: true,
        });
        historyStore.fetchEVMTransactionsForAccount(CURRENT_CONTEXT);
    }
}, { immediate: true });


// -------- migration functions ------------
/*
const metakeepAlreadyCreated = computed(() => {
    const emails = metakeepCache.getMails();
    if (emails.length > 0) {
        const ethPubKey = metakeepCache.getEthAddress(emails[0]);
        if (ethPubKey) {
            return ethPubKey;
        }
    }
    return '';
});

const nftsStore = useNftsStore();
const balanceStore = useBalancesStore();
const nfts = computed(() => nftsStore.loggedInventory);
const balances = computed(() => balanceStore.loggedBalances);
const authenticator = useAccountStore().getAccount(CURRENT_CONTEXT).authenticator;
console.log('authenticator', authenticator);
const currentAuthName = authenticator?.getName() || '';
if (currentAuthName === 'metakeep' && metakeepAlreadyCreated.value !== '') {
    // we need to notify the user that he needs to migrate his assets
    getAntelope().config.notifyRememberInfoHandler(
        $t('temporal.you_need_to_migrate_title'),
        [{
            tag: 'p',
            class: 'c-notify__message--subtitle',
            text: $t('temporal.you_need_to_migrate_sub_title'),
        }, {
            tag: 'p',
            class: '',
            text: nfts.value.length > 0 ? $t('temporal.you_need_to_migrate_nfts_first') : $t('temporal.you_need_to_migrate_all_tokens'),
        }],
        '',
        'telos-cloud-discontinued',
    );
}
*/

</script>

<template>
<AppPage :tabs="tabs">
    <template v-slot:header>
        <WalletPageHeader :total-balance="totalFiatAmount"/>
    </template>

    <template v-slot:balance>
        <div class="c-wallet-page__row">
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
