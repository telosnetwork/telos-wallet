<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { BigNumber, ethers } from 'ethers';

import { useUserStore, useBalancesStore, useChainStore, useRexStore } from 'src/antelope';
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

// computed
const fiatLocale = computed(() => userStore.fiatLocale);
const fiatCurrency = computed(() => userStore.fiatCurrency);
const systemToken = chainSettings.getSystemToken();
const stakedToken = chainSettings.getStakedSystemToken();


// First cell: Staked
const stakedTokenBalanceBn = computed(() => balancesStore.getBalances(label).find(balance => balance.token.symbol === stakedToken.symbol)?.amount);
const unstakedRatio = computed(() => chainStore.getUnstakedRatio(label));
const isStakedLoading = computed(() => stakedTokenBalanceBn.value === undefined || unstakedRatio.value.isZero());
const stakedExpressedInSystemBalanceBn = computed(() => {
    if (stakedTokenBalanceBn.value && !unstakedRatio.value.isZero()) {
        const ratioNumber = ethers.utils.formatUnits(unstakedRatio.value, stakedToken.decimals);
        return convertCurrency(stakedTokenBalanceBn.value, stakedToken.decimals, stakedToken.decimals, ratioNumber);
    } else {
        return undefined;
    }
});
const systemTokenPrice = computed(() => balancesStore.getBalances(label).find(balance => balance.token.symbol === systemToken.symbol)?.token.price.value);
const stakedFiatValueBn = computed(() => {
    if (stakedExpressedInSystemBalanceBn.value && systemTokenPrice.value && !systemTokenPrice.value.isZero()) {
        const ratioNumber = ethers.utils.formatUnits(systemTokenPrice.value, systemToken.price.decimals);
        return convertCurrency(stakedExpressedInSystemBalanceBn.value, stakedToken.decimals, systemToken.decimals, ratioNumber);
    } else {
        return undefined;
    }
});

// Second cell: Unstaking
const unstakingBalanceBn = computed(() => {
    const rexData = useRexStore().getRexData(label);
    if (rexData) {
        const totalBalance = rexData.balance;
        const withdrawableBalance = rexData.withdrawable;
        if (totalBalance && withdrawableBalance) {
            return totalBalance.sub(withdrawableBalance);
        } else {
            return undefined;
        }
    } else {
        return undefined;
    }
});
const unstakingFiatValueBn = computed(() => {
    if (unstakingBalanceBn.value && systemTokenPrice.value && !systemTokenPrice.value.isZero()) {
        const ratioNumber = ethers.utils.formatUnits(systemTokenPrice.value, systemToken.price.decimals);
        return convertCurrency(unstakingBalanceBn.value, stakedToken.decimals, systemToken.decimals, ratioNumber);
    } else {
        return undefined;
    }
});
const isUnstakingLoading = computed(() => unstakingBalanceBn.value === undefined);

// Third cell: Withdrawable
const withdrawableBalanceBn = computed(() => useRexStore().getRexData(label)?.withdrawable);
const withdrawableFiatValueBn = computed(() => {
    if (withdrawableBalanceBn.value && systemTokenPrice.value && !systemTokenPrice.value.isZero()) {
        const ratioNumber = ethers.utils.formatUnits(systemTokenPrice.value, systemToken.price.decimals);
        return convertCurrency(withdrawableBalanceBn.value, stakedToken.decimals, systemToken.decimals, ratioNumber);
    } else {
        return undefined;
    }
});
const isWithdrawableLoading = computed(() => withdrawableBalanceBn.value === undefined);


const apyPrittyPrint = computed(() => {
    const apy = chainStore.currentEvmChain?.apy;
    if (apy) {
        return apy + '%';
    } else {
        return '--';
    }
});
const apyisLoading = computed(() => apyPrittyPrint.value === '--');
const unlockPeriod = ref($t('evm_stake.unstaking_period'));

// tvlAmountBn is a BigNumber representing 10 ETH (or 10 TLOS) with WEI_PRECISION decimals
const tvlAmountBn = computed(() => {
    const totalStaking = useRexStore().getRexData(label)?.totalStaking;
    if (totalStaking) {
        return totalStaking;
    } else {
        return undefined;
    }
});
const evmNetworkName = computed(() => chainStore.currentEvmChain?.settings.getDisplay() ?? '');

// stakedFiatValueBn + unstakingFiatValueBn + isWithdrawableLoading
const totalFiatValueBn = computed(() => {
    const stakedFiatValue = stakedFiatValueBn.value ?? BigNumber.from(0);
    const unstakingFiatValue = unstakingFiatValueBn.value ?? BigNumber.from(0);
    const withdrawableFiatValue = withdrawableFiatValueBn.value ?? BigNumber.from(0);
    return stakedFiatValue.add(unstakingFiatValue).add(withdrawableFiatValue);
});

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
    primaryText: prettyPrintToken(unstakingFiatValueBn.value, fiatCurrency.value),
    secondaryText: isUnstakingLoading.value ? '' : prettyPrintToken(unstakingBalanceBn.value, systemToken.symbol),
    isPrimaryLoading: isUnstakingLoading.value,
    lowContrastSecondaryText: true,
    useSmallBox: true,
}, {
    label: $t('evm_stake.withdrawable_card_label'),
    tooltip: $t('evm_stake.withdrawable_card_tooltip', { stakedSymbol: stakedToken.symbol, systemSymbol: systemToken.symbol, unlockPeriod: unlockPeriod.value }),
    primaryText: prettyPrintToken(withdrawableFiatValueBn.value, fiatCurrency.value),
    secondaryText: isWithdrawableLoading.value ? '' : prettyPrintToken(withdrawableBalanceBn.value, systemToken.symbol),
    lowContrastSecondaryText: true,
    isPrimaryLoading: isWithdrawableLoading.value,
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

function prettyPrintToken(amount: BigNumber | undefined, symbol: string) {
    let decimals = symbol === fiatCurrency.value ? 2 : 4;
    if (!amount || amount.isZero()) {
        decimals = 1;
    }
    return prettyPrintCurrency(
        amount ?? BigNumber.from(0),
        decimals,
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
        <h1 class="u-text--high-contrast">{{ prettyPrintToken(totalFiatValueBn, fiatCurrency) }}</h1>
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
