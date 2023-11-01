<script lang="ts" setup>
import { computed, inject, ref } from 'vue';
import { AxiosInstance } from 'axios';
import { useI18n } from 'vue-i18n';

import { useAccountStore } from 'src/antelope';

import AppPage from 'components/evm/AppPage.vue';
import BuyPageOption from 'pages/evm/buy/BuyPageOption.vue';

const telosApi = inject('$telosApi') as AxiosInstance;
const errorNotification = inject('$errorNotification') as any;
const { t: $t } = useI18n();

// data
const widgetLink = ref('');
const displayWidget = ref(false);

// computed
const address = computed(() => useAccountStore().currentEvmAccount?.address);
const isMainnet = computed(() => process.env.CHAIN_NAME === 'telos');

// methods
async function fetchLink(name: string) {
    try {
        if (name === 'topper') {
            const bootstrapToken = isMainnet.value ? (await telosApi.get(`/evm/getTopperToken?address=${address.value}`)).data : (await telosApi.get(`/evm/getTopperToken?address=${address.value}&sandbox=true`)).data;
            widgetLink.value = isMainnet.value ? `https://app.topperpay.com/?bt=${bootstrapToken}` : `https://app.sandbox.topperpay.com/?bt=${bootstrapToken}`;
            displayWidget.value = true;
        } else if (name === 'simplex'){
            widgetLink.value = 'https://www.telos.net/#buy-tlos-simplex';
            window.open(widgetLink.value, '_blank');
            // TODO implement Simplex Form widget
            // widgetLink.value = 'https://iframe.simplex-affiliates.com/form?uid=31fe3fa4-a59f-499b-9371-7e7d8c08f8d0&referrer=http%3A%2F%2Flocalhost%3A8081%2F';
            // displayWidget.value = true;
        }
    } catch(e){
        errorNotification($t('notification.error_redirecting'));
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
        <h1 class="q-mb-xl">{{ $t('evm_buy.buy_telos') }}</h1>
    </template>

    <div class="c-buy-page__content">
        <div v-if="displayWidget">
            <div
                :aria-label="$t('evm_buy.back_to_selection')"
                class="c-buy-page__back-link"
                tabindex="0"
                role="link"
                @keypress.space.enter="returnToOptions"
                @click="returnToOptions"
            >
                <q-icon
                    name="arrow_back_ios"
                    size="16px"
                    class="c-buy-page__back-icon"
                />
                <span class="q-ml-xs o-text--link">{{ $t('evm_buy.back_to_selection') }}</span>
            </div>
            <br>
            <div class="c-buy-page__ptoken-iframe-container">
                <iframe
                    :src="widgetLink"
                    allowfullscreen="true"
                    class="c-buy-page__ptoken-iframe"
                ></iframe>
            </div>

        </div>
        <div v-else class="c-buy-page__options">
            <BuyPageOption
                :button-label="$t('evm_buy.simplex.button_label')"
                :powered-by="$t('evm_buy.simplex.powered_by')"
                :header="$t('evm_buy.simplex.header')"
                :subheader="$t('evm_buy.simplex.subheader')"
                :widget="false"
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
                @fetchLink="fetchLink('topper')"
            />
        </div>
    </div>
</AppPage>
</template>

<style lang="scss">
.c-buy-page {
    &__content {
        max-width: 1000px;
        margin: auto;
    }

    &__options {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        align-items: flex-start;
        gap: 42px;
        margin-top: 20px;
        margin-bottom: 48px;

        @include lg-and-up {
            gap: 128px;
        }
    }

    &__back-link {
        display: flex;
        align-items: center;
        width: max-content;
        cursor: pointer;
    }

    &__back-icon {
        color: var(--link-color);
    }

    &__ptoken-iframe-container {
        display: flex;
        justify-content: center;
    }

    &__ptoken-iframe {
        margin: auto;
        width: 100%;
        max-width: 800px;
        height: 80vh;
    }
}
</style>
