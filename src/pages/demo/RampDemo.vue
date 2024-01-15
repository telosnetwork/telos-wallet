<script setup lang="ts">
import {
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    ref,
} from 'vue';
import {
    RampInstantSDK,
    RampInstantEvents,
    RampInstantEventTypes,
    RampInstantWidgetVariantTypes,
} from '@ramp-network/ramp-instant-sdk';
import { debounce } from 'quasar';

import { useChainStore } from 'src/antelope';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';

const chainSettings = useChainStore().currentChain.settings as EVMChainSettings;

const widgetParams = {
    hostAppName: 'Telos Demo',
    hostLogoUrl: 'https://raw.githubusercontent.com/telosnetwork/token-list/main/logos/telos.png',
    hostApiKey: '55wtuyuew2zyawyxnw2gv6aubuypn4vq7mbwfxz9',
    url: 'https://app.demo.ramp.network',
};

const RAMP_MOBILE_BREAKPOINT = 895; // arbitrary breakpoint used by Ramp SDK

let overlayRampSdkInstance: RampInstantSDK | null = null;
let embeddedRampSdkInstance: RampInstantSDK | null = null;

// data
const isMobile = ref(false);
const purchaseId = ref('');
const purchaseToken = ref('');

// embedded widget will be re-instantiated when the window is resized, resulting in multiple embedded widgets.
// to prevent this, we use a key to force the embedded widget container to re-render with a new id
// (as the Ramp SDK takes the id of the container node as a parameter)
const embeddedContainerKey = ref(0);

// computed
const embeddedContainerId = computed(() => `ramp-widget-container-${embeddedContainerKey.value}`);

// methods
function showRampSdkOverlay() {
    if (overlayRampSdkInstance) {
        overlayRampSdkInstance.unsubscribe('*', () => {});
    }

    chainSettings.trackAnalyticsEvent('Ramp - Opened Widget');
    overlayRampSdkInstance = new RampInstantSDK({
        ...widgetParams,
        variant: 'auto' as RampInstantWidgetVariantTypes,
    }).on('*', (event: RampInstantEvents) => {
        if (event.type === RampInstantEventTypes.WIDGET_CLOSE) {
            chainSettings.trackAnalyticsEvent('Ramp - Closed Widget');
        } else if (event.type === RampInstantEventTypes.PURCHASE_CREATED) {
            chainSettings.trackAnalyticsEvent('Ramp - Purchase Created');
            purchaseId.value = event.payload.purchase.id;
            purchaseToken.value = event.payload.purchaseViewToken;
        }
    }).show();
}

const resizeHandler = debounce(() => {
    isMobile.value = window.innerWidth < RAMP_MOBILE_BREAKPOINT;
    embeddedContainerKey.value += 1;

    showRampSdkEmbedded();
}, 100);

function showRampSdkEmbedded() {
    nextTick(() => {
        if (embeddedRampSdkInstance) {
            embeddedRampSdkInstance.unsubscribe('*', () => {});
        }

        embeddedRampSdkInstance = new RampInstantSDK({
            ...widgetParams,
            variant: isMobile.value ? 'embedded-mobile' : 'embedded-desktop',
            containerNode: document.getElementById(embeddedContainerId.value) as HTMLElement,
        }).on('*', (event: RampInstantEvents) => {
            if (event.type === RampInstantEventTypes.WIDGET_CLOSE) {
                // the embedded widget shows a close button, but we always want the embedded widget to be visible
                // thus, when the user clicks the 'Exit' button, we re-instantiate the widget
                resizeHandler();
            } else if (event.type === RampInstantEventTypes.PURCHASE_CREATED) {
                chainSettings.trackAnalyticsEvent('Ramp - Purchase Created');
                purchaseId.value = event.payload.purchase.id;
                purchaseToken.value = event.payload.purchaseViewToken;
            }
        }).show();
    });
}

onMounted(() => {
    isMobile.value = (document.getElementById(embeddedContainerId.value)?.getBoundingClientRect().width ?? 0) < RAMP_MOBILE_BREAKPOINT;

    showRampSdkEmbedded();

    window.addEventListener('resize', resizeHandler);
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', resizeHandler);
});
</script>

<template>
<template v-if="purchaseId && purchaseToken">
    Purchase initiated.<br>
    Purchase ID: {{ purchaseId }}<br>
    Purchase token: {{ purchaseToken }}<br><br>
</template>

<h1 class="q-mb-md">Overlay</h1>
<button class="q-mb-xl" @click="showRampSdkOverlay">Show Ramp Overlay</button>

<h1 class="q-mb-md">Embedded</h1>
<div :id="embeddedContainerId" :key="embeddedContainerKey" class="c-ramp-demo__embed-container"></div>
</template>

<style lang="scss">
.c-ramp-demo {
    &__embed-container {
        width: 100%;
        height: max(80svh, 700px);
    }
}
</style>
