<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { useChainStore } from 'src/antelope';

import EVMSidebarPage from 'src/layouts/EVMSidebarPage.vue';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';

const { t: $t } = useI18n();
const chainSettings = useChainStore().currentChain.settings as EVMChainSettings;
const systemTokenSymbol = chainSettings.getSystemToken().symbol;
const wrappedTokenSymbol = chainSettings.getWrappedSystemToken().symbol;


// computed
const sidebarContent = computed(() => {
    const header = $t('evm_wrap.unwrap_sidebar_title', { symbol: systemTokenSymbol });
    const content = [{
        text: $t(
            'evm_wrap.unwrap_sidebar',
            { wrappedSymbol: wrappedTokenSymbol, systemSymbol: systemTokenSymbol },
        ),
    }];

    return {
        header,
        content,
    };
});

</script>

<template>
<EVMSidebarPage :sidebar-content="sidebarContent">
    {{ 'test '.repeat(300) }}
    {{ 'test'.repeat(300) }}
</EVMSidebarPage>
</template>

<style lang="scss">
</style>
