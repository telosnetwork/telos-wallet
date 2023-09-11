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
        truncatePrimaryValue(): boolean {
            const isMobile = this.$q.screen.lt.sm;

            if (!isMobile) {
                return false;
            } else {
                return this.primaryAmount.toString().length > 8;
            }
        },
        truncateSecondaryValue(): boolean {
            const isMobile = this.$q.screen.lt.sm;

            if (!isMobile) {
                return false;
            } else {
                return this.secondaryAmount.toString().length > 7;
            }
        },
        primaryAmount(): number | string {
            // the top value is fiat if there is a fiat value for the token
            // the top (only) value is the token balance iff token has no reliable fiat value.
            return '100';
        },
        prettyPrimaryAmount(): string {
            return prettyPrintCurrency(
                +this.primaryAmount,
                2,
                fiatLocale,
                this.truncatePrimaryValue,
                fiatCurrency,
                false,
            );
        },
        secondaryAmount(): number | string {
            return '300';
        },
        prettySecondaryAmount(): string {
            const noSecondaryAmount = typeof this.secondaryAmount === 'string' && !this.secondaryAmount;
            if (noSecondaryAmount || !this.tokenHasFiatValue) {
                return '';
            }

            if (this.truncateSecondaryValue) {
                return prettyPrintCurrency(+this.secondaryAmount, 4, fiatLocale, true).concat(` ${this.token.symbol}`);
            } else {
                const formatted = prettyPrintCurrency(+this.secondaryAmount, 4, fiatLocale);

                return `${formatted} ${this.token.symbol}`;
            }
        },
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
        <div ref="balance-container" class="c-stake-withdrawal-row__balance-container">
            <div class="c-stake-withdrawal-row__primary-amount">
                {{ prettyPrimaryAmount }}
            </div>
            <span v-if="secondaryAmount !== ''" class="c-stake-withdrawal-row__secondary-amount">
                <ToolTip
                    v-if="truncateSecondaryValue"
                    :text="formatTooltipBalance(+secondaryAmount, !$q.screen.lt.sm)"
                    :hide-icon="true"
                >
                    {{ prettySecondaryAmount }}
                </ToolTip>
                <template v-else>
                    {{ prettySecondaryAmount }}
                </template>
            </span>
        </div>

        <q-btn
            flat
            dense
            no-icon-animation
            icon="more_vert"
            class="c-stake-withdrawal-row__overflow"
            :aria-label="$t('evm_wallet.balance_row_actions_aria')"
        >
            <q-menu anchor="bottom end" self="top right" :offset="[0, 16]">
                <ul class="c-stake-withdrawal-row__overflow-ul">
                    <li
                        v-for="(item, index) in overflowMenuItems"
                        :key="`overflow-item-${index}`"
                        v-close-popup
                        class="c-stake-withdrawal-row__overflow-li"
                        tabindex="0"
                        :aria-labelledby="`overflow-text-${index}`"
                        @click="item.url ? goToLink(item.url) : promptAddToMetamask()"
                        @keydown.enter.space="item.url ? goToLink(item.url) : promptAddToMetamask()"
                    >
                        <div class="c-stake-withdrawal-row__overflow-icon-wrapper">
                            <InlineSvg
                                :src="item.icon"
                                :class="{
                                    'c-stake-withdrawal-row__overflow-icon': true,
                                    'c-stake-withdrawal-row__overflow-icon--stroke': item.strokeIcon,
                                }"
                                aria-hidden="true"
                            />
                        </div>

                        <span :id="`overflow-text-${index}`" class="c-stake-withdrawal-row__overflow-text">
                            {{ item.label }}
                        </span>
                    </li>
                </ul>
            </q-menu>
        </q-btn>
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
