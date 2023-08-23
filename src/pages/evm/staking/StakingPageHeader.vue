<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { BigNumber, ethers } from 'ethers';

import { useUserStore, useBalancesStore, useChainStore } from 'src/antelope';
import { convertCurrency, prettyPrintCurrency } from 'src/antelope/stores/utils/currency-utils';
import { NativeCurrencyAddress } from 'src/antelope/types';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { WEI_PRECISION, formatWei } from 'src/antelope/stores/utils';

import ScrollableInfoCards from 'components/evm/ScrollableInfoCards.vue';

const label = 'current';
const { t: $t } = useI18n();
const userStore = useUserStore();
const balancesStore = useBalancesStore();
const chainStore = useChainStore();
const chainSettings = (chainStore.loggedChain.settings as EVMChainSettings);
// data
const loading = ref(true);


// computed
const fiatLocale = computed(() => userStore.fiatLocale);
const fiatCurrency = computed(() => userStore.fiatCurrency);
const systemToken = chainSettings.getSystemToken();
const stakedToken = chainSettings.getStakedSystemToken();

const totalFiatValueText = ref('$ 4,324.35');

// First cell: Staked
const stakedTokenBalanceBn = computed(() => balancesStore.getBalances(label).find(balance => balance.token.symbol === stakedToken.symbol)?.amount);
const unstakedRatio = computed(() => chainStore.getUnstakedRatio(label));
const isStakedLoading = computed(() => stakedTokenBalanceBn.value === undefined || unstakedRatio.value.isZero());
const stakedExpressedInSystemBalanceBn = computed(() => {
    if (stakedTokenBalanceBn.value && !unstakedRatio.value.isZero()) {
        const ratioNumber = ethers.utils.formatUnits(unstakedRatio.value, stakedToken.decimals);
        console.log('ratioNumber', ratioNumber);
        return convertCurrency(stakedTokenBalanceBn.value, stakedToken.decimals, stakedToken.decimals, ratioNumber);
    } else {
        return undefined;
    }
});
const systemTokenPrice = ref(systemToken.price.value);
const stakedFiatValueBn = computed(() => {
    if (stakedExpressedInSystemBalanceBn.value && systemTokenPrice.value) {
        const ratioNumber = ethers.utils.formatUnits(systemTokenPrice.value, systemToken.price.decimals);
        return convertCurrency(stakedExpressedInSystemBalanceBn.value, stakedToken.decimals, systemToken.decimals, ratioNumber);
    } else {
        return undefined;
    }
});

// Second cell: Unstaking
const unstakingFiatValueText = ref('$ 200.72');
const unstakingBalanceBn = ref(stakedTokenBalanceBn);

// Third cell: Withdrawable
const withdrawableFiatValueText = ref('$ 123.02');
const withdrawableBalanceBn = ref(unstakedRatio);

const apyPrittyPrint = computed(() => {
    const apy = chainStore.currentEvmChain?.apy;
    if (apy) {
        return apy + '%';
    } else {
        return '--';
    }
});
const apyisLoading = computed(() => apyPrittyPrint.value === '--');
const unlockPeriod = ref('10 days');

// tvlAmountBn is a BigNumber representing 10 ETH (or 10 TLOS) with WEI_PRECISION decimals
const tvlAmountBn = ref(ethers.utils.parseUnits('102400.0', WEI_PRECISION));
const evmNetworkName = ref('Telos EVM');

const firstLineData = computed(() => [{
    label: $t('evm_stake.staked_card_label', { symbol: systemToken.symbol }),
    tooltip: $t('evm_stake.staked_card_tooltip', { stakedSymbol: stakedToken.symbol, systemSymbol: systemToken.symbol }),
    primaryText: prettyPrintToken(stakedFiatValueBn.value, fiatCurrency.value),
    secondaryText: isStakedLoading.value ? '' : prettyPrintToken(stakedExpressedInSystemBalanceBn.value, systemToken.symbol),
    lowContrastSecondaryText: true,
    isPrimaryLoading: isStakedLoading.value,
    useSmallBox: true,
}, {
    label: $t('evm_stake.unstaking_card_label'),
    tooltip: $t('evm_stake.unstaking_card_tooltip', { stakedSymbol: stakedToken.symbol, systemSymbol: systemToken.symbol, unlockPeriod: unlockPeriod.value }),
    primaryText: unstakingFiatValueText.value,
    secondaryText: prettyPrintToken(unstakingBalanceBn.value, systemToken.symbol),
    lowContrastSecondaryText: true,
    useSmallBox: true,
}, {
    label: $t('evm_stake.withdrawable_card_label'),
    tooltip: $t('evm_stake.withdrawable_card_tooltip', { stakedSymbol: stakedToken.symbol, systemSymbol: systemToken.symbol, unlockPeriod: unlockPeriod.value }),
    primaryText: withdrawableFiatValueText.value,
    secondaryText: prettyPrintToken(withdrawableBalanceBn.value, systemToken.symbol),
    lowContrastSecondaryText: true,
    useSmallBox: true,
}]);

const secondLineData = computed(() => [{
    label: $t('evm_stake.apy_card_label', { symbol: systemToken.symbol }),
    tooltip: $t('evm_stake.apy_card_tooltip', { stakedSymbol: stakedToken.symbol, systemSymbol: systemToken.symbol }),
    secondaryText: apyPrittyPrint.value,
    lowContrastSecondaryText: false,
    isSecondaryLoading: apyisLoading.value,
    useSmallBox: true,
}, {
    label: $t('evm_stake.unstaking_period_card_label'),
    tooltip: $t('evm_stake.unstaking_period_card_tooltip', { stakedSymbol: stakedToken.symbol, systemSymbol: systemToken.symbol }),
    secondaryText: unlockPeriod.value,
    lowContrastSecondaryText: false,
    useSmallBox: true,
}, {
    label: $t('evm_stake.tvl_card_label'),
    tooltip: $t('evm_stake.tvl_card_tooltip', { evmNetworkName: evmNetworkName.value, stakedSymbol: stakedToken.symbol, systemSymbol: systemToken.symbol }),
    secondaryText: prettyPrintToken(tvlAmountBn.value, systemToken.symbol),
    lowContrastSecondaryText: false,
    useSmallBox: true,
}]);


// methods
onBeforeMount(() => {
    chainSettings.getUsdPrice().then((price) => {
        // systemTokenPrice.value = price;
    }).finally(() => {
        loading.value = false;
    });
});

function prettyPrintToken(amount: BigNumber | undefined, symbol: string) {
    return prettyPrintCurrency(
        amount ?? BigNumber.from(0),
        4,
        fiatLocale.value,
        false,
        symbol,
        false,
        WEI_PRECISION,
    );
}
</script>

<template>
<div class="c-staking-header">
    <div class="text-center q-mb-xl">
        <h5>{{ $t('evm_stake.total_of_staked_unstaking_and_withdrawable', { token: systemToken.name }) }}</h5>
        <h1 class="u-text--high-contrast">{{ totalFiatValueText }}</h1>
    </div>

    <ScrollableInfoCards class="c-staking-header__cards-first-line" :cards="firstLineData" />
    <ScrollableInfoCards class="c-staking-header__cards-second-line" :cards="secondLineData" />
</div>
</template>

<style lang="scss">
.c-staking-header {
    width: 100%;

    &__cards-second-line {
        margin-top: 24px;
    }
}
</style>
