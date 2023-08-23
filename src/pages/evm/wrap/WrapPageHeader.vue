<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { BigNumber } from 'ethers';

import { useUserStore, useBalancesStore, useChainStore } from 'src/antelope';
import { prettyPrintCurrency } from 'src/antelope/stores/utils/currency-utils';
import { NativeCurrencyAddress } from 'src/antelope/types';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { WEI_PRECISION, formatWei } from 'src/antelope/stores/utils';

import ScrollableInfoCards from 'components/evm/ScrollableInfoCards.vue';


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
const systemTokenSymbol = computed(() => chainSettings.getSystemToken().symbol);
const wrappedTokenSymbol = computed(() => chainSettings.getWrappedSystemToken().symbol);
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
const unwrappedFiatValueText = computed(() => prettyPrintCurrency(
    +formatWei(systemTokenBalanceBn.value ?? BigNumber.from(0), WEI_PRECISION) * systemTokenPrice.value,
    2,
    fiatLocale.value,
    false,
    fiatCurrency.value,
    false,
));
const wrappedFiatValueText = computed(() => prettyPrintCurrency(
    +formatWei(wrappedTokenBalanceBn.value ?? BigNumber.from(0), WEI_PRECISION) * systemTokenPrice.value,
    2,
    fiatLocale.value,
    false,
    fiatCurrency.value,
    false,
));
const prettySystemTokenFiatPrice = computed(() => prettyPrintCurrency(+systemTokenPrice.value, 2, fiatLocale.value, false, fiatCurrency.value, false));

const cardData = computed(() => [{
    label: $t('evm_wrap.wrapped_card_label', { symbol: systemTokenSymbol.value }),
    tooltip: $t('evm_wrap.wrapped_card_tooltip', { wrappedSymbol: wrappedTokenSymbol.value, systemSymbol: systemTokenSymbol.value }),
    primaryText: wrappedFiatValueText.value,
    secondaryText: prettyPrintToken(wrappedTokenBalanceBn.value, true),
    lowContrastSecondaryText: true,
}, {
    label: systemTokenSymbol.value,
    tooltip: $t('evm_wrap.unwrapped_card_tooltip', { wrappedSymbol: wrappedTokenSymbol.value, systemSymbol: systemTokenSymbol.value }),
    primaryText: unwrappedFiatValueText.value,
    secondaryText: prettyPrintToken(systemTokenBalanceBn.value, false),
    lowContrastSecondaryText: true,
}]);


// methods
onBeforeMount(() => {
    chainSettings.getUsdPrice().then((price) => {
        systemTokenPrice.value = price;
    }).finally(() => {
        loading.value = false;
    });
});

function prettyPrintToken(amount: BigNumber | undefined, isWrapped: boolean) {
    return prettyPrintCurrency(
        amount ?? BigNumber.from(0),
        4,
        fiatLocale.value,
        false,
        isWrapped ? wrappedTokenSymbol.value : systemTokenSymbol.value,
        false,
        WEI_PRECISION,
    );
}
</script>

<template>
<div class="c-wrap-header">
    <div class="text-center">
        <h5>{{ $t('evm_wrap.total_of_wrapped_and_unwrapped', { token: systemTokenName }) }}</h5>
        <h1 class="u-text--high-contrast">{{ totalFiatValueText }}</h1>
        <p class="u-text--low-contrast q-mb-xl">
            <span class="o-text--small-bold">
                {{ totalSystemAndWrappedBalance }} {{ totalBalanceUnitsText }}
            </span>
            <span v-if="prettySystemTokenFiatPrice" class="o-text--small">
                @ {{ prettySystemTokenFiatPrice  }}
            </span>
        </p>
    </div>

    <ScrollableInfoCards :cards="cardData" />
</div>
</template>

<style lang="scss">
.c-wrap-header {
    width: 100%;
}
</style>
