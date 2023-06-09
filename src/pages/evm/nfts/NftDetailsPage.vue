<script setup lang="ts">
import AppPage from 'components/evm/AppPage.vue';
import { useNftsStore } from 'src/antelope/stores/nfts';
import { useRoute } from 'vue-router';
import { ShapedNFT } from 'src/antelope/types/NFTs';
import { ref } from 'vue';
import NftViewer from 'pages/evm/nfts/NftViewer.vue';

const route = useRoute();

const nftStore = useNftsStore();

const nft = ref<ShapedNFT | null>(null);

// eztodo handle invalid state / no query params / invalid query params
nftStore.getNftDetails('current', route.query.contract as string, route.query.id as string).then((nftResponse) => {
    nft.value = nftResponse ?? null;
});

</script>

<template>
<AppPage>
    <template v-slot:header>
        <div v-if="!nft">
            NFT not found placeholder
        </div>
        <div v-else>
            <NftViewer :nft="nft" :preview-mode="false" />
        </div>
    </template>

    <div>NFT Details Page</div>

</AppPage>
</template>

<style lang="scss">

</style>
