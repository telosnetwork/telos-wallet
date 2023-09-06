<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';
import { debounce } from 'quasar';

import { usePlatformStore } from 'src/antelope';

import AppNav from 'components/evm/AppNav.vue';

const platformStore = usePlatformStore();

const resizeListener = debounce(() => {
    platformStore.setEvmMenuIsCollapsed(window.innerWidth < 1024);
}, 100);

onMounted(() => {
    resizeListener();
    window.addEventListener('resize', resizeListener);
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', resizeListener);
});
</script>

<template>
<q-layout view="hHh lpr fff" class="c-evm-layout">
    <q-page-container>
        <AppNav />
        <router-view />
    </q-page-container>
</q-layout>
</template>

<style lang="scss">
.c-evm-layout {
    // offset content for fixed header
    margin-top: 64px;

    @include md-and-up {
        // offset content for desktop menu
        margin-left: 300px;
        width: calc(100% - 300px);
        max-width: calc(100vw - 300px);
    }
}
</style>
