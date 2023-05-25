<script lang="ts">
import { defineComponent, PropType } from 'vue';

import InlineSvg from 'vue-inline-svg';

import { useChainStore, useUserStore } from 'src/antelope';

import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { NativeCurrencyAddress, TokenBalance, TokenClass } from 'src/antelope/types';
import ToolTip from 'components/ToolTip.vue';
import { prettyPrintCurrency } from 'src/antelope/stores/utils/currency-utils';

const userStore = useUserStore();
const { fiatLocale, fiatCurrency } = userStore;

interface OverflowMenuItem {
    label: string;
    icon: string;
    url: string | { name: string, query?: Record<string, string> };
    strokeIcon?: boolean;
}

export default defineComponent({
    name: 'WalletBalanceRow',
    components: {
        ToolTip,
        InlineSvg,
    },
    props: {
        balance: {
            type: Object as PropType<TokenBalance>,
            required: true,
        },
    },
    computed: {
        token(): TokenClass {
            return this.balance.token;
        },
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
            return this.token.price.isAvailable ? +this.token.price.getAmountInFiatStr(this.balance.amount) : null;
        },
        tokenHasFiatValue(): boolean {
            return this.token.price.isAvailable;
        },
        truncatePrimaryValue(): boolean {
            const isMobile = this.$q.screen.lt.sm;

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
            const isMobile = this.$q.screen.lt.sm;

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
            if (!this.tokenBalanceFiat) {
                return '';
            }

            const fiatAmount = +this.token.price.str;
            const pretty = prettyPrintCurrency(
                fiatAmount,
                4,
                fiatLocale,
                false,
                fiatCurrency,
            );

            return `(@ ${pretty} / ${this.token.symbol})`;
        },
        primaryAmount(): number | string {
            const isMobile = this.$q.screen.lt.sm;

            // on desktop, the top value is fiat if there is a fiat value for the token
            // on mobile, the top (only) value is the token balance iff token has no reliable fiat value.
            //            if there is a fiat value, the top number is the fiat amount
            if (this.tokenHasFiatValue && isMobile) {
                return this.tokenBalanceFiat as number;
            } else {
                return +this.balance.str;
            }
        },
        prettyPrimaryAmount(): string {
            const isMobile = this.$q.screen.lt.sm;

            if (!isMobile) {
                const formatted = prettyPrintCurrency(+this.primaryAmount, 4, fiatLocale);

                return `${formatted} ${this.token.symbol}`;
            } else {
                if (this.tokenHasFiatValue) {
                    if (this.truncatePrimaryValue) {
                        return prettyPrintCurrency(+this.primaryAmount, 2, fiatLocale, true, fiatCurrency);
                    } else {
                        return prettyPrintCurrency(+this.primaryAmount, 2, fiatLocale, false, fiatCurrency);
                    }
                } else {
                    if (this.truncatePrimaryValue) {
                        return prettyPrintCurrency(+this.primaryAmount, 4, fiatLocale, true);
                    } else {
                        return prettyPrintCurrency(+this.primaryAmount, 4, fiatLocale);
                    }
                }
            }
        },
        secondaryAmount(): number | string {
            const isMobile = this.$q.screen.lt.sm;

            if (!this.tokenHasFiatValue) {
                return '';
            } else {
                if (isMobile) {
                    return +this.balance.str;
                } else {
                    return this.tokenBalanceFiat ?? 0;
                }
            }
        },
        prettySecondaryAmount(): string {
            const noSecondaryAmount = typeof this.secondaryAmount === 'string' && !this.secondaryAmount;
            if (noSecondaryAmount || !this.tokenHasFiatValue) {
                return '';
            }

            const isMobile = this.$q.screen.lt.sm;

            if (isMobile) {
                if (this.truncateSecondaryValue) {
                    return prettyPrintCurrency(+this.secondaryAmount, 4, fiatLocale, true).concat(` ${this.token.symbol}`);
                } else {
                    const formatted = prettyPrintCurrency(+this.secondaryAmount, 4, fiatLocale);

                    return `${formatted} ${this.token.symbol}`;
                }
            } else {
                const amount = prettyPrintCurrency(+this.secondaryAmount, 2, fiatLocale, false, fiatCurrency);

                return `${amount} ${this.fiatRateText}`;
            }
        },
        tooltipWarningText() {
            return !this.tokenHasFiatValue ? [`${this.$t('evm_wallet.no_fiat_value')}`] : undefined;
        },
        overflowMenuItems(): OverflowMenuItem[] {
            const items: OverflowMenuItem[] = [];
            const chainStore = useChainStore();
            const chainSettings = chainStore.currentChain.settings as EVMChainSettings;
            const getExplorerUrl = (address: string) => `${chainSettings.getExplorerUrl()}/address/${address}`;

            const tokenIsTlos  = this.token.address === NativeCurrencyAddress;
            const tokenIsStlos = chainSettings.getStakedSystemToken().address === this.token.address;
            const tokenIsWtlos = chainSettings.getWrappedSystemToken().address === this.token.address;
            const buyMoreLink  = chainSettings.getBuyMoreOfTokenLink();

            // if (tokenIsTlos || tokenIsStlos) {
            //     items.push({
            //         label: this.$t(`evm_wallet.${tokenIsTlos ? 'stake' : 'unstake'}`),
            //         icon: require('src/assets/icon--acorn.svg'),
            //         strokeIcon: true,
            //         url: { name: 'evm-staking' },
            //     });
            // }

            if (tokenIsTlos) {
                items.push({
                    label: this.$t('evm_wallet.buy'),
                    icon: require('src/assets/icon--plus.svg'),
                    url: buyMoreLink,
                });
            }

            // if (tokenIsTlos) {
            //     items.push({
            //         label: this.$t('evm_wallet.wrap'),
            //         icon: require('src/assets/icon--wrap-tlos.svg'),
            //         url: { name: 'evm-wrap' },
            //     });
            // }

            // if (tokenIsWtlos) {
            //     items.push({
            //         label: this.$t('evm_wallet.unwrap'),
            //         icon: require('src/assets/icon--wrap-tlos.svg'),
            //         url: { name: 'evm-wrap', query: { tab: 'unwrap' } },
            //     });
            // }

            if (!tokenIsTlos) {
                items.push({
                    label: this.$t('global.contract'),
                    icon: require('src/assets/icon--code.svg'),
                    url: getExplorerUrl(this.token.address ?? ''),
                });
            }


            items.push({
                label: this.$t('evm_wallet.send'),
                icon: require('assets/icon--arrow-diagonal.svg'),
                url:  {
                    name: 'evm-send',
                    query: { ...(this.token.address !== NativeCurrencyAddress ? { token: this.token.address ?? '' } : {}) },
                },
            });

            return items;
        },
    },
    methods: {
        formatTooltipBalance(amount: number, isFiat: boolean) {
            const decimals = isFiat ? 2 : 4;
            const symbol = isFiat ? fiatCurrency : this.token.symbol;

            return `${prettyPrintCurrency(amount, decimals, fiatLocale)} ${symbol}`;
        },
        goToLink(url: string | object) {
            if (typeof url === 'object') {
                this.$router.push(url);
            } else {
                window.open(url, '_blank');
            }
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
            <div class="c-wallet-balance-row__primary-amount">
                <ToolTip
                    v-if="truncatePrimaryValue"
                    :text="formatTooltipBalance(+primaryAmount, ($q.screen.lt.sm && secondaryAmount !== ''))"
                    :hide-icon="true"
                >
                    {{ prettyPrimaryAmount }}
                </ToolTip>
                <template v-else>
                    {{ prettyPrimaryAmount }}
                </template>

                <ToolTip
                    v-if="!tokenHasFiatValue"
                    icon="info"
                    :warnings="tooltipWarningText"
                />
            </div>
            <span v-if="secondaryAmount !== ''" class="c-wallet-balance-row__secondary-amount">
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
            class="c-wallet-balance-row__overflow"
            :aria-label="$t('evm_wallet.balance_row_actions_aria')"
        >
            <q-menu anchor="bottom end" self="top right" :offset="[0, 16]">
                <ul class="c-wallet-balance-row__overflow-ul">
                    <li
                        v-for="(item, index) in overflowMenuItems"
                        :key="`overflow-item-${index}`"
                        class="c-wallet-balance-row__overflow-li"
                        tabindex="0"
                        :aria-labelledby="`overflow-text-${index}`"
                        @click="goToLink(item.url)"
                        @keydown.enter.space="goToLink(item.url)"
                    >
                        <div class="c-wallet-balance-row__overflow-icon-wrapper">
                            <InlineSvg
                                :src="item.icon"
                                :class="{
                                    'c-wallet-balance-row__overflow-icon': true,
                                    'c-wallet-balance-row__overflow-icon--stroke': item.strokeIcon,
                                }"
                                aria-hidden="true"
                            />
                        </div>

                        <span :id="`overflow-text-${index}`" class="c-wallet-balance-row__overflow-text">
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
.c-wallet-balance-row {
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
        width: max-content;
    }

    &__left-container {
        @include text--paragraph;
        color: var(--text-default-contrast);
        display: flex;
        align-items: center;
        gap: 16px;

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

        @include md-and-up {
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

    &__overflow {
        flex-shrink: 0;
    }

    &__overflow-ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    &__overflow-li {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        cursor: pointer;
        color: var(--text-default-contrast);
        transition: background-color 0.1s ease-in-out;
        transition-property: background-color, color;

        &:hover {
            background-color: var(--bg-color-hover);

            #{$this}__overflow-icon {
                &:not(#{$this}__overflow-icon--stroke) path {
                    fill: var(--accent-color);
                }

                &#{$this}__overflow-icon--stroke path {
                    stroke: var(--accent-color);
                }
            }

            #{$this}__overflow-text {
                color: var(--accent-color);
            }
        }
    }

    &__overflow-text {
        @include text--header-5;
        color: var(--text-default-contrast);
    }

    &__overflow-icon-wrapper {
        height: 24px;
        width: 24px;
        display: inline-flex;
        justify-content: center;
        align-items: center;
    }

    &__overflow-icon {
        width: 16px;

        path {
            fill: var(--text-default-contrast);
        }

        &--stroke {
            path {
                fill: transparent;
                stroke: var(--text-default-contrast);
            }
        }
    }
}
</style>
