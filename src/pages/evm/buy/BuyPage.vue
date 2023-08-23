<script lang="ts" setup>
import { AxiosInstance } from 'axios';
import AppPage from 'components/evm/AppPage.vue';
import BuyPageOption from 'pages/evm/buy/BuyPageOption.vue';
import { useAccountStore } from 'src/antelope';
import { inject, ref } from 'vue';

const widgetLink = ref('');
const address = useAccountStore().currentEvmAccount?.address;
const displayWidget = ref<boolean>(false);
const telosApi = inject('$telosApi') as AxiosInstance;
const errorNotification = inject('$errorNotification') as any;

async function fetchLink(name: string) {
    try {
        if (name === 'topper'){
            const bootstrapToken = (await telosApi.get(`/evm/getTopperToken?address=${address}`)).data;
            widgetLink.value = `https://app.topperpay.com/?bt=${bootstrapToken}`;
        }else if (name === 'simplex'){
            widgetLink.value = 'https://www.telos.net/#buy-tlos-simplex';
            // widgetLink.value = 'https://iframe.simplex-affiliates.com/form?uid=31fe3fa4-a59f-499b-9371-7e7d8c08f8d0&referrer=http%3A%2F%2Flocalhost%3A8081%2F';
        }
        // TODO: display widget link in iframe
        // toggleWidget.value = true;
        //temp solution just redirects to new tab
        window.open(widgetLink.value, '_blank')?.focus();
    }catch(e){
        errorNotification('There was an error redirecting, please try again later');
    }
}

function returnToOptions(){
    widgetLink.value = '';
}

</script>

<template>
<AppPage>
    <template v-slot:header >
        <h1 class="c-buy-page__header">{{ $t('evm_buy.buy_telos') }}</h1>
    </template>

    <div>
        <div
            v-if="displayWidget"
            class="c-buy-page__iframe"
        >
            <div class="c-buy-page__return" @click="returnToOptions"> &lt; Back to selection </div>
            <iframe
                :src="widgetLink"
                height="500px"
                width="100%"
                allowfullscreen="true"
            ></iframe>
        </div>
        <div v-else class="c-buy-page__options">
            <BuyPageOption
                :button-label="$t('evm_buy.simplex.button_label')"
                :powered-by="$t('evm_buy.simplex.powered_by')"
                :header="$t('evm_buy.simplex.header')"
                :subheader="$t('evm_buy.simplex.subheader')"
                subheaderLink=""
                class="c-buy-page__option"
                @fetchLink="fetchLink('simplex')"
            />
            <BuyPageOption
                :button-label="$t('evm_buy.topper.button_label')"
                :powered-by="$t('evm_buy.topper.powered_by')"
                :header="$t('evm_buy.topper.header')"
                :subheader="$t('evm_buy.topper.subheader')"
                :subheaderLink="$t('evm_buy.topper.subheader_link')"
                class="c-buy-page__option"
                @fetchLink="fetchLink('topper')"
            />
        </div>
    </div>
</AppPage>
</template>

<style lang="scss">
.c-buy-page {
    &__options{
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        align-items: flex-start;
        gap: 160px;
        margin-top: 20px;
    }

    &__header{
        padding: 88px 0px 104px;
    }
}
</style>
