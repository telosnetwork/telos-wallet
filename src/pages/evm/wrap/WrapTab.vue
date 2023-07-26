<script setup lang="ts">
import { computed } from 'vue';

import EVMSidebarPage from 'src/layouts/EVMSidebarPage.vue';


const sidebarContent = computed(() => {
    const header = 'Why wrap TLOS?'; // eztodo make chain independent, i18n
    const content = [{ text: 'test text here', bold: false }, { text: 'bold text here', bold: true }, { text: 'more non bold text here', bold: false }];

    return {
        header,
        content,
    };
});

</script>

<template>
<EVMSidebarPage :sidebar-content="sidebarContent">
    test
</EVMSidebarPage>
</template>

<style lang="scss">
</style>
