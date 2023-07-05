<script setup lang="ts">
import AppNav from 'components/evm/AppNav.vue';
// TODO: fixme - let's think about alternatives to this.
// This is related to switchChainInjected() in evm.ts:260 -> window.removeEventListener('focus', checkNetwork);
// ------------------------
// import { onMounted } from 'vue';
// import { checkNetwork } from 'src/antelope/stores/utils/checkNetwork';
// onMounted(() => {
//     window.addEventListener('focus', checkNetwork);
// });
// ------------------------
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
