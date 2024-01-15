<script setup lang="ts">
import { RampInstantSDK, RampInstantEvents, RampInstantEventTypes, RampInstantWidgetVariantTypes } from '@ramp-network/ramp-instant-sdk';
import { useChainStore } from 'src/antelope';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';

const chainSettings = useChainStore().currentChain.settings as EVMChainSettings;

const widgetParams = {
    hostAppName: 'Telos Demo',
    hostLogoUrl: 'https://raw.githubusercontent.com/telosnetwork/token-list/main/logos/telos.png',
    hostApiKey: '55wtuyuew2zyawyxnw2gv6aubuypn4vq7mbwfxz9',
    url: 'https://app.demo.ramp.network',
    variant: 'auto' as RampInstantWidgetVariantTypes,
};

function showRampSdk() {
    chainSettings.trackAnalyticsEvent('Ramp - Opened Widget');
    new RampInstantSDK(widgetParams).on('*', (event: RampInstantEvents) => {
        console.log(event);

        if (event.type === RampInstantEventTypes.WIDGET_CLOSE) {
            chainSettings.trackAnalyticsEvent('Ramp - Closed Widget');
        } else if (event.type === RampInstantEventTypes.PURCHASE_CREATED) {
            chainSettings.trackAnalyticsEvent('Ramp - Purchase Created');
        }
    }).show();
}
</script>

<template>
<button @click="showRampSdk">Show Ramp</button>
</template>
