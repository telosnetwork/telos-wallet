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
    /*
    Wrap your TLOS to wTELOS for seamless integration with DeFi platforms,
    improved compatibility with ERC-20 tokens, and cross-chain interoperability.
    Unlock new opportunities and financial services by converting your native
    TLOS into the versatile wTELOS token.
    */
    const header = $t('evm_wrap.wrap_sidebar_title', { symbol: systemTokenSymbol });
    const content = [{
        text: $t(
            'evm_wrap.wrap_sidebar_content_fragment_1',
            { systemSymbol: systemTokenSymbol, wrappedSymbol: wrappedTokenSymbol },
        ),
    }, {
        text: $t('evm_wrap.wrap_sidebar_content_fragment_bold'),
        bold: true,
    }, {
        text: $t(
            'evm_wrap.wrap_sidebar_content_fragment_3',
            { systemSymbol: systemTokenSymbol, wrappedSymbol: wrappedTokenSymbol },
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
    test
</EVMSidebarPage>
</template>

<style lang="scss">
</style>
