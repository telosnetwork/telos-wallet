<script lang="ts">
import { useChainStore } from 'src/antelope';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { TELOS_CHAIN_IDS } from 'src/antelope/chains/chain-constants';

export default {
    name: 'App',
    mounted() {
        const chainSettings = useChainStore().currentChain.settings as EVMChainSettings;

        // if the organization using this application is Telos, import Fathom analytics
        if (TELOS_CHAIN_IDS.includes(chainSettings.getChainId())) {
            const script = document.createElement('script');
            script.src = 'https://cdn.usefathom.com/script.js';
            script.dataset.site = 'ISPYEAKT';
            script.defer = true;
            document.body.appendChild(script);
        }
    },
};
</script>

<template>
<router-view />
</template>
