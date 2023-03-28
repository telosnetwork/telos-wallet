<script lang="ts">
import { defineComponent } from 'vue';
import AppPage from 'components/evm/AppPage.vue';

export default defineComponent({
    name: 'WalletPage',
    components: {
        AppPage,
    },
});
</script>

<template>
<q-page>
    <AppPage>
        <template v-slot:header>
            <p class="text-black">wallet page header stuff</p>
        </template>
        <template v-slot:body>
            <p class="text-black">wallet page body stuff</p>
        </template>
    </AppPage>
</q-page>
</template>

<style lang="scss">

</style>
