<script setup lang="ts">
import AppPage from 'components/evm/AppPage.vue';
import StakingPageHeader from 'pages/evm/staking/StakingPageHeader.vue';

const tabs = ['stake', 'unstake', 'withdraw'];
</script>

<template>
<AppPage :tabs="tabs">
    <template v-slot:header>
        <StakingPageHeader />
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




