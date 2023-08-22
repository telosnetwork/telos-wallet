<script lang="ts" setup>
import { AxiosInstance } from 'axios';
import AppPage from 'components/evm/AppPage.vue';
import BuyPageOption from 'pages/evm/buy/BuyPageOption.vue';
import BuyPageOptionWidget from 'pages/evm/buy/BuyPageOptionWidget.vue';
import { inject, ref } from 'vue';

const widgetLink = ref('');
const displayWidget = ref<boolean>(false);
const telosApi = inject('$telosApi') as AxiosInstance;

async function fetchLink(name: string) {
    if (name === 'topper'){
        const bootstrapToken = (await telosApi.get('evm/getTopperToken')).data;
        widgetLink.value = `https://app.topperpay.com/?bt=${bootstrapToken}`;
    }else if (name === 'simplex'){
        widgetLink.value = 'https://www.telos.net/#buy-tlos-simplex';
        // widgetLink.value = 'https://iframe.simplex-affiliates.com/form?uid=31fe3fa4-a59f-499b-9371-7e7d8c08f8d0&referrer=http%3A%2F%2Flocalhost%3A8081%2F';
    }
    // TODO: display widget link in iframe
    // toggleWidget.value = true;

    //temp solution just redirects to new tab
    window.open(widgetLink.value, '_blank')?.focus();
}

</script>

<template>
<AppPage>
    <template v-slot:header>
        <h1>{{ $t('evm_buy.buy_telos') }}</h1>
    </template>
    <BuyPageOptionWidget v-if="displayWidget" :link="widgetLink"/>

    <div v-else>
        <BuyPageOption
            :button-label="$t('evm_buy.simplex.button_label')"
            :powered-by="$t('evm_buy.simplex.powered_by')"
            :header="$t('evm_buy.simplex.header')"
            :subheader="$t('evm_buy.simplex.subheader')"
            @click="fetchLink('simplex')"
        />
        <BuyPageOption
            :button-label="$t('evm_buy.topper.button_label')"
            :powered-by="$t('evm_buy.topper.powered_by')"
            :header="$t('evm_buy.topper.header')"
            :subheader="$t('evm_buy.topper.subheader')"
            @click="fetchLink('topper')"
        />
    </div>
</AppPage>
</template>

<style lang="scss">
</style>
