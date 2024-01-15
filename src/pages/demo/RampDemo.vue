<script setup lang="ts">
import { RampInstantSDK } from '@ramp-network/ramp-instant-sdk';

const rampSdk = new RampInstantSDK({
    hostAppName: 'Telos Demo',
    hostLogoUrl: 'https://raw.githubusercontent.com/telosnetwork/token-list/main/logos/telos.png',
    hostApiKey: '55wtuyuew2zyawyxnw2gv6aubuypn4vq7mbwfxz9',
    url: 'https://app.demo.ramp.network',
});

function showRampSdk() {
    rampSdk.show();
}
</script>

<template>
<button @click="showRampSdk">Show Ramp</button>
</template>
