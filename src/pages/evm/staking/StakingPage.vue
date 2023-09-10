<script setup lang="ts">
import AppPage from 'components/evm/AppPage.vue';
import StakingPageHeader from 'pages/evm/staking/StakingPageHeader.vue';
import StakingTab from 'pages/evm/staking/StakingTab.vue';
import UnstakingTab from 'pages/evm/staking/UnstakingTab.vue';
import WithdrawTab from 'pages/evm/staking/WithdrawTab.vue';

const tabs = ['stake', 'unstake', 'withdraw'];
</script>

<template>
<AppPage :tabs="tabs">
    <template v-slot:header>
        <StakingPageHeader />
    </template>

    <template v-slot:stake>
        <StakingTab />
    </template>

    <template v-slot:unstake>
        <UnstakingTab />
    </template>

    <template v-slot:withdraw>
        <WithdrawTab />
    </template>
</AppPage>
</template>

<style lang="scss">

</style>




