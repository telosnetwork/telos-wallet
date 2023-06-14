<script setup lang="ts">
import { computed, ref } from 'vue';

import AppPage from 'components/evm/AppPage.vue';
import NftTile from 'pages/evm/nfts/NftTile.vue';
import { useNFTsStore } from 'src/antelope';


/*
Types of NFT states:
- image with thumbnail
- image without thumbnail
- video with cover image
- video without cover image
- audio with cover image
- audio without cover image
*/

const nfts = computed(() => useNFTsStore().loggedNFTs);
// data
const showNftsAsTiles = ref(true);
</script>

<template>
<AppPage>
    <template v-slot:header>
        <h1>{{ $t('evm_wallet.inventory') }}</h1>
    </template>

    <div class="c-nft-page">
        <!--TODO remove this i18n entry-->
        <q-checkbox v-model="showNftsAsTiles" class="q-mb-lg">{{ $t('nft.tile_toggle_radio_label') }}</q-checkbox>

        <div v-if="showNftsAsTiles" class="c-nft-page__tiles-container">
            <NftTile
                v-for="nft in nfts"
                :key="nft.id"
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
