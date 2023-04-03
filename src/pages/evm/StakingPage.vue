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
        <p>stake page header stuff</p>
    </template>

    <template v-slot:stake>
        <p>stake tab</p>
    </template>

    <template v-slot:unstake>
        <p>unstake tab</p>
    </template>

    <template v-slot:withdraw>
        <p>withdraw tab</p>
    </template>
</AppPage>
</template>

<style lang="scss">

</style>
