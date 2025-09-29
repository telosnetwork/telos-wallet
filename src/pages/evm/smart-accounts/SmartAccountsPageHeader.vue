<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t: $t } = useI18n();
</script>

<template>
<div class="c-smart-accounts-header">
    <div class="text-center">
        <h5>Smart Accounts</h5>
        <h1 class="u-text--high-contrast">Manage Your Smart Wallets</h1>
        <p class="u-text--low-contrast q-mb-xl">
            <span class="o-text--small-bold">
                Create or connect programmable wallets for advanced features
            </span>
        </p>
    </div>
</div>
</template>

<style lang="scss">
.c-smart-accounts-header {
    width: 100%;
}
</style>
