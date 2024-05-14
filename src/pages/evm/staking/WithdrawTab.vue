<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ethers } from 'ethers';

import {
    CURRENT_CONTEXT,
    getAntelope,
    useAccountStore,
    useChainStore,
    useFeedbackStore,
    useRexStore,
} from 'src/antelope';

import WithdrawRaw from 'src/pages/evm/staking/WithdrawRaw.vue';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { formatWei } from 'src/antelope/stores/utils';


const { t: $t } = useI18n();
const uiDecimals = 2;
const ant = getAntelope();
const chainStore = useChainStore();
const chainSettings = chainStore.currentChain.settings as EVMChainSettings;
const accountStore = useAccountStore();
const rexStore = useRexStore();
const feed = useFeedbackStore();
const waitingForResult = ref(false);

const systemToken = chainSettings.getSystemToken();
const systemTokenSymbol = systemToken.symbol;
const systemTokenDecimals = systemToken.decimals;

const loading = computed(() => feed.isLoading('withdrawEVMSystemTokens'));
const allWithdrawals = computed(() => rexStore.getEvmRexData(CURRENT_CONTEXT)?.deposits ?? []);

// prettyPrintToken(unstakingBalanceBn.value, systemToken.symbol)
const withdrawableBalanceBn = computed(() => useRexStore().getRexData(CURRENT_CONTEXT)?.withdrawable ?? ethers.constants.Zero);

// enable only if withdrawableBalanceBn > 0 and not loading
const withdrawEnabled = computed(() => !waitingForResult.value && withdrawableBalanceBn.value.gt(ethers.constants.Zero) && !loading.value);

// hadle withdraw button click
const handleWithdrawClick = async () => {
    if (!withdrawEnabled.value || loading.value) {
        return;
    }
    const label = CURRENT_CONTEXT;
    if (!await useAccountStore().assertNetworkConnection(label)) {
        return;
    }

    try {
        waitingForResult.value = true;
        const tx = await useRexStore().withdrawEVMSystemTokens(CURRENT_CONTEXT, withdrawableBalanceBn.value);
        const formattedAmount = formatWei(withdrawableBalanceBn.value, systemTokenDecimals, 4);

        const dismiss = ant.config.notifyNeutralMessageHandler(
            $t('notification.neutral_message_withdrawing', { quantity: formattedAmount, symbol: systemTokenSymbol }),
        );

        tx.wait().then(() => {
            ant.config.notifySuccessfulTrxHandler(
                `${chainSettings.getExplorerUrl()}/tx/${tx.hash}`,
            );
            waitingForResult.value = false;
        }).catch((err) => {
            console.error(err);
        }).finally(() => {
            dismiss();
        });
    } catch (err) {
        console.error(err);
    }
};

// handler of update-rex-data event
const updateRexData = () => {
    useRexStore().updateRexData(CURRENT_CONTEXT);
};

// we call to update the data
updateRexData();

</script>

<template>
<div class="c-withdraw-tab">
    <div class="c-withdraw-tab__withdraw-btn">
        <q-btn
            :label="$t(withdrawEnabled ? 'evm_stake.withdraw_button_enabled' : 'evm_stake.withdraw_button_disabled', {
                amount: formatWei(withdrawableBalanceBn, systemTokenDecimals, uiDecimals),
                symbol: systemTokenSymbol
            })"
            :disable="!withdrawEnabled"
            :loading="loading"
            color="primary"
            @click="handleWithdrawClick"
        />
    </div>

    <div class="c-withdraw-tab__row">
        <WithdrawRaw
            v-for="(withdrawal, index) in allWithdrawals"
            :key="`withdrawal-${index}`"
            :withdrawal="withdrawal"
            class="q-mb-xs"
            @update-rex-data="updateRexData"
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
