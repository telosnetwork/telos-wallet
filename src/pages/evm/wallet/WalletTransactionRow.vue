<script lang="ts">
import { defineComponent, PropType } from 'vue';

import InlineSvg from 'vue-inline-svg';

import { ShapedTransactionRow } from 'src/antelope/types';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { getLongDate } from 'src/antelope/stores/utils';
import { useChainStore, useUserStore } from 'src/antelope';

import ExternalLink from 'components/ExternalLink.vue';
import TimeStamp from 'components/TimeStamp.vue';
import ToolTip from 'components/ToolTip.vue';
import { prettyPrintCurrency } from 'src/antelope/stores/utils/currency-utils';

const userStore = useUserStore();

const arrowIcon = require('src/assets/icon--arrow-diagonal.svg');
const swapIcon = require('src/assets/icon--swap-diagonal.svg');
const contractIcon = require('src/assets/icon--contract.svg');
const failureIcon = require('src/assets/icon--x.svg');

export default defineComponent({
    name: 'WalletTransactionRow',
    components: {
        ToolTip,
        TimeStamp,
        ExternalLink,
        InlineSvg,
    },
    props: {
        transaction: {
            type: Object as PropType<ShapedTransactionRow>,
            required: true,
        },
    },
    computed: {
        fiatLocale(): string {
            return useUserStore().fiatLocale;
        },
        fiatCurrency(): string {
            return useUserStore().fiatCurrency;
        },
        chainSettings(): EVMChainSettings {
            return useChainStore().currentChain.settings as EVMChainSettings;
        },
        actionName(): string {
            if (this.transaction.failed) {
                return this.$t('evm_wallet.failed_contract_interaction');
            }

            return this.transaction.actionName || this.$t('evm_wallet.contract_interaction');
        },
        interactionIcon(): string {
            if (this.transaction.failed) {
                return failureIcon;
            } else if (this.actionName === 'swap') {
                return swapIcon;
            } else if (['send', 'receive'].includes(this.actionName)) {
                return arrowIcon;
            } else {
                return contractIcon;
            }
        },
        rotateIcon() {
            return this.actionName === 'receive';
        },
        showInteractionSecondaryText(): boolean {
            if (this.$q.screen.lt.sm && this.transaction.failed) {
                return false;
            }

            return !['send', 'receive', 'swap'].includes(this.transaction.actionName);
        },
        actionHasDescriptiveText(): boolean {
            // only true for 'known actions' send, receive, and swap
            return ['send', 'receive', 'swap'].includes(this.transaction.actionName);
        },
        actionDescriptiveText(): string {
            switch (this.transaction.actionName) {
            case 'send':
                return this.$t('evm_wallet.sent');
            case 'receive':
                return this.$t('evm_wallet.received');
            case 'swap':
                return this.$t('evm_wallet.swapped');
            default:
                return '';
            }
        },
        actionPrepositionText(): string {
            switch (this.transaction.actionName) {
            case 'send':
                return this.$t('global.to');
            case 'receive':
                return this.$t('global.from');
            case 'swap':
                return this.$t('global.with');
            default:
                return '';
            }
        },
        // the text representing who the user interacted with, either an address or alias
        interactedWithText(): string {
            if (this.transaction.actionName === 'receive') {
                return this.transaction.fromPrettyName || this.transaction.from;
            } else {
                return this.transaction.toPrettyName || this.transaction.to;
            }
        },
        // link to the explorer page for the address the user interacted with
        interactedWithUrl(): string {
            const { actionName, from, to } = this.transaction;

            let address = actionName === 'receive' ? from : to;

            return `${this.chainSettings.getExplorerUrl()}/address/${address}`;
        },
        transactionUrl(): string {
            return `${this.chainSettings.getExplorerUrl()}/tx/${this.transaction.id}`;
        },
        longDate(): string {
            return getLongDate(this.transaction.epoch);
        },
        chainTokenSymbol(): string {
            return this.chainSettings.getSystemToken().symbol;
        },
    },
    methods: {
        formatAmount(amount: number, symbol: string = userStore.fiatCurrency, useSymbolCharacter: boolean = false) {
            const decimals = symbol === userStore.fiatCurrency ? 2 : 4;
            const formatted = prettyPrintCurrency(
                amount,
                decimals,
                userStore.fiatLocale,
                false,
                useSymbolCharacter ? userStore.fiatCurrency : undefined,
            );

            return `${formatted} ${symbol}`;
        },
    },
});
</script>

