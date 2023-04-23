<script lang="ts">
import { defineComponent } from 'vue';
import AppPage from 'components/evm/AppPage.vue';
import { useGlobalStore } from 'src/stores';

const global = useGlobalStore();

export default defineComponent({
    name: 'SendPage',
    components: {
        AppPage,
    },
    mounted() {
        global.setHeaderBackBtn(true);
    },
});
</script>

<template>
<AppPage>
    <p class="text-black">Send page</p>
</AppPage>
</template>

<style lang="scss">

</style>
