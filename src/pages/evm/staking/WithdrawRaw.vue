<script lang="ts">
import { defineComponent, PropType } from 'vue';

import InlineSvg from 'vue-inline-svg';

import { CURRENT_CONTEXT, useChainStore, useEVMStore, useUserStore } from 'src/antelope';

import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { EvmRexDeposit } from 'src/antelope/types';
import ToolTip from 'components/ToolTip.vue';
import TimeStamp from 'components/TimeStamp.vue';
import { prettyPrintCurrency, promptAddToMetamask } from 'src/antelope/stores/utils/currency-utils';
import ExternalLink from 'components/ExternalLink.vue';
import { ethers } from 'ethers';
import { getLongDate } from 'src/antelope/stores/utils';

const evmStore = useEVMStore();
const userStore = useUserStore();
const chainStore = useChainStore();
const { fiatLocale, fiatCurrency } = userStore;

export default defineComponent({
    name: 'WalletBalanceRow',
    components: {
        InlineSvg,
        ToolTip,
        // TimeStamp, // TODO: fix this
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
        epoch() {
            return this.withdrawal.until.toNumber();
        },
        longDate(): string {
            return getLongDate(this.epoch);
        },
        isWithdrawable(): boolean {
            return this.epoch <= Date.now() / 1000;
        },
        token() {
            const settings = chainStore.getChain(CURRENT_CONTEXT).settings as EVMChainSettings;
            const token = settings.getSystemToken();
            return token;
        },
        tokenBalanceFiat(): number | null {
            return this.token.price.isAvailable ? +this.token.price.getAmountInFiatStr(this.withdrawal.amount) : null;
        },
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
            return this.tokenBalanceFiat as number;
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
            let amount = '0';
            const amountBn = this.withdrawal.amount;
            amount = ethers.utils.formatUnits(amountBn, this.token.decimals);
            return amount;
        },
        prettySecondaryAmount(): string {
            const noSecondaryAmount = typeof this.secondaryAmount === 'string' && !this.secondaryAmount;
            if (noSecondaryAmount) {
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
        formatTooltipBalance(amount: number, isFiat: boolean): string {
            const decimals = isFiat ? 2 : 4;
            const symbol = isFiat ? fiatCurrency : this.token.symbol;

            return `${prettyPrintCurrency(amount, decimals, fiatLocale)} ${symbol}`;
        },
    },
});
</script>

<template>
<div class="c-stake-withdrawal-row">
    <div class="c-stake-withdrawal-row__left-container">
        <div class="c-stake-withdrawal-row__left-icon">
            <InlineSvg
                :src="require(`src/assets/icon--calendar-${isWithdrawable?'check':'clock'}.svg`)"
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
                <span class="o-text--small q-mr-md">Withdraw it on Feb 12, 2023 09:32 AM</span>
                <!--ToolTip :text="longDate" :hide-icon="true">
                    <TimeStamp :timestamp="epoch" />
                </ToolTip-->
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

    &__balance-container {
        display: flex;
        align-items: flex-end;
        justify-content: center;
        gap: 8px;

        flex-direction: column;
        flex-shrink: 1;
        text-align: right;
        min-width: 0;
    }

    &__primary-amount,
    &__secondary-amount {
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
    }

    &__primary-amount {
        @include text--header-4;
        color: var(--text-high-contrast);
        display: flex;
        align-items: center;
        flex: 1 1 max-content;
        text-align: right;
    }

    &__secondary-amount {
        @include text--small;
        color: var(--text-default-contrast);
    }
}


</style>
