<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { CURRENT_CONTEXT, getAntelope, useAccountStore, useBalancesStore, useChainStore, useUserStore } from 'src/antelope';

import ConversionRateBadge from 'src/components/ConversionRateBadge.vue';
import CurrencyInput from 'src/components/evm/inputs/CurrencyInput.vue';
import EVMSidebarPage from 'src/layouts/EVMSidebarPage.vue';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { ethers } from 'ethers';
import { WEI_PRECISION, formatWei } from 'src/antelope/stores/utils';

const { t: $t } = useI18n();
const ant = getAntelope();
const chainSettings = useChainStore().currentChain.settings as EVMChainSettings;
const userStore = useUserStore();
const balanceStore = useBalancesStore();
const accountStore = useAccountStore();

const systemToken = chainSettings.getSystemToken();
const systemTokenSymbol = systemToken.symbol;
const systemTokenDecimals = systemToken.decimals;
const uiDecimals = 2;
const wrappedTokenSymbol = chainSettings.getWrappedSystemToken().symbol;

// data
const oneEth = ethers.BigNumber.from('1'.concat('0'.repeat(systemTokenDecimals)));
const inputModelValue = ref(ethers.constants.Zero);
const estimatedGas = ref(ethers.constants.Zero);

// computed
const fiatLocale = computed(() => userStore.fiatLocale);
const fiatCurrency = computed(() => userStore.fiatCurrency);
const systemTokenBalanceInfo = computed(() => balanceStore.currentBalances.filter(
    balance => balance.token.contract === systemToken.address)[0],
);
const systemTokenFiatPrice = computed(() => systemTokenBalanceInfo.value?.token.price.getAmountInFiatStr(1) ?? '1');

const sidebarContent = computed(() => {
    const header = $t('evm_wrap.unwrap_sidebar_title', { symbol: systemTokenSymbol });
    const content = [{
        text: $t(
            'evm_wrap.unwrap_sidebar',
            { wrappedSymbol: wrappedTokenSymbol, systemSymbol: systemTokenSymbol },
        ),
    }];

    return {
        header,
        content,
    };
});

const wrappedTokenBalanceInfo = computed(() => balanceStore.currentBalances.filter(
    balance => balance.token.contract === chainSettings.getWrappedSystemToken().address,
)[0]);
const wrappedTokenBalance = computed(() => wrappedTokenBalanceInfo.value?.amount ?? ethers.constants.Zero);
const availableToUnwrap = computed(() => wrappedTokenBalance.value);
const formIsValid = computed(() =>
    !inputModelValue.value.isZero() &&
    inputModelValue.value.lte(availableToUnwrap.value),
);

const ctaIsLoading = computed(() => ant.stores.feedback.isLoading('unwrapSystemTokens'));

// methods
onBeforeMount(() => {
    // https://github.com/telosnetwork/telos-wallet/issues/274
    const GAS_FOR_WRAPPING_TOKEN = 55500;
    chainSettings.getEstimatedGas(GAS_FOR_WRAPPING_TOKEN).then((gas) => {
        estimatedGas.value = gas.system;
    });
});

async function handleUnwrapClick() {
    const label = CURRENT_CONTEXT;
    if (!await useAccountStore().assertNetworkConnection(label)) {
        return;
    }

    if (formIsValid.value) {
        try {
            const tx = await useBalancesStore().unwrapSystemTokens(inputModelValue.value);
            const formattedAmount = formatWei(inputModelValue.value, systemTokenDecimals, WEI_PRECISION);

            const dismiss = ant.config.notifyNeutralMessageHandler(
                $t('notification.neutral_message_unwrapping', { quantity: formattedAmount, symbol: wrappedTokenSymbol }),
            );

            tx.wait().then(() => {
                ant.config.notifySuccessfulTrxHandler(
                    `${chainSettings.getExplorerUrl()}/tx/${tx.hash}`,
                );
            }).catch((err: any) => {
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

    <!-- convert ratio 1:1 -->
    <div class="row q-mb-xl">
        <div class="col-12">
            <div class="c-unwrap-tab__badge-container">
                <ConversionRateBadge
                    :token-one-symbol="wrappedTokenSymbol"
                    :token-two-symbol="systemTokenSymbol"
                    :token-two-decimals="systemTokenDecimals"
                    :token-two-amount="oneEth"
                    :decimals="0"
                />
            </div>
        </div>
    </div>

    <!-- WTLOS input -->
    <div class="row q-mb-lg">
        <div class="col-12">
            <CurrencyInput
                v-model="inputModelValue"
                :symbol="wrappedTokenSymbol"
                :decimals="systemTokenDecimals"
                :decimals-to-display="uiDecimals"
                :secondary-currency-code="fiatCurrency"
                :secondary-currency-decimals="2"
                :secondary-currency-conversion-factor="systemTokenFiatPrice"
                :locale="fiatLocale"
                :label="$t('evm_wrap.unwrap_input_label')"
                :max-value="availableToUnwrap"
                class="c-unwrap-tab__input"
                name="unwrap-tab-currency-input-1"
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
                v-model="inputModelValue"
                :symbol="systemTokenSymbol"
                :decimals="systemTokenDecimals"
                :locale="fiatLocale"
                :label="$t('evm_wrap.unwrap_input_label')"
                class="c-unwrap-tab__input"
                readonly="readonly"
                name="unwrap-tab-currency-input-2"
            />
        </div>
    </div>

    <!-- Unwrap button -->
    <div class="row">
        <div class="col-12">
            <div class="c-unwrap-tab__cta-container">
                <q-btn
                    color="primary"
                    :disable="availableToUnwrap.isZero() || !formIsValid"
                    :loading="ctaIsLoading"
                    :label="$t('evm_wrap.unwrap')"
                    :aria-label="$t(
                        'evm_wrap.unwrap_button_label',
                        { wrappedSymbol: wrappedTokenSymbol, systemSymbol: systemTokenSymbol },
                    )"
                    @click="handleUnwrapClick"
                />
            </div>
        </div>
    </div>
</EVMSidebarPage>
</template>

<style lang="scss">
.c-unwrap-tab {
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
}
</style>

