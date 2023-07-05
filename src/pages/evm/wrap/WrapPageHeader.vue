<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue';
import { useUserStore, useBalancesStore, useChainStore } from 'src/antelope';
import { prettyPrintCurrency } from 'src/antelope/stores/utils/currency-utils';
import { NativeCurrencyAddress } from 'src/antelope/types';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { WEI_PRECISION, formatWei } from 'src/antelope/stores/utils';
import { useI18n } from 'vue-i18n';

const { t: $t } = useI18n();
const userStore = useUserStore();
const balancesStore = useBalancesStore();
const chainStore = useChainStore();
const chainSettings = (chainStore.loggedChain.settings as EVMChainSettings);

// data
const systemTokenPrice = ref(0); // always equal to wrapped token price
const loading = ref(true);

// computed
const fiatLocale = computed(() => userStore.fiatLocale);
const fiatCurrency = computed(() => userStore.fiatCurrency);
const totalFiatValueText = computed(() => {
    if (loading.value) {
        return '--';
    }

    const totalBalance = +totalSystemAndWrappedBalance.value;
    const totalFiatValue = totalBalance * systemTokenPrice.value;

    return prettyPrintCurrency(totalFiatValue, 2, fiatLocale.value, false, fiatCurrency.value, false);
});

const systemTokenName = computed(() => chainSettings.getSystemToken().name);
const allBalances = computed(() => balancesStore.loggedBalances);
const systemTokenBalanceBn =  computed(() => allBalances.value.find(b => b.token.contract === NativeCurrencyAddress)?.balance);
const wrappedTokenBalanceBn = computed(() =>
    allBalances.value.find(b => b.token.contract === chainSettings.getWrappedSystemToken().address)?.balance,
);
const totalSystemAndWrappedBalance = computed(() => {
    if (!systemTokenBalanceBn.value || !wrappedTokenBalanceBn.value) {
        return '0';
    }
    const addedBn = systemTokenBalanceBn.value.add(wrappedTokenBalanceBn.value);

    return formatWei(addedBn, WEI_PRECISION);
});
const totalBalanceUnitsText = computed(() => {
    const systemSymbol = chainSettings.getSystemToken().symbol;
    const wrappedSymbol = chainSettings.getWrappedSystemToken().symbol;

    return `${systemSymbol} + ${wrappedSymbol}`;
});


// methods
onBeforeMount(() => {
    chainSettings.getUsdPrice().then((price) => {
        systemTokenPrice.value = price;
    }).finally(() => {
        loading.value = false;
    });
});
</script>

<template>
<div class="text-center">
    <h5>{{ $t('evm_wrap.total_of_wrapped_and_unwrapped', { token: systemTokenName }) }}</h5>
    <h1 class="u-text--high-contrast">{{ totalFiatValueText }}</h1>
    <p v-if="!loading" class="o-text--small-bold u-text--low-contrast">
        {{ totalSystemAndWrappedBalance }} {{ totalBalanceUnitsText }}
    </p>
</div>
</template>

<style lang="scss">
</style>
