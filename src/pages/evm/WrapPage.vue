<script lang="ts">
import { defineComponent } from 'vue';
import AppPage from 'components/evm/AppPage.vue';

export default defineComponent({
    name: 'WrapPage',
    components: {
        AppPage,
    },
    data: () => ({
        tabs: ['wrap', 'unwrap'],
    }),

});
</script>

<template>
<AppPage :tabs="tabs">
    <template v-slot:header>
        <p class="text-black">wrap page header stuff</p>
    </template>

    <template v-slot:wrap>
        <p class="text-black">wrap tab</p>
    </template>

    <template v-slot:unwrap>
        <p class="text-black">unwrap tab</p>
    </template>
</AppPage>
</template>

<style lang="scss">

</style>