<template>
<div class="c-transaction-row">
    <div class="c-transaction-row__info-container c-transaction-row__info-container--first">
        <div class="c-transaction-row__interaction-icon-container">
            <InlineSvg
                :src="interactionIcon"
                :class="{
                    'c-transaction-row__interaction-icon': true,
                    'c-transaction-row__interaction-icon--rotated': rotateIcon,
                    'c-transaction-row__interaction-icon--red': transaction.failed,
                }"
                height="12"
                aria-hidden="true"
            />
        </div>

        <div>
            <div class="c-transaction-row__primary-interaction-text">
                <template v-if="actionHasDescriptiveText">
                    <span class="c-transaction-row__action-description">
                        {{ actionDescriptiveText }}&thinsp;
                    </span>
                    <span class="c-transaction-row__interaction-nowrap">
                        {{ actionPrepositionText }}
                        <ExternalLink
                            :text="interactedWithText"
                            :url="interactedWithUrl"
                            :purpose="$t('evm_wallet.aria_link_to_address')"
                        />
                    </span>
                </template>

                <span v-else class="c-transaction-row__action-name">
                    {{ actionName }}
                </span>
            </div>

            <div v-if="showInteractionSecondaryText" class="c-transaction-row__secondary-interaction-text">
                <ExternalLink
                    :text="interactedWithText"
                    :url="interactedWithUrl"
                    :purpose="$t('evm_wallet.aria_link_to_address')"
                />
            </div>
        </div>

        <div class="c-transaction-row__timestamp">
            <ToolTip :text="longDate" :hide-icon="true">
                <TimeStamp :timestamp="transaction.epoch" />
            </ToolTip>

            <template v-if="$q.screen.gt.xs">
                <div>
                    trx:
                    <ExternalLink
                        :text="transaction.id"
                        :url="transactionUrl"
                        :purpose="$t('evm_wallet.aria_link_to_transaction')"
                    />
                </div>
            </template>
        </div>
    </div>

    <div class="c-transaction-row__info-container c-transaction-row__info-container--second">
        <div
            v-for="(values, index) in transaction.valuesOut"
            :key="`values-out-${index}`"
            class="c-transaction-row__value-container"
        >
            <div class="c-transaction-row__value c-transaction-row__value--out">
                {{ formatAmount(-values.amount, values.symbol) }}

                <ToolTip
                    v-if="!values.fiatValue"
                    :warnings="[$t('evm_wallet.no_fiat_value')]"
                />
            </div>
            <span
                v-if="values.fiatValue"
                class="c-transaction-row__value c-transaction-row__value--out c-transaction-row__value--small"
            >
                {{ formatAmount(-values.fiatValue) }}
            </span>
        </div>

        <div
            v-for="(values, index) in transaction.valuesIn"
            :key="`values-in-${index}`"
            class="c-transaction-row__value-container"
        >
            <div class="c-transaction-row__value c-transaction-row__value--in">
                +{{ formatAmount(values.amount, values.symbol) }}

                <ToolTip
                    v-if="!values.fiatValue"
                    :warnings="[$t('evm_wallet.no_fiat_value')]"
                />
            </div>
            <span
                v-if="values.fiatValue"
                class="c-transaction-row__value c-transaction-row__value--in c-transaction-row__value--small"
            >
                +{{ formatAmount(values.fiatValue) }}
            </span>
        </div>
    </div>

    <div class="c-transaction-row__info-container c-transaction-row__info-container--third">
        <div class="c-transaction-row__gas-icon-container">
            <q-icon name="local_gas_station" size="xs" />
        </div>
        <div class="c-transaction-row__gas-text">
            <span>{{ formatAmount(transaction.gasUsed ?? 0, chainTokenSymbol) }}</span>

            <span>{{ formatAmount(transaction.gasFiatValue ?? 0, undefined, true) }}</span>
        </div>

        <div
            v-if="$q.screen.lt.sm"
            class="c-transaction-row__mobile-tx-link"
        >
            <ExternalLink
                :text="$t('global.more_info')"
                :url="transactionUrl"
                :purpose="$t('evm_wallet.aria_link_to_transaction')"
            />
        </div>
    </div>
