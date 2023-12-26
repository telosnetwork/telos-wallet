<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

import { Collectible } from 'src/antelope/types';
import { CURRENT_CONTEXT, useNftsStore } from 'src/antelope';

import NftViewer from 'src/components/evm/nfts/NftViewer.vue';

const props = defineProps<{
    collection: string; // address of collection/contract
}>();

const nftStore = useNftsStore();

// data
const root = ref<HTMLElement | null>(null);
const loading = ref(true);
const collectionNfts = ref<Collectible[]>([]);

// computed
const nfts = computed(() => collectionNfts.value.slice(0, 3));

// watch
watch(nfts, () => {
    if (root.value) {
        root.value.style.setProperty('--stack-width', `${nfts.value.length * 8 + 16}px`);
    }
});

onMounted(async () => {
    collectionNfts.value = await nftStore.fetchNftsFromCollection(CURRENT_CONTEXT, props.collection) ?? [];
    loading.value = false;
});
</script>

<template>
<div ref="root" class="nft-collection-stack">
    <q-skeleton
        v-if="loading"
        type="rect"
        height="24px"
        width="24px"
    />
    <NftViewer
        v-for="nft in nfts"
        v-show="!loading"
        :key="nft.key"
        :nft="nft"
        :preview-mode="false"
        :tile-mode="false"
        :icon-size="24"
        class="nft-collection-stack__nft"
    />
</div>
</template>

<style lang="scss">
.nft-collection-stack {
    position: relative;

    height: 24px;
    width: var(--stack-width);
    transform: translate(0, 0); // create new stacking context for child NFT z-indices

    &__nft {
        position: absolute;
        z-index: 3;
        pointer-events: none; // prevent hover effects on these NFTs
        background-color: var(--bg-color);

        &:nth-child(2) {
            left: 6px;
            z-index: 2;
            transform: scale(0.9);
        }

        &:nth-child(3) {
            left: 12px;
            z-index: 1;
            transform: scale(0.8);
        }
    }
}
</style>
