<script setup lang="ts">
import { ShapedNFT } from 'src/antelope/types/NFTs';
import { computed } from 'vue';
import { useChainStore } from 'src/antelope';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';

import NftViewer from 'pages/evm/nfts/NftViewer.vue';
import ExternalLink from 'components/ExternalLink.vue';

const chainSettings = useChainStore().currentChain.settings as EVMChainSettings;

const props = defineProps<{
    nft: ShapedNFT,
}>();

// computed
const creatorLinkText = computed(() => props.nft.collectionOwnerName ?? props.nft.collectionOwnerAddress);
const creatorLinkUrl = computed(() => `${chainSettings.getExplorerUrl()}/address/${props.nft.collectionOwnerAddress}`);


</script>

<template>
<div class="c-nft-tile">
    <NftViewer :nft="nft" :preview-mode="true" class="c-nft-tile__viewer" />
    <div class="c-nft-tile__text-container">
        <h4>
            <span class="u-text--high-contrast q-pr-sm">{{nft.name}}</span>
            <span class="u-text--default-contrast">{{nft.id}}</span>
        </h4>
        <ExternalLink :text="creatorLinkText" :url="creatorLinkUrl" />
    </div>
</div>
</template>

<style lang="scss">
.c-nft-tile {
    border-radius: 4px;
    border: 1px solid $page-header;
    padding: 16px 24px;

    display: flex;
    height: 100%;
    flex-direction: column;
    justify-content: space-between;
    gap: 16px;


    &__viewer {
        margin: auto;
    }
}
</style>
