<script lang="ts">
import { defineComponent } from 'vue';

import InlineSvg from 'vue-inline-svg';

import { formatFiatAmount, abbreviateNumber } from 'src/antelope/stores/utils';
import { commify } from 'ethers/lib/utils';

export default defineComponent({
    name: 'WalletBalanceRow',
    components: {
        InlineSvg,
    },
    props: {
        token: {
            type: Object,
            required: true,
        },
    },
    data: () => ({
        showTooltip: false,
    }),
    computed: {
        tokenBalanceFiat() {
            // eztodo reference issue for api integration

            if (this.token.symbol === 'STLOS') {
                return 456789123.67;
            } else {
                return 12345.67;
            }
        },
        tokenHasFiatValue(): boolean {
            return this.token.name !== 'Shiba';
        },
        truncatePrimaryValue(): boolean {
            const isMobile = this.$q.screen.lt.lg;

            if (!isMobile) {
                return false;
            } else {
                const primaryAmountIsTooLarge =
                    (typeof this.primaryAmount === 'number' && this.primaryAmount > 999999) ||
                    (typeof this.primaryAmount === 'string' && this.primaryAmount.length > 6);

                return primaryAmountIsTooLarge;
            }
        },
        truncateSecondaryValue() {
            const isMobile = this.$q.screen.lt.lg;

            if (!isMobile) {
                return false;
            } else {
                const secondaryAmountIsTooLarge =
                    (typeof this.secondaryAmount === 'number' && this.secondaryAmount > 999999) ||
                    (typeof this.secondaryAmount === 'string' && this.secondaryAmount.length > 8);

                return secondaryAmountIsTooLarge;
            }
        },
        fiatRateText(): string {
            if (!this.tokenHasFiatValue) {
                return '';
            }

            const fiatSymbol = '$';
            const fiatAmount = abbreviateNumber(0.7732);

            return `(@ ${fiatSymbol}${fiatAmount} / ${this.token.symbol})`;
        },
        primaryAmount(): number | string {
            const isMobile = this.$q.screen.lt.lg;

            // on desktop, the top value is fiat
            // on mobile, the top (only) value is the token balance iff token has no reliable fiat value.
            //            if there is a fiat value, the top number is the fiat amount
            if (this.tokenHasFiatValue && isMobile) {
                return this.tokenBalanceFiat;
            } else {
                return this.token.balance;
            }
        },
        prettyPrimaryAmount(): string {
            const isMobile = this.$q.screen.lt.lg;

            if (!isMobile) {
                const formatted = commify(this.primaryAmount);
                const append = this.truncatePrimaryValue ? '' : ` ${this.token.symbol}`;

                return `${formatted}${append}`;
            } else {
                if (this.tokenHasFiatValue) {
                    if (this.truncatePrimaryValue) {
                        const amount = abbreviateNumber(this.primaryAmount as number);
                        const symbol = '$'; // eztodo add issue reference for api integration

                        return `${symbol} ${amount}`;
                    } else {
                        const amount = formatFiatAmount(this.primaryAmount as number);
                        const symbol = '$'; // eztodo add issue reference for api integration

                        return `${symbol} ${amount}`;
                    }
                } else {
                    if (this.truncatePrimaryValue) {
                        return abbreviateNumber(+this.primaryAmount);
                    } else {
                        return commify(this.primaryAmount);
                    }
                }
            }
        },
        secondaryAmount(): number | string {
            const isMobile = this.$q.screen.lt.lg;

            if (!this.tokenHasFiatValue) {
                return '';
            } else {
                if (isMobile) {
                    return this.token.balance;
                } else {
                    // eztodo reference issue for api integration
                    return this.tokenBalanceFiat;
                }
            }
        },
        prettySecondaryAmount(): string {
            if (!this.secondaryAmount || !this.tokenHasFiatValue) {
                return '';
            }

            const isMobile = this.$q.screen.lt.lg;

            if (isMobile) {
                if (this.truncateSecondaryValue) {
                    return abbreviateNumber(+this.secondaryAmount).concat(` ${this.token.symbol}`);
                } else {
                    const formattedWei = commify(this.secondaryAmount);

                    return `${formattedWei} ${this.token.symbol}`;
                }
            } else {
                if (this.truncateSecondaryValue) {
                    const amount = abbreviateNumber(this.secondaryAmount as number);
                    const symbol = '$'; // eztodo add issue reference for api integration

                    return `${symbol} ${amount}`;
                } else {
                    const amount = formatFiatAmount(this.secondaryAmount as number);
                    const symbol = '$'; // eztodo add issue reference for api integration

                    return `${symbol} ${amount} ${this.fiatRateText}`;
                }
            }
        },
        tooltipText(): string {
            let text =  `${this.$t('evm_wallet.token_balance')}:\n${commify(this.token.balance)}`;


            if (this.tokenHasFiatValue){
                const symbol = '$'; // eztodo add issue reference for api integration
                const formatted = commify(this.tokenBalanceFiat);
                text += `\n\n${this.$t('evm_wallet.fiat_value')}\n${symbol}${formatted}`;
            }

            return text;
        },
    },
    methods: {
        toggleTooltip() {
            this.showTooltip = true;

            setTimeout(() => {
                this.showTooltip = false;
            }, 2000);
        },
    },
});
</script>

<template>
<div class="c-wallet-balance-row">
    <div class="c-wallet-balance-row__left-container">
        <p class="q-mb-xs">
            {{ token.symbol }}
        </p>
        {{ token.name }}
    </div>

    <div class="c-wallet-balance-row__right-container">
        <div ref="balance-container" class="c-wallet-balance-row__balance-container">
            <div class="c-wallet-balance-row__primary-amount" @click="toggleTooltip">
                {{ prettyPrimaryAmount }}

                <template v-if="truncatePrimaryValue">
                    <InlineSvg
                        :src="require('src/assets/icon--info.svg')"
                        class="c-wallet-balance-row__info-icon"
                    />
                    <q-tooltip :model-value="showTooltip">
                        <span class="c-wallet-balance-row__tooltip">
                            {{ tooltipText }}
                        </span>
                    </q-tooltip>
                </template>
            </div>
            <span v-if="secondaryAmount" class="c-wallet-balance-row__secondary-amount">
                {{ prettySecondaryAmount }}
            </span>
        </div>

        <q-btn-dropdown
            flat
            dense
            no-icon-animation
            dropdown-icon="more_vert"
            class="c-wallet-balance-row__overflow"
            :aria-label="$t('evm_wallet.balance_row_actions_aria')"
        />
    </div>
</div>
</template>

<style lang="scss">
.c-wallet-balance-row {
    display: flex;
    justify-content: space-between;
    border-radius: 4px;
    border-bottom: 2px solid #EEE8FF;
    padding: 24px 4px;
    overflow-x: hidden;
    max-width: 100%;
    min-width: 0;

    &__left-container,
    &__right-container {
        width: max-content;
    }

    &__left-container {
        font-size: 16px;
        font-weight: 400;
        line-height: 24px;
        color: $dark;
        white-space: nowrap;
    }

    &__right-container {
        display: flex;
        gap: 8px;
        min-width: 0;
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
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1 1 max-content;
        text-align: right;
        font-size: 18px;
        font-weight: 600;
        line-height: 24px;
    }

    &__secondary-amount {
        color: $grey-7;
    }

    &__info-icon {
        // svg color override
        path {
            fill: $primary;
        }
    }

    &__tooltip {
        white-space: pre-line;
    }

    &__overflow {
        flex-shrink: 0;
    }
}
</style>
