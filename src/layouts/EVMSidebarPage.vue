<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';

import CollapsibleAside from 'components/evm/CollapsibleAside.vue';

interface SidebarProps {
    header: string;
    content: { text: string; bold?: boolean; }[];
}

const $q = useQuasar();

const props = defineProps<{
    sidebarContent: SidebarProps;
}>();

// computed
const isLarge = computed(() => $q.screen.gt.md);
</script>

<template>
<div class="c-sidebar-page q-mb-xl">
    <CollapsibleAside
        :header="sidebarContent.header"
        :content="sidebarContent.content"
        :always-open="isLarge"
        class="c-sidebar-page__sidebar-container"
    />

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
}
</style>
