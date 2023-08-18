<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { BigNumber, ethers } from 'ethers';

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
const systemTokenName = computed(() => chainSettings.getSystemToken().name);
const systemTokenSymbol = computed(() => chainSettings.getSystemToken().symbol);
const stakedTokenSymbol = computed(() => chainSettings.getStakedSystemToken().symbol);

const totalFiatValueText = ref('$ 4,324.35');

const stakedFiatValueText = ref('$ 4,000.23');
const stakedTokenBalanceBn = ref(ethers.utils.parseUnits('34021.230', WEI_PRECISION));
const unstakingFiatValueText = ref('$ 200.72');
const unstakingBalanceBn = ref(ethers.utils.parseUnits('1242.0312', WEI_PRECISION));
const withdrawableFiatValueText = ref('$ 123.02');
const withdrawableBalanceBn = ref(ethers.utils.parseUnits('245.0225', WEI_PRECISION));

const apyPrittyPrint = ref('8.23%');
const unlockPeriod = ref('10 days');

// tvlAmountBn is a BigNumber representing 10 ETH (or 10 TLOS) with WEI_PRECISION decimals
const tvlAmountBn = ref(ethers.utils.parseUnits('102400.0', WEI_PRECISION));
const evmNetworkName = ref('Telos EVM');

const firstLineData = computed(() => [{
    label: $t('evm_stake.staked_card_label', { symbol: systemTokenSymbol.value }),
    tooltip: $t('evm_stake.staked_card_tooltip', { stakedSymbol: stakedTokenSymbol.value, systemSymbol: systemTokenSymbol.value }),
    primaryText: stakedFiatValueText.value,
    secondaryText: prettyPrintToken(stakedTokenBalanceBn.value, systemTokenSymbol.value),
    lowContrastSecondaryText: true,
    useSmallBox: true,
}, {
    label: $t('evm_stake.unstaking_card_label'),
    tooltip: $t('evm_stake.unstaking_card_tooltip', { stakedSymbol: stakedTokenSymbol.value, systemSymbol: systemTokenSymbol.value, unlockPeriod: unlockPeriod.value }),
    primaryText: unstakingFiatValueText.value,
    secondaryText: prettyPrintToken(unstakingBalanceBn.value, systemTokenSymbol.value),
    lowContrastSecondaryText: true,
    useSmallBox: true,
}, {
    label: $t('evm_stake.withdrawable_card_label'),
    tooltip: $t('evm_stake.withdrawable_card_tooltip', { stakedSymbol: stakedTokenSymbol.value, systemSymbol: systemTokenSymbol.value, unlockPeriod: unlockPeriod.value }),
    primaryText: withdrawableFiatValueText.value,
    secondaryText: prettyPrintToken(withdrawableBalanceBn.value, systemTokenSymbol.value),
    lowContrastSecondaryText: true,
    useSmallBox: true,
}]);

const secondLineData = computed(() => [{
    label: $t('evm_stake.apy_card_label', { symbol: systemTokenSymbol.value }),
    tooltip: $t('evm_stake.apy_card_tooltip', { stakedSymbol: stakedTokenSymbol.value, systemSymbol: systemTokenSymbol.value }),
    secondaryText: apyPrittyPrint.value,
    lowContrastSecondaryText: false,
    useSmallBox: true,
}, {
    label: $t('evm_stake.unstaking_period_card_label'),
    tooltip: $t('evm_stake.unstaking_period_card_tooltip', { stakedSymbol: stakedTokenSymbol.value, systemSymbol: systemTokenSymbol.value }),
    secondaryText: unlockPeriod.value,
    lowContrastSecondaryText: false,
    useSmallBox: true,
}, {
    label: $t('evm_stake.tvl_card_label'),
    tooltip: $t('evm_stake.tvl_card_tooltip', { evmNetworkName: evmNetworkName.value, stakedSymbol: stakedTokenSymbol.value, systemSymbol: systemTokenSymbol.value }),
    secondaryText: prettyPrintToken(tvlAmountBn.value, systemTokenSymbol.value),
    lowContrastSecondaryText: false,
    useSmallBox: true,
}]);


// methods
onBeforeMount(() => {
    chainSettings.getUsdPrice().then((price) => {
        systemTokenPrice.value = price;
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
        <h5>{{ $t('evm_stake.total_of_staked_unstaking_and_withdrawable', { token: systemTokenName }) }}</h5>
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
