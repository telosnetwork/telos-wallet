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

import WithdrawRaw from 'src/pages/evm/staking/WithdrawRaw.vue';
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

const loading = ref(false);
const allWithdrawals = ref([{} as any]);
const withdrawEnabled = ref(false);

const withdraw = () => {
    if (!withdrawEnabled.value) {
        return;
    }
    console.log('you pressed withdraw');
};


</script>

<template>
<div class="c-withdraw-tab">
    <div class="c-withdraw-tab__withdraw-btn">
        <q-btn
            :label="$t(withdrawEnabled ? 'evm_stake.withdraw_button_enabled' : 'evm_stake.withdraw_button_disabled', {
                amount: formatWei(1000000000000000, systemTokenDecimals, uiDecimals),
                symbol: systemTokenSymbol
            })"
            :disable="!withdrawEnabled"
            color="primary"
            @click="withdraw"
        />
    </div>

    <div class="c-withdraw-tab__row">
        <WithdrawRaw
            v-for="(withdrawal, index) in allWithdrawals"
            :key="`withdrawal-${index}`"
            :withdrawal="withdrawal"
            class="q-mb-xs"
        />
    </div>
    <div
        :class="{
            'c-withdraw-tab__loading': true,
            'c-withdraw-tab__loading--hide': !loading
        }"
    >
        <q-spinner-dots
            color="primary"
            size="2em"
        />
    </div>

</div>
</template>

<style lang="scss">
.c-withdraw-tab {
    &__row {
        max-width: 800px;
        margin: auto;
    }
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
    &__loading {
        opacity: 1;
        text-align: center;
        margin-top: 20px;
        transition: opacity 0.4s linear 0.8s;
        &--hide {
            opacity: 0;
        }
    }
    &__withdraw-btn {
        text-align: center;
        margin-bottom: 20px;
    }
}
</style>
