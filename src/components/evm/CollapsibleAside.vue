<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
    header: string;
    content: { text: string; bold?: boolean; }[];
    alwaysOpen?: boolean, // if true, the expansion item will always be open with no toggle
    centerOnDesktop?: boolean, // if true, the aside will be centered on large screens (default is off to the side)
}>();

// data
const expansionItemModel = ref(false);

// methods
function handleExpansionItemUpdate() {
    if (props.alwaysOpen) {
        expansionItemModel.value = true;
    } else {
        expansionItemModel.value = !expansionItemModel.value;
    }
}
</script>

<template>
<aside
    :class="{
        'c-collapsible-aside': true,
        'c-collapsible-aside--always-open': alwaysOpen,
        'c-collapsible-aside--centered': centerOnDesktop,
    }"
>
    <q-expansion-item
        :model-value="expansionItemModel || alwaysOpen"
        :label="header"
        :toggle-aria-label="$t('global.toggle', { text: header })"
        :expand-icon="alwaysOpen ? 'none' : 'expand_more'"
        class="c-collapsible-aside__expansion-item"
        @update:model-value="handleExpansionItemUpdate"
    >
        <q-card>
            <q-card-section>
                <span
                    v-for="(data, index) in content"
                    :key="`text-fragment-${index}`"
                    :class="{ 'o-text--paragraph-bold': data.bold }"
                >
                    {{ data.text }}
                </span>
            </q-card-section>
        </q-card>
    </q-expansion-item>
</aside>
</template>

<style lang="scss">
.c-collapsible-aside {
    &--always-open {
        .q-item.q-item-type {
            pointer-events: none;
        }
    }

    &--centered {
        @include md-and-up {
            display: flex;
            justify-content: center;
        }
    }

    &__expansion-item {
        border-radius: 4px;
        border: 2px solid var(--border-color);
        margin-bottom: 8px;
        height: fit-content;

        @include sm-and-up {
            width: 350px;
            max-width: 100%;
        }

        // quasar overrides
        .q-item__label {
            @include text--header-4;
        }

        .q-item.q-item-type {
            position: relative;

            &::after {
                content: ' ';
                margin: auto;
                position: absolute;
                right: 0;
                bottom: 8px;
                left: 0;
                width: calc(100% - 30px);
                height: 1px;
                background-color: var(--accent-color-4);
            }
        }
    }
}
</style>
