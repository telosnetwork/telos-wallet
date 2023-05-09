<script lang="ts">
import { defineComponent } from 'vue';
import AppNav from 'components/evm/AppNav.vue';

export default defineComponent({
    name: 'EVMLayout',
    components: {
        AppNav,
    },
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

    @media only screen and (min-width: $breakpoint-md-min) {
        // offset content for desktop menu
        margin-left: 300px;
        width: calc(100% - 300px);
        max-width: calc(100vw - 300px);
    }
}
</style>
