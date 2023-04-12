<script lang="ts">
import { defineComponent } from 'vue';
import AppPage from 'components/evm/AppPage.vue';

export default defineComponent({
    name: 'SendPage',
    components: {
        AppPage,
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
