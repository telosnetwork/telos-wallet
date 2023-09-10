<script lang="ts">
import { defineComponent, PropType } from 'vue';

import InlineSvg from 'vue-inline-svg';

import { useChainStore, useEVMStore, useUserStore } from 'src/antelope';

import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { EvmRexDeposit } from 'src/antelope/types';
import ToolTip from 'components/ToolTip.vue';
import { prettyPrintCurrency, promptAddToMetamask } from 'src/antelope/stores/utils/currency-utils';
import ExternalLink from 'components/ExternalLink.vue';

const evmStore = useEVMStore();
const userStore = useUserStore();
const { fiatLocale, fiatCurrency } = userStore;

export default defineComponent({
    name: 'WalletBalanceRow',
    components: {
        ExternalLink,
        InlineSvg,
    },
    data() {
        return {
            iconSrc: 'src/assets/icon--calendar-clock.svg',
            iconAlt: '',
            withdrawalStatus: 'Unstaking for 2 days 3 hours',
            withdrawalDate: 'Withdraw it on Feb 12, 2023 09:32 AM',
            externalHash: '0x3db63fd9fc379161f2e2f6381153b2a77923f8b65dd04723dd4ab6b8ef3fbc06',
            externalUrl: 'https://teloscan.io/tx/0x3db63fd9fc379161f2e2f6381153b2a77923f8b65dd04723dd4ab6b8ef3fbc06',
            externalPurpose: 'View on Teloscan',
        };
    },
    props: {
        withdrawal: {
            type: Object as PropType<EvmRexDeposit>,
            required: true,
        },
    },
    computed: {
    },
    methods: {
    },
});
</script>

<template>
<div class="c-stake-withdrawal-row">
    <div class="c-stake-withdrawal-row__left-container">
        <div class="c-stake-withdrawal-row__left-icon">
            <InlineSvg
                :src="require('src/assets/icon--calendar-clock.svg')"
                :alt="$t(iconAlt)"
                class="c-stake-withdrawal-row__icon"
                height="24"
                width="24"
                aria-hidden="true"
            />
        </div>
        <div class="c-stake-withdrawal-row__left-content">
            <div>
                <span class="c-stake-withdrawal-row__withdrawal-status">{{ withdrawalStatus }}</span>
            </div>
            <div>
                <span class="o-text--small q-mr-md">{{ withdrawalDate }}</span>
                <ExternalLink :text="externalHash" :url="externalUrl" :purpose="externalPurpose" />
            </div>
        </div>
    </div>

    <div class="c-stake-withdrawal-row__right-container">
    </div>
</div>
</template>

<style lang="scss">
.c-stake-withdrawal-row {
    $this: &;

    display: flex;
    justify-content: space-between;
    border-radius: 4px;
    border-bottom: 2px solid var(--header-bg-color);
    padding: 24px 4px;
    overflow-x: hidden;
    max-width: 100%;
    min-width: 0;

    &__left-container,
    &__right-container {
        display: flex;
        width: max-content;
    }

    &__left-container {
        @include text--paragraph;
        color: var(--text-default-contrast);
        display: flex;
        align-items: flex-start;
        gap: 6px;

        white-space: nowrap;
    }

    &__withdrawal-status {
        @include text--paragraph-bold;
    }

    &__left-content {
        display: flex;
        flex-direction: column;
    }
}


</style>
