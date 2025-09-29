<script setup lang="ts">
import AppPage from 'components/evm/AppPage.vue';
import SmartAccountsPageHeader from 'pages/evm/smart-accounts/SmartAccountsPageHeader.vue';
import ViewAccountTab from 'pages/evm/smart-accounts/ViewAccountTab.vue';
import TransactAccountTab from 'pages/evm/smart-accounts/TransactAccountTab.vue';
import CreateAccountTab from 'pages/evm/smart-accounts/CreateAccountTab.vue';
import UserOpsTab from 'pages/evm/smart-accounts/UserOpsTab.vue';

const tabs = ['view', 'transact', 'create', 'userops'];
</script>

<template>
<AppPage :tabs="tabs">
    <template v-slot:header>
        <SmartAccountsPageHeader />
    </template>

    <template v-slot:view>
        <ViewAccountTab />
    </template>

    <template v-slot:transact>
        <TransactAccountTab />
    </template>

    <template v-slot:create>
        <CreateAccountTab />
    </template>

    <template v-slot:userops>
        <UserOpsTab />
    </template>
</AppPage>
</template>

<style lang="scss">

</style>
