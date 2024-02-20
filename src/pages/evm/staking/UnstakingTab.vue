<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ethers } from 'ethers';

import {
    CURRENT_CONTEXT,
    getAntelope,
    useAccountStore,
    useBalancesStore,
    useChainStore,
    useRexStore,
    useUserStore,
} from 'src/antelope';

import EVMSidebarPage from 'src/layouts/EVMSidebarPage.vue';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import ConversionRateBadge from 'src/components/ConversionRateBadge.vue';
import CurrencyInput from 'src/components/evm/inputs/CurrencyInput.vue';
import { formatWei } from 'src/antelope/stores/utils';

const { t: $t } = useI18n();
const uiDecimals = 2;
const ant = getAntelope();
const chainStore = useChainStore();
const chainSettings = chainStore.currentChain.settings as EVMChainSettings;
const userStore = useUserStore();
const balanceStore = useBalancesStore();
const accountStore = useAccountStore();
const rexStore = useRexStore();

const systemToken = chainSettings.getSystemToken();
const systemTokenSymbol = systemToken.symbol;
const systemTokenDecimals = systemToken.decimals;
const stakedToken = chainSettings.getStakedSystemToken();
const stakedTokenSymbol = stakedToken.symbol;
const stakedTokenDecimals = stakedToken.decimals;


// data
const oneEth = ethers.BigNumber.from('1'.concat('0'.repeat(systemTokenDecimals)));
const inputModelValue = ref(ethers.constants.Zero);

// computed
const unstakedRatio = computed(() => chainStore.getUnstakedRatio(CURRENT_CONTEXT));
const outputModelValue = computed(() => {
    if (unstakedRatio.value.isZero()) {
        return ethers.constants.Zero;
    }
    const output = inputModelValue.value.mul(unstakedRatio.value).div(oneEth);
    return output;
});

const fiatLocale = computed(() => userStore.fiatLocale);
const fiatCurrency = computed(() => userStore.fiatCurrency);
const systemTokenBalanceInfo = computed(() => balanceStore.currentBalances.filter(
    balance => balance.token.contract === systemToken.address)[0],
);
const systemTokenFiatPrice = computed(() => systemTokenBalanceInfo.value?.token.price.getAmountInFiatStr(1) ?? '1');
const stakedTokenBalanceInfo = computed(() => balanceStore.currentBalances.filter(
    balance => balance.token.contract === stakedToken.address)[0],
);
const stakedTokenBalance = computed(() => stakedTokenBalanceInfo.value?.amount ?? ethers.constants.Zero);
const sidebarContent = computed(() => {
    const header = $t('evm_stake.unstake_sidebar_title', { symbol: systemTokenSymbol });
    const content = [{
        text: $t(
            'evm_stake.unstake_sidebar_content_fragment_1',
            { systemSymbol: systemTokenSymbol },
        ),
    }, {
        text: $t('evm_stake.unstake_sidebar_content_fragment_2_bold', {
            period: rexStore.getUnstakingPeriodString(CURRENT_CONTEXT),
        }),
        bold: true,
    }, {
        text: $t(
            'evm_stake.unstake_sidebar_content_fragment_3',
            { systemSymbol: systemTokenSymbol, stakedSymbol: stakedTokenSymbol },
        ),
    }];
    return {
        header,
        content,
    };
});
const availableToUnstake = computed(() => stakedTokenBalance.value);

const formIsValid = computed(() =>
    !ctaIsLoading.value &&
    !outputModelValue.value.isZero() &&
    inputModelValue.value.gt(0) &&
    inputModelValue.value.lte(availableToUnstake.value),
);
const ctaIsLoading = computed(() => ant.stores.feedback.isLoading('unstakeEVMSystemTokens'));

async function handleCtaClick() {
    const label = CURRENT_CONTEXT;
    if (!await useAccountStore().assertNetworkConnection(label)) {
        return;
    }

    if (formIsValid.value) {
        try {
            const displayDecimals = 4;
            const tx = await useRexStore().unstakeEVMSystemTokens(label, outputModelValue.value);
            const formattedAmount = formatWei(outputModelValue.value, systemTokenDecimals, displayDecimals);

            const dismiss = ant.config.notifyNeutralMessageHandler(
                $t('notification.neutral_message_unstaking', { quantity: formattedAmount, symbol: systemTokenSymbol }),
            );

            tx.wait().then(() => {
                ant.config.notifySuccessfulTrxHandler(
                    `${chainSettings.getExplorerUrl()}/tx/${tx.hash}`,
                );
            }).catch((err) => {
                console.error(err);
            }).finally(() => {
                dismiss();
            });
        } catch (err) {
            console.error(err);
        }
    }
}
</script>

<template>
<EVMSidebarPage :sidebar-content="sidebarContent">

    <!-- convert ratio 1:stakedRatio -->
    <div class="row q-mb-xl">
        <div class="col-12">
            <div class="c-unstake-tab__badge-container">
                <ConversionRateBadge
                    :token-one-symbol="stakedTokenSymbol"
                    :token-two-symbol="systemTokenSymbol"
                    :token-two-decimals="stakedTokenDecimals"
                    :token-two-amount="unstakedRatio"
                    :decimals="uiDecimals"
                />
            </div>
        </div>
    </div>

    <!-- STLOS input -->
    <div class="row q-mb-lg">
        <div class="col-12">
            <CurrencyInput
                v-model="inputModelValue"
                :symbol="stakedTokenSymbol"
                :decimals="stakedTokenDecimals"
                :decimals-to-display="uiDecimals"
                :locale="fiatLocale"
                :label="$t('evm_stake.unstake_input_label')"
                :max-value="availableToUnstake"
                class="c-unstake-tab__input"
                name="unstaking-tab-currency-input-1"
            />
        </div>
    </div>

    <!-- arrow -->
    <div class="row q-mb-sm">
        <div class="col-12 text-center">
            <img
                src="~assets/icon--arrow-down.svg"
                :alt="$t('global.arrow_icon_alt')"
                height="20"
                width="18"
            >
        </div>
    </div>

    <!-- output field (readonly) -->
    <div class="row q-mb-lg">
        <div class="col-12">
            <CurrencyInput
                :model-value="outputModelValue"
                :symbol="systemTokenSymbol"
                :decimals="systemTokenDecimals"
                :decimals-to-display="uiDecimals"
                :secondary-currency-code="fiatCurrency"
                :secondary-currency-decimals="2"
                :secondary-currency-conversion-factor="systemTokenFiatPrice"
                :locale="fiatLocale"
                :label="$t('evm_stake.unstake_output_label')"
                class="c-unstake-tab__input"
                readonly="readonly"
                name="unstaking-tab-currency-input-2"
            />
        </div>
    </div>

    <!-- unstake button -->
    <div class="row">
        <div class="col-12">
            <div class="c-unstake-tab__cta-container">
                <q-btn
                    color="primary"
                    :disable="!formIsValid"
                    :loading="ctaIsLoading"
                    :label="$t('evm_stake.unstake')"
                    :aria-label="$t(
                        'evm_stake.unstake_button_label',
                        { systemSymbol: systemTokenSymbol, stakedSymbol: stakedTokenSymbol },
                    )"
                    @click="handleCtaClick"
                />
            </div>
        </div>
    </div>
</EVMSidebarPage>
</template>

<style lang="scss">
.c-unstake-tab {
    &__badge-container,
    &__cta-container,
    &__input {
        max-width: 320px;
        margin: auto;
    }

    &__badge-container,
    &__cta-container {
        display: flex;
        justify-content: flex-end;
    }
    &__cta-container {
        margin-top: 8px;
    }
}
</style>
