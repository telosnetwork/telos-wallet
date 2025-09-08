<script setup lang="ts">
import AppPage from 'components/evm/AppPage.vue';
import SmartAccountsPageHeader from 'pages/evm/smart-accounts/SmartAccountsPageHeader.vue';
import ViewAccountTab from 'pages/evm/smart-accounts/ViewAccountTab.vue';
import CreateAccountTab from 'pages/evm/smart-accounts/CreateAccountTab.vue';

const tabs = ['view', 'create'];
</script>

<template>
<AppPage :tabs="tabs">
    <template v-slot:header>
        <SmartAccountsPageHeader />
    </template>

    <template v-slot:view>
        <ViewAccountTab />
    </template>

    <template v-slot:create>
        <CreateAccountTab />
    </template>
</AppPage>
</template>

<style lang="scss">

</style>
