<script lang="ts">
import { defineComponent } from 'vue';

import AppPage from 'components/evm/AppPage.vue';

export default defineComponent({
    name: 'StakingPage',
    components: {
        AppPage,
    },
    data: () => ({
        tabs: ['stake', 'unstake', 'withdraw'],
    }),

});
</script>

<template>
<AppPage :tabs="tabs">
    <template v-slot:header>
        <p class="text-black">stake page header stuff</p>
    </template>

    <template v-slot:stake>
        <p class="text-black">stake tab</p>
    </template>

    <template v-slot:unstake>
        <p class="text-black">unstake tab</p>
    </template>

    <template v-slot:withdraw>
        <p class="text-black">withdraw tab</p>
    </template>
</AppPage>
</template>

<style lang="scss">

</style>
