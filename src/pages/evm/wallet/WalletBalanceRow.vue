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
        tokenLogo(): string {
            if (this.token.logoURI) {
                return this.token.logoURI;
            } else {
                return require('src/assets/logo--tlos.svg');
            }
        },
        grayLogo() {
            return !this.token.logoURI;
        },
        tokenBalanceFiat(): number | null {
            // https://github.com/telosnetwork/telos-wallet/issues/179
            //     get this.token fiat balance; if no fiat balance available, return null
            //     if tokenBalanceFiat cannot be computed / mapped from store getter, move to data and
            //     set in async created()
            if (this.token.symbol === 'STLOS') {
                return 456789123.67;
            } else if (this.token.symbol === 'TLOS') {
                return 0;
            } else {
                return 12345.67;
            }
        },
        tokenHasFiatValue(): boolean {
            return !['SHIB', 'SHIB2'].includes(this.token.symbol);
        },
        truncatePrimaryValue(): boolean {
            const isMobile = this.$q.screen.lt.lg;

            if (!isMobile) {
                return false;
            } else {
                const primaryAmountIsTooLarge =
                    (typeof this.primaryAmount === 'number' && this.primaryAmount.toString().length > 6) ||
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
                    (typeof this.secondaryAmount === 'number' && this.secondaryAmount.toString().length > 7) ||
                    (typeof this.secondaryAmount === 'string' && this.secondaryAmount.length > 7);

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
                return this.tokenBalanceFiat as number;
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
                        const symbol = '$'; // https://github.com/telosnetwork/telos-wallet/issues/179 get this from site settings

                        return `${symbol} ${amount}`;
                    } else {
                        const amount = formatFiatAmount(this.primaryAmount as number);
                        const symbol = '$'; // https://github.com/telosnetwork/telos-wallet/issues/179 get this from site settings

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
                    return this.tokenBalanceFiat as number;
                }
            }
        },
        prettySecondaryAmount(): string {
            const noSecondaryAmount = typeof this.secondaryAmount === 'string' && !this.secondaryAmount;
            if (noSecondaryAmount || !this.tokenHasFiatValue) {
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
                    const symbol = '$'; // https://github.com/telosnetwork/telos-wallet/issues/179 get this from site settings

                    return `${symbol} ${amount}`;
                } else {
                    const amount = formatFiatAmount(this.secondaryAmount as number);
                    const symbol = '$'; // https://github.com/telosnetwork/telos-wallet/issues/179 get this from site settings

                    return `${symbol} ${amount} ${this.fiatRateText}`;
                }
            }
        },
        tooltipText(): string {
            let text = '';

            if (this.truncatePrimaryValue) {
                text = `${this.$t('evm_wallet.token_balance')}:\n${commify(this.token.balance)}\n\n`;
            }

            if (this.truncateSecondaryValue && this.tokenHasFiatValue) {
                const symbol = '$'; // https://github.com/telosnetwork/telos-wallet/issues/179 get from site settings
                const formatted = commify(this.tokenBalanceFiat as number);
                text += `${this.$t('evm_wallet.fiat_value')}:\n${symbol}${formatted}\n\n`;
            }

            if (!this.tokenHasFiatValue) {
                text += `${this.$t('evm_wallet.no_fiat_value')}`;
            }

            return text.trim();
        },
        overflowMenuItems() {
            return [];
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
        <img
            :src="tokenLogo"
            :class="{
                'c-wallet-balance-row__logo': true,
                'c-wallet-balance-row__logo--gray': grayLogo,
            }"
            height="40"
            width="40"
            aria-hidden="true"
            :alt="$t('evm_wallet.token_logo_alt')"
        >
        <div>
            <p class="q-mb-xs">
                {{ token.symbol }}
            </p>
            {{ token.name }}
        </div>
    </div>

    <div class="c-wallet-balance-row__right-container">
        <div ref="balance-container" class="c-wallet-balance-row__balance-container">
            <div class="c-wallet-balance-row__primary-amount" @click="toggleTooltip">
                {{ prettyPrimaryAmount }}

                <template v-if="truncatePrimaryValue || truncateSecondaryValue || !tokenHasFiatValue">
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
            <span v-if="secondaryAmount !== ''" class="c-wallet-balance-row__secondary-amount">
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
        display: flex;
        align-items: center;
        gap: 16px;

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

    &__logo {
        height: 40px;
        width: 40px;
        display: none;

        @media only screen and (min-width: $breakpoint-lg-min) {
            display: block;
        }

        &--gray {
            filter: grayscale(1);
        }
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
