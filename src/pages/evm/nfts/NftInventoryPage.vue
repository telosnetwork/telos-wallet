<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';

import AppPage from 'components/evm/AppPage.vue';
import NftTile from 'pages/evm/nfts/NftTile.vue';
import ExternalLink from 'components/ExternalLink.vue';

import { useNftsStore } from 'src/antelope/stores/nfts';
import { NFTClass } from 'src/antelope/types';
import { useAccountStore } from 'src/antelope';

const nftStore = useNftsStore();

// data
const loading = computed(() => nftStore.loggedInventoryLoading);
// const nfts = ref([] as NFTClass[]);
const showNftsAsTiles = ref(true);

const nfts = computed(() => nftStore.getInventory('logged')?.list || [] as NFTClass[]);

// we update the inventory while the user is on the page
let timer: string | number | NodeJS.Timer | undefined;
onMounted(async () => {
    timer = setInterval(async () => {
        if (useAccountStore().loggedAccount) {
            await useNftsStore().updateNFTsForAccount('logged', useAccountStore().loggedAccount);
        }
    }, 13000);
});

onUnmounted(() => {
    clearInterval(timer);
});

</script>

<template>
<AppPage>
    <template v-slot:header>
        <h1>{{ $t('evm_wallet.inventory') }}</h1>
    </template>

    <div v-if="loading" class="q-mt-xl flex flex-center">
        <q-spinner size="lg" />
    </div>

    <div v-else class="c-nft-page">

        <div v-if="nfts.length === 0" class="c-nft-page__empty-inventory" >
            <h2 class="c-nft-page__empty-title">{{ $t('nft.empty_collection_title') }}</h2>
            <p class="c-nft-page__empty-text">{{ $t('nft.empty_collection_message') }} <ExternalLink :text="$t('nft.empty_collection_link_text')" :url="'contractLink'" /></p>
        </div>

        <q-checkbox v-else v-model="showNftsAsTiles" class="q-mb-lg">Show as tile?</q-checkbox>

        <div v-if="showNftsAsTiles" class="c-nft-page__tiles-container">
            <NftTile
                v-for="nft in nfts"
                :key="nft.key"
                :nft="nft"
            />
        </div>

        <div v-else>
            nft table view placeholder
        </div>
    </div>
</AppPage>
</template>

<style lang="scss">
.c-nft-page {
    max-width: 1000px;
    margin: auto;

    &__empty-inventory {
        text-align: center;
        margin: auto;
        margin-top: 50px;
    }

    &__empty-title {
    }

    &__empty-text {
        margin-top: 20px;
    }

    &__tiles-container {
        width: max-content;
        margin: auto;
        display: grid;
        gap: 16px;
        grid-template-columns: 1fr;

        @media only screen and (min-width: 700px) {
            grid-template-columns: 1fr 1fr;
        }

        @media only screen and (min-width: 1400px) {
            grid-template-columns: 1fr 1fr 1fr;
        }
    }
}
</style>
