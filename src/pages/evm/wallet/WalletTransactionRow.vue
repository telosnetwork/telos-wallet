<script lang="ts">
import { defineComponent, PropType } from 'vue';
import InlineSvg from 'vue-inline-svg';
import ExternalLink from 'components/ExternalLink.vue';
import TimeStamp from 'components/TimeStamp.vue';
import { ShapedTransactionRow } from 'src/antelope/types';
import ToolTip from 'components/ToolTip.vue';
import { getFormattedUtcOffset, getLongDate } from 'src/antelope/stores/utils';
import moment from 'moment';

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
        actionName(): string {
            // eztodo i18n
            if (this.transaction.failed) {
                return 'Failed contract interaction';
            }

            return this.transaction.actionName || 'Contract interaction';
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
            // eztodo make i18n
            switch (this.transaction.actionName) {
            case 'send':
                return 'Sent';
            case 'receive':
                return 'Received';
            case 'swap':
                return 'Swapped';
            default:
                return '';
            }
        },
        actionPrepositionText(): string {
            // eztodo make i18n
            switch (this.transaction.actionName) {
            case 'send':
                return 'to';
            case 'receive':
                return 'from';
            case 'swap':
                return 'with';
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
            // eztodo store to use get explorer url

            const { actionName, from, to } = this.transaction;

            let address = actionName === 'receive' ? from : to;

            return `www.teloscan.io/address/${address}`;
        },
        transactionUrl(): string {
            // eztodo store to use get explorer url

            return `www.teloscan.io/tx/${this.transaction.id}`;
        },
        longDate(): string {
            return getLongDate(this.transaction.epoch);
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

        <div class="c-transaction-row__interaction-text-container">
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
                />
            </div>
        </div>

        <div class="c-transaction-row__timestamp">
            <ToolTip :text="longDate" :hide-icon="true">
                <TimeStamp :timestamp="transaction.epoch" :muted="true" />
            </ToolTip>

            <template v-if="$q.screen.gt.xs">
                <div>
                    trx:
                    <ExternalLink
                        :text="transaction.id"
                        :url="transactionUrl"
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
                -{{ values.amount }} {{ values.symbol }}

                <!-- eztodo i18n -->
                <ToolTip v-if="!values.fiatValue" :warnings="['No reliable fiat value found']"/>
            </div>
            <span
                v-if="values.fiatValue"
                class="c-transaction-row__value c-transaction-row__value--out c-transaction-row__value--small"
            >
                <!-- eztodo switch to fiat symbol from store, format values using formatcurrency -->
                -{{ values.fiatValue }} USD
            </span>
        </div>

        <div
            v-for="(values, index) in transaction.valuesIn"
            :key="`values-in-${index}`"
            class="c-transaction-row__value-container"
        >
            <div class="c-transaction-row__value c-transaction-row__value--in">
                +{{ values.amount }} {{ values.symbol }}

                <!-- eztodo i18n -->
                <ToolTip v-if="!values.fiatValue" :warnings="['No reliable fiat value found']"/>
            </div>
            <span
                v-if="values.fiatValue"
                class="c-transaction-row__value c-transaction-row__value--in c-transaction-row__value--small"
            >
                <!-- eztodo switch to fiat symbol from store, format values using formatcurrency -->
                +{{ values.fiatValue }} USD
            </span>
        </div>
    </div>

    <div class="c-transaction-row__info-container c-transaction-row__info-container--third">
        <!-- eztodo get system token symbol from store -->
        <div class="c-transaction-row__gas-icon-container">
            <q-icon name="local_gas_station" size="xs" />
        </div>
        <div class="c-transaction-row__gas-text">
            <span>{{ transaction.gasUsed }} TLOS</span>
            <!-- eztodo get symbol from store -->
            <span>${{ transaction.gasFiatValue }}</span>
        </div>

        <div
            v-if="$q.screen.lt.sm"
            class="c-transaction-row__mobile-tx-link"
        >
            <!-- eztodo localize -->
            <ExternalLink
                :text="'More info'"
                :url="transactionUrl"
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

    @media only screen and (min-width: $breakpoint-sm-min) {
        gap: 32px;
        grid-template: 'a b c' / auto auto max-content;
    }

    &__info-container {
        &--first {
            display: grid;
            grid-template: 'a b c' auto / min-content auto max-content;
            gap: 8px;

            @media only screen and (min-width: $breakpoint-sm-min) {
                grid-template:
                    'a b' auto
                    'c c' auto
                    / 16px max-content;
            }
        }

        &--second {
            display: flex;
            flex-direction: column;
            gap: 8px;

            @media only screen and (min-width: $breakpoint-sm-min) {
                justify-content: center;
            }
        }

        &--third {
            display: flex;
            align-items: center;
            gap: 4px;

            @media only screen and (min-width: $breakpoint-sm-min) {
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
    }

    &__interaction-icon {
        height: 16px;

        path {
            fill: $primary;
        }

        &--rotated {
            transform: rotate(180deg);
        }

        &--red {
            path {
                fill: $negative;
            }
        }
    }

    &__interaction-text-container {

    }

    &__interaction-nowrap {
        white-space: nowrap;
    }

    &__primary-interaction-text {
        font-size: 12px;
        line-height: 14px;

        @media only screen and (min-width: $breakpoint-sm-min) {
            font-size: 16px;
            line-height: 16px;
        }
    }

    &__action-description {
        font-weight: 600;
    }

    &__action-name {
        font-weight: 600;
        font-size: 14px;
        line-height: 16px;
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
        color: var(--text-color-muted);

        @media only screen and (min-width: $breakpoint-sm-min) {
            align-items: center;
            gap: 12px;
        }
    }

    &__value-container {
        display: flex;
        flex-direction: column;

        @media only screen and (min-width: $breakpoint-sm-min) {
            gap: 8px;
            flex-direction: row;
            align-items: center;
            justify-content: flex-end;
        }
    }

    &__value {
        $value: &;

        font-weight: 400;
        font-size: 16px;
        width: max-content;
        display: inline-flex;
        align-items: center;
        gap: 8px;

        &--out {
            color: darkred;
        }

        &--out#{$value}--small {
            color: palevioletred;
        }

        &--in {
            color: forestgreen;
        }

        &--in#{$value}--small {
            color: darkseagreen;
        }

        &--small {
            font-size: 14px;
        }
    }
    //
    //&__gas-container {
    //    display: grid;
    //    gap: 4px;
    //    grid-template: 'a b c' / 16px max-content;
    //
    //    @media only screen and (min-width: $breakpoint-sm-min) {
    //        grid-template:
    //                'a b'
    //                'a c' auto / 16px max-content;
    //    }
    //}

    &__gas-icon-container {
        display: flex;
        align-items: center;
    }

    &__gas-text {
        display: flex;
        align-items: center;
        gap: 4px;
        flex-shrink: 0;

        @media only screen and (min-width: $breakpoint-sm-min) {
            flex-direction: column;
            align-items: flex-start;
            gap: 0;
        }
    }

    &__mobile-tx-link {
        flex: 1 1 100%;
        text-align: right;
    }
}
</style>
