<script setup lang="ts">
import { ref } from 'vue';
import { directive as vClickAway } from 'vue3-click-away';

import InlineSvg from 'vue-inline-svg';
const infoIcon = require('src/assets/icon--info.svg');
const warningIcon = require('src/assets/icon--warning.svg');

const props = defineProps<{
    text?: string,
    warnings?: string[],
    hideIcon?: boolean,
}>();

let tooltipEnabled = ref(false);

function setTooltipVisibility(enable: boolean) {
    tooltipEnabled.value = enable;
}
</script>

<template>
<div
    v-click-away="() => setTooltipVisibility(false)"
    :class="{
        'c-tooltip': true,
        'c-tooltip--dynamic-size': $slots.default
    }"
    @mouseenter="setTooltipVisibility(true)"
    @mouseleave="setTooltipVisibility(false)"
    @touchend="setTooltipVisibility(!tooltipEnabled)"
>
    <slot></slot>
    <InlineSvg
        v-if="!hideIcon"
        :src="infoIcon"
        class="c-tooltip__icon"
        aria-hidden="true"
    />
    <q-tooltip
        :model-value="tooltipEnabled"
        v-bind="{ ...$attrs }"
        transition-show="scale"
        transition-hide="scale"
        class="c-tooltip__tooltip"
        @update:model-value="() => {}"
    >
        <div class="c-tooltip__text-container">
            <div
                v-for="warning in (warnings ?? [])"
                :key="warning"
                class="c-tooltip__warning-container"
            >
                <InlineSvg
                    :src="warningIcon"
                    class="c-tooltip__icon c-tooltip__icon--warning"
                    aria-hidden="true"
                />

                <span class="c-tooltip__text">
                    {{ warning }}
                </span>
            </div>

            <span v-if="text" class="c-tooltip__text">
                {{ text }}
            </span>
        </div>

    </q-tooltip>
</div>
</template>

<style lang="scss">
.c-tooltip {
    display: inline-flex;
    height: 24px;
    width: 24px;
    justify-content: center;
    align-items: center;
    gap: 4px;

    &--dynamic-size {
        width: unset;
        height: unset;
        justify-content: unset;
    }

    &__icon {
        height: 14px;

        path {
            fill: var(--q-accent);
        }

        &--warning {
            path {
                fill: white;
            }
        }
    }

    &__text-container {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    &__warning-container {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    &__text {
        @include text--small-bold;
        white-space: pre-line;
    }
}

// quasar override
.q-tooltip {
    // equivalent to --site-gradient (with some alpha), defined here because the quasar tooltip component
    // moves the tooltip element to be a sibling of <body>, where our CSS vars are defined
    background: var(--toolbar-background-color);
}
</style>
