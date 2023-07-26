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
const isMobile = computed(() => $q.screen.lt.md);
const isLarge = computed(() => $q.screen.gt.md);

// methods
function handleExpansionItemUpdate() {
    if (!isMobile.value) {
        expansionItemModel.value = true;
    } else {
        expansionItemModel.value = !expansionItemModel.value;
    }
}
</script>

<template>
<div class="c-sidebar-page">
    <div class="c-sidebar-page__sidebar-container">
        <q-expansion-item
            :model-value="expansionItemModel || isLarge"
            :label="sidebarContent.header"
            :expand-icon="isMobile ? 'expand_more' : 'none'"
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
    </div>
    <div class="c-sidebar-page__body-container">
        <slot></slot>
    </div>
</div>
</template>

<style lang="scss">
.c-sidebar-page {
    display: grid;

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
        }
    }

    &__body-container {
        grid-area: b;
    }

    &__expansion-item {
        border-radius: 4px;
        border: 2px solid var(--header-bg-color);
        margin-bottom: 8px;

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
                background-color: var(--accent-color-2);
            }
        }
    }
}
</style>
