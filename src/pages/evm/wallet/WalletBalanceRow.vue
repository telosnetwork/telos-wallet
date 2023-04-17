<script lang="ts">
import { defineComponent, PropType } from 'vue';

import InlineSvg from 'vue-inline-svg';

import { prettyPrintCurrency } from 'src/antelope/stores/utils';
import { useChainStore, useUserStore } from 'src/antelope';

import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { EvmToken } from 'src/antelope/types';
import ToolTip from 'components/ToolTip.vue';

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
        token: {
            type: Object as PropType<EvmToken>,
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
            const isMobile = this.$q.screen.lt.md;

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
            const isMobile = this.$q.screen.lt.md;

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
            // https://github.com/telosnetwork/telos-wallet/issues/179
            //     get actual conversion rate
            if (!this.tokenHasFiatValue) {
                return '';
            }

            const fiatAmount = 0.7732;
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
            const isMobile = this.$q.screen.lt.md;

            // on desktop, the top value is fiat if there is a fiat value for the token
            // on mobile, the top (only) value is the token balance iff token has no reliable fiat value.
            //            if there is a fiat value, the top number is the fiat amount
            if (this.tokenHasFiatValue && isMobile) {
                return this.tokenBalanceFiat as number;
            } else {
                return +(this.token.balance ?? 0);
            }
        },
        prettyPrimaryAmount(): string {
            const isMobile = this.$q.screen.lt.md;

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
            const isMobile = this.$q.screen.lt.md;

            if (!this.tokenHasFiatValue) {
                return '';
            } else {
                if (isMobile) {
                    return +(this.token.balance ?? 0);
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

            const isMobile = this.$q.screen.lt.md;

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
        tooltipText(): string {
            let text = '';

            if (this.truncatePrimaryValue && this.tokenHasFiatValue) {
                const formattedBalance = prettyPrintCurrency(this.tokenBalanceFiat as number, 2, fiatLocale, false, fiatCurrency);
                text = `${this.$t('evm_wallet.fiat_value')}:\n${formattedBalance}\n\n`;
            }

            if (
                (this.truncateSecondaryValue && this.tokenHasFiatValue) ||
                (this.truncatePrimaryValue && !this.tokenHasFiatValue)
            ) {
                const formattedBalance = prettyPrintCurrency(+(this.token.balance ?? 0), this.token.decimals, fiatLocale, false);

                text += `${this.$t('evm_wallet.token_balance')}:\n${formattedBalance}\n\n`;
            }

            return text.trim();
        },
        tooltipWarningText() {
            return !this.tokenHasFiatValue ? [`${this.$t('evm_wallet.no_fiat_value')}`] : undefined;
        },
        overflowMenuItems(): OverflowMenuItem[] {
            const items: OverflowMenuItem[] = [];
            const chainStore = useChainStore();
            const chainSettings = chainStore.currentChain.settings as EVMChainSettings;
            const getExplorerUrl = (address: string) => `${chainSettings.getExplorerUrl()}/address/${address}`;

            const tokenIsTlos  = !this.token.address; // TLOS is the only token with no address
            const tokenIsStlos = chainSettings.getStlosContractAddress() === this.token.address;
            const tokenIsWtlos = chainSettings.getWtlosContractAddress() === this.token.address;
            const buyMoreLink  = chainSettings.getBuyMoreOfTokenLink();

            if (tokenIsTlos || tokenIsStlos) {
                items.push({
                    label: this.$t(`evm_wallet.${tokenIsTlos ? 'stake' : 'unstake'}`),
                    icon: require('src/assets/icon--acorn.svg'),
                    strokeIcon: true,
                    url: { name: 'evm-staking' },
                });
            }

            if (tokenIsTlos) {
                items.push({
                    label: this.$t('evm_wallet.buy'),
                    icon: require('src/assets/icon--plus.svg'),
                    url: buyMoreLink,
                });
            }

            if (tokenIsTlos) {
                items.push({
                    label: this.$t('evm_wallet.wrap'),
                    icon: require('src/assets/icon--wrap-tlos.svg'),
                    url: { name: 'evm-wrap' },
                });
            }

            if (tokenIsWtlos) {
                items.push({
                    label: this.$t('evm_wallet.unwrap'),
                    icon: require('src/assets/icon--wrap-tlos.svg'),
                    url: { name: 'evm-wrap', query: { tab: 'unwrap' } },
                });
            }

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
                    query: { ...(this.token.address ? { token: this.token.address ?? '' } : {}) },
                },
            });

            return items;
        },
    },
    methods: {
        toggleTooltip() {
            this.showTooltip = true;

            setTimeout(() => {
                this.showTooltip = false;
            }, 2000);
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
            <div class="c-wallet-balance-row__primary-amount" @click="toggleTooltip">
                {{ prettyPrimaryAmount }}

                <ToolTip
                    v-if="truncatePrimaryValue || truncateSecondaryValue || !tokenHasFiatValue"
                    icon="info"
                    :text="tooltipText"
                    :warnings="tooltipWarningText"
                />
            </div>
            <span v-if="secondaryAmount !== ''" class="c-wallet-balance-row__secondary-amount">
                {{ prettySecondaryAmount }}
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
        display: flex;
        align-items: center;
        gap: 16px;

        font-size: 16px;
        font-weight: 400;
        line-height: 24px;
        color: var(--text-color);
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
        flex: 1 1 max-content;
        text-align: right;
        font-size: 18px;
        font-weight: 600;
        line-height: 24px;
    }

    &__secondary-amount {
        color: var(--text-color-muted);
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
        color: var(--text-color);
        transition: background-color 0.1s ease-in-out;
        transition-property: background-color, color;

        &:hover {
            background-color: var(--bg-color-hover);
            color: $primary;

            #{$this}__overflow-icon {
                &:not(#{$this}__overflow-icon--stroke) path {
                    fill: $primary;
                }

                &#{$this}__overflow-icon--stroke path {
                    stroke: $primary;
                }
            }
        }
    }

    &__overflow-icon-wrapper {
        height: 24px;
        width: 24px;
        display: inline-flex;
        justify-content: center;
        align-items: center;
    }

    &__overflow-text {
        text-transform: uppercase;
        font-weight: 600;
        font-size: 14px;
        line-height: 21px;
    }

    &__overflow-icon {
        width: 16px;

        path {
            fill: var(--text-color);
        }

        &--stroke {
            path {
                fill: transparent;
                stroke: var(--text-color);
            }
        }
    }
}
</style>
