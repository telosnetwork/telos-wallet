<script lang="ts">
import { defineComponent } from 'vue';
import InlineSvg from 'vue-inline-svg';
import ExternalLink from 'components/ExternalLink.vue';
import TimeStamp from 'components/TimeStamp.vue';

const receiveIcon = require('src/assets/icon--arrow-diagonal.svg');

export default defineComponent({
    name: 'WalletTransactionRow',
    components: {
        TimeStamp,
        ExternalLink,
        InlineSvg,
    },
    data: () => ({
        // eztodo development aids, delete when done
        tempInteractedWithText: '0x'.concat('1'.repeat(40)),
        tempActionDescriptiveText: 'Received',
        tempActionPrepositionText: 'from',
        tempShowSecondaryInteractionText: true,
        tempActionName: 'swapExactTokensForTokens',
    }),
    computed: {
        actionName(): string {
            return this.tempActionName;
        },
        interactionIcon() {
            return receiveIcon;
        },
        showInteractionSecondaryText(): boolean {
            return this.tempShowSecondaryInteractionText;
        },
        actionHasDescriptiveText(): boolean {
            return !!this.actionDescriptiveText;
        },
        actionDescriptiveText(): string {
            return this.tempActionDescriptiveText;
        },
        actionPrepositionText(): string {
            return this.tempActionPrepositionText;
        },
        interactedWithText(): string {
            return this.tempInteractedWithText;
        },
        interactedWithUrl(): string {
            return `www.teloscan.io/address/${this.interactedWithText}`;
        },
        timestamp() {
            return 1671100800;
        },
    },
});
</script>

<template>
<div class="c-transaction-row">
    <div class="c-transaction-row__info-container c-transaction-row__info-container--first">
        <div class="c-transaction-row__interaction-info">
            <!--
                icon

                text container (stack on mobile, one line on desktop iff actionHasDescriptiveText)
                    primary text
                        if actionHasDescriptiveText
                            bold, not a link
                        else
                            link to address/name
                    secondary text v-if="showInteractionSecondaryText" (hide if desktop && action is send/receive)
                        if actionHasDescriptiveText
                            preposition text e.g. "With" / "from"
                            link to address/name
                        else
                            action name

                timestamp
            -->
            <InlineSvg
                :src="interactionIcon"
                class="c-transaction-row__interaction-icon"
                height="12"
                aria-hidden="true"
            />

            <div class="c-transaction-row__interaction-text-container">
                <div class="c-transaction-row__primary-interaction-text">
                    <span v-if="actionHasDescriptiveText" class="c-transaction-row__action-description">
                        {{ actionDescriptiveText }}
                    </span>
                    <ExternalLink
                        v-else
                        :text="interactedWithText"
                        :url="interactedWithUrl"
                    />
                </div>

                <div v-if="showInteractionSecondaryText" class="c-transaction-row__secondary-interaction-text">
                    <template v-if="actionHasDescriptiveText">
                        {{ actionPrepositionText }}
                        <ExternalLink
                            :text="interactedWithText"
                            :url="interactedWithUrl"
                        />
                    </template>
                    <template v-else>
                        {{ actionName }}
                    </template>
                </div>
            </div>

            <div class="c-transaction-row__timestamp">
                <TimeStamp :timestamp="timestamp" />
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
        grid-template-columns: min-content max-content 1fr;
        //flex-direction: row;
    }

    &__interaction-icon {

    }

    &__interaction-text-container {

    }

    &__primary-interaction-text {

    }

    &__action-description {

    }

    &__secondary-interaction-text {
        width: max-content;
    }

    &__timestamp {
        display: flex;
        align-items: center;
        justify-content: flex-end;
    }
}
</style>
