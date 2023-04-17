<script lang="ts">
import { defineComponent, PropType } from 'vue';
import InlineSvg from 'vue-inline-svg';
import ExternalLink from 'components/ExternalLink.vue';
import TimeStamp from 'components/TimeStamp.vue';
import { ShapedTransactionRow } from 'src/antelope/types';

const arrowIcon = require('src/assets/icon--arrow-diagonal.svg');
const swapIcon = require('src/assets/icon--swap-diagonal.svg');
const contractIcon = require('src/assets/icon--contract.svg');

export default defineComponent({
    name: 'WalletTransactionRow',
    components: {
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
            return this.transaction.actionName;
        },
        interactionIcon(): string {
            if (this.actionName === 'swapTokensForExactTokens') {
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
            // on mobile, the second line of text is never shown
            // on desktop, if the action has descriptive text, the second line is the name of the action
            //             otherwise, it is a link to the address/account that was interacted with
            return !['send', 'receive'].includes(this.transaction.actionName);
        },
        actionHasDescriptiveText(): boolean {
            // only true for 'known actions' send, receive, and swapExactTokensForTokens
            return ['send', 'receive', 'swapTokensForExactTokens'].includes(this.transaction.actionName);
        },
        actionDescriptiveText(): string {
            // eztodo make i18n
            switch (this.transaction.actionName) {
            case 'send':
                return 'Sent';
            case 'receive':
                return 'Received';
            case 'swapTokensForExactTokens':
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
            case 'swapTokensForExactTokens':
                return 'with';
            default:
                return '';
            }
        },
        interactedWithText(): string {
            if (this.transaction.actionName === 'receive') {
                return this.transaction.fromPrettyName || this.transaction.from;
            } else {
                return this.transaction.toPrettyName || this.transaction.to;
            }
        },
        interactedWithUrl(): string {
            // eztodo switch to use get explorer url
            return `www.teloscan.io/address/${this.interactedWithText}`;
        },
    },
});
</script>

<template>
<div class="c-transaction-row">
    <div class="c-transaction-row__info-container c-transaction-row__info-container--first">
        <div class="c-transaction-row__interaction-info">
            <div class="c-transaction-row__interaction-icon-container">
                <InlineSvg
                    :src="interactionIcon"
                    :class="{
                        'c-transaction-row__interaction-icon': true,
                        'c-transaction-row__interaction-icon--rotated': rotateIcon,
                    }"
                    height="12"
                    aria-hidden="true"
                />
            </div>

            <div class="c-transaction-row__interaction-text-container">
                <div class="c-transaction-row__primary-interaction-text">
                    <template v-if="actionHasDescriptiveText">
                        <span class="c-transaction-row__action-description">
                            {{ actionDescriptiveText }}
                        </span>&nbsp;
                        <span class="c-transaction-row__interaction-nowrap">
                            {{ actionPrepositionText }}&nbsp;
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
                    <span v-if="actionName === 'swapTokensForExactTokens' && $q.screen.gt.xs">
                        swapTokensForExactTokens
                    </span>
                    <ExternalLink
                        v-else-if="!actionDescriptiveText"
                        :text="interactedWithText"
                        :url="interactedWithUrl"
                    />
                </div>
            </div>

            <div class="c-transaction-row__timestamp">
                <TimeStamp :timestamp="transaction.epoch" :muted="true" />
            </div>
        </div>
    </div>

    <div class="c-transaction-row__info-container c-transaction-row__info-container--second">

    </div>

    <div class="c-transaction-row__info-container c-transaction-row__info-container--third">

    </div>
</div>
</template>

<style lang="scss">
.c-transaction-row {
    padding: 16px 8px;
    border-bottom: 2px solid $page-header;

    &__info-container {
        &--first {

        }

        &--second {

        }

        &--third {

        }
    }

    &__interaction-info {
        display: grid;
        grid-template-columns: min-content minmax(0, 1fr) max-content;
        gap: 8px;
        max-width: 100%;
        //flex-direction: row;
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
    }
}
</style>