</div>
</template>

<style lang="scss">
.c-transaction-row {
    max-width: 1000px;
    padding: 16px 8px;
    border-bottom: 2px solid $page-header;
    display: grid;
    gap: 16px;
    grid-template:
        'a'
        'b'
        'c';

    @include sm-and-up {
        gap: 32px;
        grid-template: 'a b c' / auto auto max-content;
    }

    &__info-container {
        &--first {
            display: grid;
            grid-template: 'a b c' auto / min-content auto max-content;
            gap: 8px;

            @include sm-and-up {
                grid-template:
                    'a b' auto
                    'c c' auto
                    / 16px max-content;
            }
        }

        &--second,
        &--third {
            margin-left: 24px;

            @include sm-and-up {
                margin-left: unset;
            }
        }

        &--second {
            display: flex;
            flex-direction: column;
            gap: 8px;

            @include sm-and-up {
                justify-content: center;
            }
        }

        &--third {
            display: flex;
            align-items: center;
            gap: 4px;

            @include sm-and-up {
                justify-content: flex-end;
            }
        }
    }

    &__interaction-info {
        display: grid;
        grid-template-columns: min-content minmax(0, 1fr) max-content;
        gap: 8px;
        max-width: 100%;
    }

    &__interaction-icon-container {
        height: 16px;
        width: 16px;
        display: inline-flex;
        justify-content: center;
        align-items: center;
        // align-self: center;
    }

    &__interaction-icon {
        height: 16px;
        margin-top: 4px;

        path {
            fill: var(--accent-color);
        }

        &--rotated {
            transform: rotate(180deg);
        }

        &--red {
            path {
                fill: var(--negative-color);
            }
        }

        @include sm-and-up {
            margin-top: 8px;
        }
    }

    &__interaction-nowrap {
        white-space: nowrap;
    }

    &__primary-interaction-text {
        @include text--small;
        color: var(--text-default-contrast);

        @include sm-and-up {
            @include text--paragraph;
        }
    }

    &__action-description,
    &__action-name {
        @include text--small-bold;
        color: var(--text-hight-contrast);

        @include sm-and-up {
            @include text--paragraph-bold;
        }
    }

    &__secondary-interaction-text {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    &__timestamp {
        display: flex;
        align-items: flex-start;
        justify-content: flex-end;
        width: max-content;
        margin-left: 24px;
        color: var(--text-low-contrast);

        @include sm-and-up {
            align-items: center;
            gap: 12px;
        }
    }

    &__value-container {
        display: flex;
        flex-direction: column;

        @include sm-and-up {
            align-items: flex-end;
        }

        @include md-and-up {
            gap: 8px;
            flex-direction: row;
            align-items: center;
            justify-content: flex-end;
        }
    }

    &__value {
        $value: &;

        @include text--paragraph;

        width: max-content;
        display: inline-flex;
        align-items: center;
        gap: 8px;

        &--out {
            color: var(--negative-color);
        }

        &--out#{$value}--small {
            color: var(--negative-muted);
        }

        &--in {
            color: var(--positive-color);
        }

        &--in#{$value}--small {
            color: var(--positive-muted);
        }

        &--small {
            @include text--small;
        }
    }

    &__gas-icon-container {
        display: flex;
        align-items: center;
        color: var(--text-default-contrast);
    }

    &__gas-text {
        display: flex;
        gap: 0;
        flex-shrink: 0;
        flex-direction: column;
        align-items: flex-start;
        color: var(--text-default-contrast);
    }

    &__mobile-tx-link {
        flex: 1 1 100%;
        text-align: right;
    }
}
</style>
