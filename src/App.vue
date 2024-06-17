<script lang="ts">
import { getAntelope, useChainStore } from 'src/antelope';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { TELOS_CHAIN_IDS } from 'src/antelope/chains/chain-constants';
import packageInfo from '../package.json';
import { defineComponent } from 'vue';

export default defineComponent({
    name: 'App',
    created() {
        const appVersionJustUpdated = 'UPDATED_NOTIFY_USER';
        const userIsNew = !localStorage.getItem('account');
        const currentVersion = packageInfo.version;
        const clientVersion = localStorage.getItem('appVersion');
        console.info('Wallet version: ', packageInfo.version);

        if (clientVersion !== currentVersion) {
            if (clientVersion && clientVersion !== appVersionJustUpdated) {
                console.info('Client version: ', clientVersion);
            }

            // when localstorage is cleared, we need to reload the page for it to take effect.
            // however if we immediately reload the page here we cannot show a notification to the user.
            // so the const appVersionUpdated lets us know after the reload that we just cleared the old localStorage
            // and need to notify the user that they need to log in again
            if (clientVersion === appVersionJustUpdated) {
                console.info('App version mismatch, local storage cleared');
                // App version was updated, localStorage was cleared, and the page reloaded
                // Now inform the user that the app was updated & have them login again, and set the client app version
                localStorage.setItem('appVersion', currentVersion);
                (this as any).$notifySuccessMessage(
                    (this as any).$t('global.new_app_version'),
                );
            } else if (userIsNew) {
                localStorage.clear();
                localStorage.setItem('appVersion', currentVersion);
            } else {
                localStorage.clear();
                localStorage.setItem('appVersion', appVersionJustUpdated);
                window.location.reload();
            }
        }
    },
    mounted() {

        // Telos Wallet allows users to switch between Telos Zero and Telos EVM.
        // The loading of this script should be independent of the chain the user is on.
        const script = document.createElement('script');
        script.src = 'https://cdn.usefathom.com/script.js';
        script.dataset.site = 'ISPYEAKT';
        script.dataset.spa = 'auto';
        script.defer = true;
        document.body.appendChild(script);
    },
});
</script>

<template>
<router-view />
</template>
