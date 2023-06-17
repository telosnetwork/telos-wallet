<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import AppPage from 'components/evm/AppPage.vue';
import NftTile from 'pages/evm/nfts/NftTile.vue';

import { useNftsStore } from 'src/antelope/stores/nfts';
import { useAccountStore } from 'src/antelope';
import { NFTClass } from 'src/antelope/types';

const nftStore = useNftsStore();

// data
const loading = computed(() => nftStore.loggedInventoryLoading);
// const nfts = ref([] as NFTClass[]);
const showNftsAsTiles = ref(true);

const nfts = computed(() => nftStore.getInventory('logged')?.list || [] as NFTClass[]);

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
        <q-checkbox v-model="showNftsAsTiles" class="q-mb-lg">Show as tile?</q-checkbox>

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
