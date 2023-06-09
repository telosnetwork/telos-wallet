<script setup lang="ts">
import AppPage from 'components/evm/AppPage.vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const meta = route.meta;
</script>

<template>
<AppPage>
    <div>NFT Details Page</div>
    <div>{{ meta }}</div>
</AppPage>
</template>

<style lang="scss">

</style>
