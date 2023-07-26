<script setup lang="ts">
import { computed, ref } from 'vue';
import { is, useQuasar } from 'quasar';


interface SidebarProps {
    header: string;
    content: { text: string; bold: boolean; }[];
}

const $q = useQuasar();

const props = defineProps<{
    sidebarContent: SidebarProps;
}>();

//data
const expansionItemModel = ref(true);

// computed
const isMobile = computed(() => $q.screen.lt.sm);

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
            :model-value="expansionItemModel"
            :label="sidebarContent.header"
            :expand-icon="isMobile ? 'expand_more' : 'none'"
            class="c-sidebar-page__expansion-item"
            @update:model-value="handleExpansionItemUpdate"
        >
            <q-card>
                <q-card-section>
                    <span
                        v-for="(text, index) in sidebarContent.content"
                        :key="`text-fragment-${index}`"
                        :class="{ 'o-text--paragraph-bold': text.bold }"
                    >
                        {{ text.text }}&nbsp;
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

    @include sm-and-up {
        grid-template: 'a b .';
    }

    &__sidebar-container {
        grid-area: a;
    }

    &__body-container {
        grid-area: b;
    }

    &__expansion-item {
        border-radius: 4px;
        border: 1px solid var(--header-item-outline-color);
        margin-bottom: 8px;

        // quasiar overrides
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
                background-color: var(--link-color);
            }
        }
    }
}
</style>
