<script setup lang="ts">
import { computed } from 'vue';
import { useUserStore, useBalancesStore, useChainStore } from 'src/antelope';
import { getCurrencySymbol } from 'src/antelope/stores/utils/currency-utils';
import { NativeCurrencyAddress } from 'src/antelope/types';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { WEI_PRECISION, formatWei } from 'src/antelope/stores/utils';

const userStore = useUserStore();
const balancesStore = useBalancesStore();
const chainStore = useChainStore();
const chainSettings = (chainStore.loggedChain.settings as EVMChainSettings);

// eztodo loading state
// computed
const fiatLocale = computed(() => userStore.fiatLocale);
const fiatCurrency = computed(() => userStore.fiatCurrency);
const fiatSymbol = computed(() => getCurrencySymbol(fiatLocale.value, fiatCurrency.value));
const totalFiatValueText = computed(() => {
    const systemTokenFiatValueBn = chainSettings.getSystemToken().price.value;
    const wrappedTokenFiatValueBn = chainSettings.getWrappedSystemToken().price.value;
    const added = systemTokenFiatValueBn.add(wrappedTokenFiatValueBn);

    // eztodo this is 0.0 when value is 0, should be 0.00
    return `${fiatSymbol.value} ${formatWei(added, WEI_PRECISION)}`;
});

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
</script>

<template>
<div class="c-wrap-header">
    <!-- eztodo i18n -->
    <h5>Total of Wrapped Telos and Telos</h5>
    <h1>{{ totalFiatValueText }}</h1>
    <p class="o-text--small-bold u-text--low-contrast">
        {{ totalSystemAndWrappedBalance }} {{ totalBalanceUnitsText }}
    </p>
</div>
</template>

<style lang="scss">
.c-wrap-header {
    text-align: center;
}
</style>
