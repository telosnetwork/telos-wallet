<script setup lang="ts">
import AppPage from 'components/evm/AppPage.vue';
import WrapPageHeader from 'pages/evm/wrap/WrapPageHeader.vue';
import WrapTab from 'pages/evm/wrap/WrapTab.vue';
import UnwrapTab from 'pages/evm/wrap/UnwrapTab.vue';

const tabs = ['wrap', 'unwrap'];
</script>

<template>
<AppPage :tabs="tabs">
    <template v-slot:header>
        <WrapPageHeader />
    </template>

    <template v-slot:wrap>
        <WrapTab />
    </template>

    <template v-slot:unwrap>
        <UnwrapTab />
    </template>
</AppPage>
</template>

<style lang="scss">

</style>
