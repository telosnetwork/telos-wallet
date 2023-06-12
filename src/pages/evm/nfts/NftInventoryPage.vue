<script setup lang="ts">
import { ref, watch } from 'vue';

import AppPage from 'components/evm/AppPage.vue';
import NftTile from 'pages/evm/nfts/NftTile.vue';
import { ShapedNFT } from 'src/antelope/types/NFTs';
import { useNftsStore } from 'src/antelope/stores/nfts';
import { useAccountStore } from 'src/antelope';

const nftStore = useNftsStore();
const accountStore = useAccountStore();

// data
const loading = ref(true);
const nfts = ref<ShapedNFT[]>([]);
const showNftsAsTiles = ref(true);

// watchers
watch(
    accountStore,
    (newValue) => {
        const address = newValue?.loggedAccount?.account;
        if (address) {
            // eztodo remove fake loading time
            setTimeout(() => {
                nftStore.fetchNFtsForAccount('current', address).then(() => {
                    nfts.value = nftStore.getAccountNfts('current', address);
                    loading.value = false;
                });
            }, 2000);
        }
    },
    {
        immediate: true,
        deep: true,
    },
);
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
