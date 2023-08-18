<script setup lang="ts">
import ToolTip from 'components/ToolTip.vue';

const props = defineProps<{
    cards: {
        label: string;
        tooltip?: string;
        primaryText?: string;
        secondaryText?: string;
        lowContrastSecondaryText?: boolean;
        useSmallBox?: boolean;
    }[];
}>();
</script>

<template>
<div class="c-scrollable-info-cards">
    <div
        v-for="(card, index) in cards"
        :key="`card-${index}`"
        :class="{
            'c-scrollable-info-cards__card': true,
            'c-scrollable-info-cards__card--small': !!card.useSmallBox,
        }"
    >
        <div class="c-scrollable-info-cards__card-header">
            <h5 class="u-text--low-contrast">
                {{ card.label }}
            </h5>

            <ToolTip
                v-if="card.tooltip"
                :text="card.tooltip"
                class="c-scrollable-info-cards__card-header-tooltip"
            />
        </div>

        <h3>{{ card.primaryText }}</h3>
        <span
            v-if="card.secondaryText"
            :class="{
                'u-text--low-contrast': card.lowContrastSecondaryText
            }"
        >
            {{ card.secondaryText }}
        </span>
    </div>
</div>
</template>

<style lang="scss">
.c-scrollable-info-cards {
    display: flex;
    gap: 24px;
    flex-direction: row;
    max-width: 100%;
    overflow-x: scroll;
    -ms-overflow-style: none;
    scrollbar-width: none;

    &::-webkit-scrollbar {
        display: none;
    }

    @include sm-and-up {
        width: max-content;
        margin: auto;
    }

    &__card {
        background-color: var(--bg-color);
        padding: 12px;
        border-radius: 4px;
        border: 2px solid var(--header-item-outline-color);
        width: 220px;
        flex-shrink: 0;
        @include sm-and-up {
            width: 300px;
            &--small {
                width: 220px;
            }
        }
    }

    &__card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 4px;
    }
}
</style>
