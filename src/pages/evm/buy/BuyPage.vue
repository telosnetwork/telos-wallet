<script lang="ts" setup>
import AppPage from 'components/evm/AppPage.vue';
import { getAntelope, useAccountStore } from 'src/antelope';

const accountStore = useAccountStore();
const ant = getAntelope();

</script>

<template>
<AppPage>
    Option 1
    Option 2
</AppPage>
</template>

<style lang="scss">
</style>
