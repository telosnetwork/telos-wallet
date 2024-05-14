<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { ethers } from 'ethers';

import InlineSvg from 'vue-inline-svg';

import { CURRENT_CONTEXT, useChainStore, useUserStore } from 'src/antelope';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { EvmRexDeposit } from 'src/antelope/types';
import { prettyPrintCurrency } from 'src/antelope/stores/utils/currency-utils';
import { DEFAULT_DATE_FORMAT, getFormattedDate } from 'src/antelope/stores/utils/date-utils';

import ToolTip from 'components/ToolTip.vue';

const userStore = useUserStore();
const chainStore = useChainStore();
const { fiatLocale, fiatCurrency } = userStore;

export default defineComponent({
    name: 'WalletBalanceRow',
    components: {
        InlineSvg,
        ToolTip,
    },
    emits: ['update-rex-data'],
    data() {
        return {
            now: Date.now(),
            pendingTime: '',
            timer: setTimeout(() => {}, 0),
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
            return getFormattedDate(this.epoch, DEFAULT_DATE_FORMAT, false);
        },
        isWithdrawable(): boolean {
            return this.epoch <= this.now / 1000;
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
        updatePendingTime() {
            this.now = Date.now();
            const w_days = this.$t('antelope.words.days');
            const w_hours = this.$t('antelope.words.hours');
            const w_minutes = this.$t('antelope.words.minutes');
            const w_seconds = this.$t('antelope.words.seconds');

            const seconds = this.epoch - this.now / 1000;
            const days = Math.floor(seconds / 86400);
            const hours = Math.floor((seconds % 86400) / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secondsLeft = Math.floor(seconds % 60);

            const daysStr = days > 0 ? `${days} ${w_days} ` : '';
            const hoursStr = hours > 0 ? `${hours} ${w_hours} ` : '';
            const minutesStr = (!days && minutes > 0) ? `${minutes} ${w_minutes} ` : '';
            const secondsStr = (!days && !hours && secondsLeft > 0) ? `${secondsLeft} ${w_seconds} ` : '';

            this.pendingTime = `${daysStr}${hoursStr}${minutesStr}${secondsStr}`;
        },
        formatTooltipBalance(amount: number, isFiat: boolean): string {
            const decimals = isFiat ? 2 : 4;
            const symbol = isFiat ? fiatCurrency : this.token.symbol;

            return `${prettyPrintCurrency(amount, decimals, fiatLocale)} ${symbol}`;
        },
        enterSecondUpdatedinterval() {
            clearInterval(this.timer);
            this.timer = setInterval(() => {
                this.updatePendingTime();
                if (this.isWithdrawable) {
                    this.$emit('update-rex-data');
                    clearInterval(this.timer);
                }
            }, 1000);
        },
        scheduleMinuteUpdatePendingTime() {
            const word_seconds = this.$t('antelope.words.seconds');
            this.updatePendingTime();
            if (this.pendingTime.includes(word_seconds)) {
                this.enterSecondUpdatedinterval();
                return;
            } else {
                setTimeout(() => {
                    this.updatePendingTime();
                    this.scheduleMinuteUpdatePendingTime();
                }, 60000);
            }
        },
    },
    mounted() {
        this.scheduleMinuteUpdatePendingTime();
    },
    beforeUnmount() {
        clearInterval(this.timer);
    },
    watch: {
        withdrawal: {
            handler() {
                this.scheduleMinuteUpdatePendingTime();
            },
            deep: true,
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
                class="c-stake-withdrawal-row__icon"
                height="24"
                width="24"
                aria-hidden="true"
            />
        </div>
    </div>
    <div class="c-stake-withdrawal-row__middle-container">
        <div class="c-stake-withdrawal-row__left-content">
            <div>
                <span class="c-stake-withdrawal-row__withdrawal-status">
                    <template v-if="isWithdrawable">
                        {{ $t('evm_stake.withdrawal_available') }}
                    </template>
                    <template v-else-if="pendingTime !== ''">
                        {{ $t('evm_stake.unstaking_pending_time', { time: pendingTime }) }}
                    </template>
                    <template v-else>
                        {{ $t('evm_stake.withdrawal_updatng') }}
                    </template>
                </span>
            </div>
            <div>
                <span class="o-text--small q-mr-md">
                    {{ isWithdrawable ? longDate : $t('evm_stake.withdrawal_date', { date: longDate }) }}
                </span>
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

    border-radius: 4px;
    border-bottom: 2px solid var(--header-bg-color);
    padding: 24px 4px;
    overflow-x: hidden;
    max-width: 100%;
    min-width: 0;

    display: grid;
    gap: 16px 8px;
    justify-items: start;
    grid-template-columns: auto 1fr;
    grid-template-areas:
        'a b'
        'a c';

    @include sm-and-up {
        grid-template-areas: 'a b c';
        grid-template-columns: auto 1fr auto;
        &__right-container {
            justify-self: end;
        }
    }

    &__icon {
        path {
            fill: var(--q-primary);
        }
    }

    &__left-container {
        grid-area: a;
    }
    &__middle-container,
    &__right-container {
        display: flex;
        width: max-content;
        text-align: left;
    }

    &__middle-container {
        grid-area: b;
        @include text--paragraph;
        color: var(--text-default-contrast);
        display: flex;
        align-items: flex-start;
        gap: 6px;

        white-space: nowrap;
    }

    &__right-container {
        grid-area: c;
    }

    &__withdrawal-status {
        @include text--paragraph-bold;
    }

    &__middle-content {
        display: flex;
        flex-direction: column;
    }

    &__balance-container {
        display: flex;
        justify-content: center;
        align-items: flex-start;
        gap: 8px;

        flex-direction: column;
        flex-shrink: 1;
        text-align: right;
        min-width: 0;
        @include sm-and-up {
            align-items: flex-end;
        }
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
