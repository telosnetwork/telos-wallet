<script lang="ts">
import { useChainStore } from 'src/antelope';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { TELOS_CHAIN_IDS } from 'src/antelope/chains/chain-constants';
import packageInfo from '../package.json';

export default {
    name: 'App',
    created() {
        const appVersionJustUpdated = 'UPDATED_NOTIFY_USER';
        const currentVersion = packageInfo.version;
        const clientVersion = localStorage.getItem('appVersion');

        console.info('Wallet version: ', packageInfo.version);

        if (clientVersion && clientVersion !== appVersionJustUpdated) {
            console.info('Client version: ', clientVersion);
        }

        if (clientVersion === appVersionJustUpdated) {
            console.info('App version mismatch, local storage cleared');
            // App version was updated, localStorage was cleared, and the page reloaded
            // Now inform the user that the app was updated & have them login again, and set the client app version
            localStorage.setItem('appVersion', currentVersion);
            (this as any).$notifySuccessMessage(
                (this as any).$t('global.new_app_version'),
            );
        } else if (clientVersion && clientVersion !== currentVersion) {
            localStorage.clear();
            localStorage.setItem('appVersion', appVersionJustUpdated);
            window.location.reload();
        } else if (!clientVersion) {
            localStorage.setItem('appVersion', currentVersion);
        }
    },
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
