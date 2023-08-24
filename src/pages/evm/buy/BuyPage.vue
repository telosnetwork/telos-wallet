<script lang="ts" setup>
import { AxiosInstance } from 'axios';
import AppPage from 'components/evm/AppPage.vue';
import { logger } from 'ethers';
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
            const bootstrapToken = (await telosApi.get(`/evm/getTopperToken?address=${address}&sandbox=true`)).data; //TODO remove `sandbox` query param
            widgetLink.value = `https://app.sandbox.topperpay.com/?bt=${bootstrapToken}`; //TODO remove 'sandbox'
            displayWidget.value = true;
        }else if (name === 'simplex'){
            widgetLink.value = 'https://www.telos.net/#buy-tlos-simplex';
            window.open(widgetLink.value, '_blank');
            // widgetLink.value = 'https://iframe.simplex-affiliates.com/form?uid=31fe3fa4-a59f-499b-9371-7e7d8c08f8d0&referrer=http%3A%2F%2Flocalhost%3A8081%2F';
            // displayWidget.value = true;
        }
    }catch(e){
        errorNotification('There was an error redirecting, please try again later');
    }
}

function returnToOptions(){
    displayWidget.value = false;
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
            <a class="c-buy-page__return" @click="returnToOptions"> &lt; Back to selection </a>
            <iframe
                :src="widgetLink"
                height="1000px"
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
                :widget="false"
                class="c-buy-page__option"
                @fetchLink="fetchLink('simplex')"
            />
            <BuyPageOption
                :button-label="$t('evm_buy.topper.button_label')"
                :powered-by="$t('evm_buy.topper.powered_by')"
                :header="$t('evm_buy.topper.header')"
                :subheader="$t('evm_buy.topper.subheader')"
                :widget="true"
                :subheaderLink="$t('evm_buy.topper.subheader_link')"
                :subheaderLinkText="$t('evm_buy.topper.subheader_link_text')"
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

    &__iframe{
        a {
            font-size: 22px;
            color: var(--link-color);
            cursor: pointer;
        }
    }
}
</style>
