<script setup lang="ts">
import { computed, onBeforeMount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { BigNumber } from 'ethers';

import {
    getAntelope,
    useAccountStore,
    useBalancesStore,
    useChainStore,
    useEVMStore,
    useUserStore,
} from 'src/antelope';

import EVMSidebarPage from 'src/layouts/EVMSidebarPage.vue';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import ConversionRateBadge from 'src/components/ConversionRateBadge.vue';
import CurrencyInput from 'src/components/evm/inputs/CurrencyInput.vue';
import { WEI_PRECISION, formatWei } from 'src/antelope/stores/utils';
import { AntelopeError } from 'src/antelope/types';

const { t: $t } = useI18n();
const ant = getAntelope();
const chainSettings = useChainStore().currentChain.settings as EVMChainSettings;
const userStore = useUserStore();
const balanceStore = useBalancesStore();
const evmStore = useEVMStore();

const systemToken = chainSettings.getSystemToken();
const systemTokenSymbol = systemToken.symbol;
const systemTokenDecimals = systemToken.decimals;
const wrappedTokenSymbol = chainSettings.getWrappedSystemToken().symbol;

// data
const oneEth = BigNumber.from('1'.concat('0'.repeat(systemTokenDecimals)));
const inputModelValue = ref(BigNumber.from(0));
const estimatedGas = ref(BigNumber.from(0));
const systemTokenFiatPrice = ref('1');

// computed
const fiatLocale = computed(() => userStore.fiatLocale);
const fiatCurrency = computed(() => userStore.fiatCurrency);
const systemTokenBalanceInfo = computed(() => balanceStore.currentBalances.filter(
    balance => balance.token.contract === systemToken.address)[0],
);
const systemTokenBalance = computed(() => systemTokenBalanceInfo.value?.amount ?? BigNumber.from(0));
const sidebarContent = computed(() => {
    const header = $t('evm_wrap.wrap_sidebar_title', { symbol: systemTokenSymbol });
    const content = [{
        text: $t(
            'evm_wrap.wrap_sidebar_content_fragment_1',
            { systemSymbol: systemTokenSymbol, wrappedSymbol: wrappedTokenSymbol },
        ),
    }, {
        text: $t('evm_wrap.wrap_sidebar_content_fragment_bold'),
        bold: true,
    }, {
        text: $t(
            'evm_wrap.wrap_sidebar_content_fragment_3',
            { systemSymbol: systemTokenSymbol, wrappedSymbol: wrappedTokenSymbol },
        ),
    }];

    return {
        header,
        content,
    };
});
const availableToWrap = computed(() => {
    const available = systemTokenBalance.value.sub(estimatedGas.value);

    if (available.lt(0)) {
        return BigNumber.from(0);
    }
    return available;
});
const formIsValid = computed(() =>
    !inputModelValue.value.isZero() &&
    inputModelValue.value.lt(availableToWrap.value),
);
const ctaIsLoading = computed(() => ant.stores.feedback.isLoading('wrapSystemToken'));


// watchers
watch(systemTokenBalanceInfo, (info) => {
    systemTokenFiatPrice.value = info.token.price.getAmountInFiatStr(1);
});


// methods
onBeforeMount(() => {
    // https://github.com/telosnetwork/telos-wallet/issues/274
    const GAS_FOR_WRAPPING_TOKEN = 55500;
    chainSettings.getEstimatedGas(GAS_FOR_WRAPPING_TOKEN).then((gas) => {
        estimatedGas.value = gas.system;
    });
});

async function handleCtaClick() {
    // eztodo move this to common function, replace in sendpage.vue
    const label = 'logged';
    if (!await useAccountStore().isConnectedToCorrectNetwork(label)) {
        const networkName = useChainStore().loggedChain.settings.getDisplay();
        const errorMessage = ant.config.localizationHandler('evm_wallet.incorrect_network', { networkName });

        ant.config.notifyFailureWithAction(errorMessage, {
            label: ant.config.localizationHandler('evm_wallet.switch'),
        });

        return;
    }

    if (formIsValid.value) {
        try {
            const authenticator = evmStore.injectedProvider(evmStore.injectedProviderNames[0]);
            const tx = await authenticator.wrapSystemToken(inputModelValue.value);
            const formattedAmount = formatWei(inputModelValue.value, systemTokenDecimals, WEI_PRECISION);

            const dismiss = ant.config.notifyNeutralMessageHandler(
                $t('notification.neutral_message_wrapping', { quantity: formattedAmount, symbol: systemTokenSymbol }),
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
            if (err instanceof AntelopeError) {
                const evmErr = err as AntelopeError;
                ant.config.notifyFailureMessage($t(evmErr.message), evmErr.payload);
            } else {
                ant.config.notifyFailureMessage($t('evm_wallet.general_error'));
            }
        }
    }
}
</script>

<template>
<EVMSidebarPage :sidebar-content="sidebarContent">
    <div class="row q-mb-xl">
        <div class="col-12">
            <div class="c-wrap-tab__badge-container">
                <ConversionRateBadge
                    :token-one-symbol="wrappedTokenSymbol"
                    :token-two-symbol="systemTokenSymbol"
                    :token-two-decimals="systemTokenDecimals"
                    :token-two-amount="oneEth"
                />
            </div>
        </div>
    </div>

    <div class="row q-mb-lg">
        <div class="col-12">
            <CurrencyInput
                v-model="inputModelValue"
                :symbol="systemTokenSymbol"
                :decimals="systemTokenDecimals"
                :secondary-currency-code="fiatCurrency"
                :secondary-currency-decimals="2"
                :secondary-currency-conversion-factor="systemTokenFiatPrice"
                :locale="fiatLocale"
                :label="$t('evm_wrap.wrap_input_label')"
                :max-value="availableToWrap"
                class="c-wrap-tab__input"
            />
        </div>
    </div>

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

    <div class="row q-mb-lg">
        <div class="col-12">
            <CurrencyInput
                v-model="inputModelValue"
                :symbol="wrappedTokenSymbol"
                :decimals="systemTokenDecimals"
                :locale="fiatLocale"
                :label="$t('evm_wrap.wrap_input_label')"
                class="c-wrap-tab__input"
                readonly="readonly"
            />
        </div>
    </div>

    <div class="row">
        <div class="col-12">
            <div class="c-wrap-tab__cta-container">
                <q-btn
                    color="primary"
                    :disable="!formIsValid"
                    :loading="ctaIsLoading"
                    :label="$t('evm_wrap.wrap')"
                    :aria-label="$t(
                        'evm_wrap.wrap_button_label',
                        { systemSymbol: systemTokenSymbol, wrappedSymbol: wrappedTokenSymbol },
                    )"
                    @click="handleCtaClick"
                />
            </div>
        </div>
    </div>
</EVMSidebarPage>
</template>

<style lang="scss">
.c-wrap-tab {
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
