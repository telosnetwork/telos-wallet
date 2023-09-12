<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue';
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
import { WEI_PRECISION, formatWei } from 'src/antelope/stores/utils';

const label = 'current';

const { t: $t } = useI18n();
const uiDecimals = 2;
const ant = getAntelope();
const chainStore = useChainStore();
const chainSettings = chainStore.currentChain.settings as EVMChainSettings;
const userStore = useUserStore();
const balanceStore = useBalancesStore();
const accountStore = useAccountStore();

const systemToken = chainSettings.getSystemToken();
const systemTokenSymbol = systemToken.symbol;
const systemTokenDecimals = systemToken.decimals;
const stakedToken = chainSettings.getStakedSystemToken();
const stakedTokenSymbol = stakedToken.symbol;
const stakedTokenDecimals = stakedToken.decimals;

</script>

<template>
<div class="c-withdraw-tab">
    withdraw
</div>
</template>

<style lang="scss">
.c-withdraw-tab {
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
