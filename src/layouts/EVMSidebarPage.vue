<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';


interface SidebarProps {
    header: string;
    content: { text: string; bold?: boolean; }[];
}

const $q = useQuasar();

const props = defineProps<{
    sidebarContent: SidebarProps;
}>();

// data
const expansionItemModel = ref(false);

// computed
const isStacked = computed(() => $q.screen.lt.lg);
const isLarge = computed(() => $q.screen.gt.md);

// methods
function handleExpansionItemUpdate() {
    if (!isStacked.value) {
        expansionItemModel.value = true;
    } else {
        expansionItemModel.value = !expansionItemModel.value;
    }
}
</script>

<template>
<div class="c-sidebar-page q-mb-xl">
    <aside class="c-sidebar-page__sidebar-container">
        <q-expansion-item
            :model-value="expansionItemModel || isLarge"
            :label="sidebarContent.header"
            :toggle-aria-label="$t('global.toggle', { text: sidebarContent.header })"
            :expand-icon="isStacked ? 'expand_more' : 'none'"
            class="c-sidebar-page__expansion-item"
            @update:model-value="handleExpansionItemUpdate"
        >
            <q-card>
                <q-card-section>
                    <span
                        v-for="(content, index) in sidebarContent.content"
                        :key="`text-fragment-${index}`"
                        :class="{ 'o-text--paragraph-bold': content.bold }"
                    >
                        {{ content.text }}
                    </span>
                </q-card-section>
            </q-card>
        </q-expansion-item>
    </aside>
    <div class="c-sidebar-page__body-container">
        <slot></slot>
    </div>
</div>
</template>

<style lang="scss">
.c-sidebar-page {
    display: grid;
    gap: 24px;

    grid-template: 'a'
                   'b';

    @include lg-and-up {
        grid-template: 'a b .';
        grid-template-columns: 1fr 1fr 1fr;
    }

    &__sidebar-container {
        grid-area: a;

        @include sm-and-up {
            margin: auto;
        }

        @include lg-and-up {
            margin: unset;
            display: flex;
            justify-content: center;
        }
    }

    &__body-container {
        grid-area: b;
        word-break: break-all;
        max-width: 1000px;
        width: 100%;
        margin: auto;

        @include lg-and-up {
            margin: unset;
        }
    }

    &__expansion-item {
        border-radius: 4px;
        border: 1px solid var(--accent-color-3);
        margin-bottom: 8px;
        height: fit-content;

        @include sm-and-up {
            width: 350px;
            max-width: 100%;
        }

        // quasiar overrides
        .q-item__label {
            @include text--header-4;
        }

        .q-item.q-item-type {
            position: relative;

            @include lg-and-up {
                pointer-events: none;
            }

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
