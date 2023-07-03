<script lang="ts">
import { defineComponent } from 'vue';
import AppPage from 'components/evm/AppPage.vue';
import WrapPageHeader from 'pages/evm/wrap/WrapPageHeader.vue';

export default defineComponent({
    name: 'WrapPage',
    components: {
        AppPage,
        WrapPageHeader,
    },
    data: () => ({
        tabs: ['wrap', 'unwrap'],
    }),

});
</script>

<template>
<AppPage :tabs="tabs">
    <template v-slot:header>
        <WrapPageHeader />
    </template>

    <template v-slot:wrap>
        <p>wrap tab</p>
    </template>

    <template v-slot:unwrap>
        <p>unwrap tab</p>
    </template>
</AppPage>
</template>

<style lang="scss">

</style>
