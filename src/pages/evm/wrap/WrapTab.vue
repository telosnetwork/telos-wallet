<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { useBalancesStore, useChainStore, useUserStore } from 'src/antelope';

import { BigNumber } from 'ethers';

import EVMSidebarPage from 'src/layouts/EVMSidebarPage.vue';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import ConversionRateBadge from 'src/components/ConversionRateBadge.vue';
import CurrencyInput from 'src/components/evm/inputs/CurrencyInput.vue';

const { t: $t } = useI18n();
const chainSettings = useChainStore().currentChain.settings as EVMChainSettings;
const userStore = useUserStore();
const balanceStore = useBalancesStore();

const systemToken = chainSettings.getSystemToken();
const systemTokenSymbol = systemToken.symbol;
const systemTokenDecimals = systemToken.decimals;
const wrappedTokenSymbol = chainSettings.getWrappedSystemToken().symbol;

// data
const oneEth = BigNumber.from('1'.concat('0'.repeat(systemTokenDecimals)));
const inputModelValue = ref(BigNumber.from(0));

// eztodo available doe snot match currency input available

// computed
const fiatLocale = computed(() => userStore.fiatLocale);
const fiatCurrency = computed(() => userStore.fiatCurrency);
const systemTokenBalanceInfo = computed(() => balanceStore.currentBalances.filter(
    balance => balance.token.address === systemToken.address)[0],
);
const systemTokenBalance = computed(() => systemTokenBalanceInfo.value?.amount ?? BigNumber.from(0));
const systemTokenFiatPrice = computed(() => systemTokenBalanceInfo.value?.token.price.getAmountInFiatStr(1));
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


// methods
function handleCtaClick() {
    console.log('wrap');
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
                :max-value="systemTokenBalance"
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
        <div class="col-12 text-right">
            <q-btn
                color="primary"
                :label="$t('evm_wrap.wrap')"
                :aria-label="$t(
                    'evm_wrap.wrap_button_label',
                    { systemSymbol: systemTokenSymbol, wrappedSymbol: wrappedTokenSymbol },
                )"
                @click="handleCtaClick"
            />
        </div>
    </div>
</EVMSidebarPage>
</template>

<style lang="scss">
.c-wrap-tab {
    &__badge-container {
        display: flex;
        justify-content: flex-end;
        max-width: 320px;
        margin: auto;
    }

    &__input {
        max-width: 320px;
        margin: 0 auto;
    }
}
</style>
