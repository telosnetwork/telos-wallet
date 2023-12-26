<script setup lang="ts">
import { ref } from 'vue';

import NftTile from 'pages/evm/nfts/NftTile.vue';
import NftViewer from 'src/components/evm/nfts/NftViewer.vue';
import { Collectible, Erc1155Nft, Erc721Nft, NFTContractClass } from 'src/antelope/types';
import { WEI_PRECISION } from 'src/antelope/stores/utils';

// NFT Contracts
const fakeErc721NftContract = new NFTContractClass({
    symbol: 'FAKE_ERC721',
    creator: '0x'.concat('1'.repeat(40)),
    address: '0x'.concat('2'.repeat(40)),
    fromTrace: false,
    trace_address: '',
    supply: '100',
    calldata: {
        name: 'Fake ERC721',
        symbol: 'FAKE_ERC721',
        supply: '100',
    },
    decimals: WEI_PRECISION,
    name: 'Fake ERC721',
    block: 1,
    supportedInterfaces: ['erc721'],
    transaction: '',
});

const fakeErc1155NftContract = new NFTContractClass({
    symbol: 'FAKE_ERC1155',
    creator: '0x'.concat('3'.repeat(40)),
    address: '0x'.concat('4'.repeat(40)),
    fromTrace: false,
    trace_address: '',
    supply: '200',
    calldata: {
        name: 'Fake ERC1155',
        symbol: 'FAKE_ERC1155',
        supply: '200',
    },
    decimals: WEI_PRECISION,
    name: 'Fake ERC1155',
    block: 2,
    supportedInterfaces: ['erc1155'],
    transaction: '',
});

// NFTs
const fakeErc721Nft = new Erc721Nft({
    name: 'Fake ERC721',
    id: '1',
    metadata: {
        image: 'https://cdn.pixabay.com/photo/2015/12/01/20/28/road-1072821_1280.jpg',
    },
    updated: (new Date('Jan 1 2021')).getTime(),
    owner: '0x'.concat('5'.repeat(40)),
    mediaType: 'image',
}, fakeErc721NftContract);

const fakeErc1155Nft = new Erc1155Nft({
    name: 'Fake ERC1155',
    id: '2',
    metadata: {
        image: 'https://media.istockphoto.com/id/1419410282/photo/silent-forest-in-spring-with-beautiful-bright-sun-rays.jpg?s=2048x2048&w=is&k=20&c=t9_zg20wVbrBoGn0tw__1fFq4ykeKs15TQQ3x-ehVC0=',
    },
    updated: (new Date('Jan 1 2021')).getTime(),
    owners: {
        ['0x'.concat('6'.repeat(40))]: 3,
        ['0x'.concat('7'.repeat(40))]: 12,
    },
    mediaType: 'image',
    supply: 1,
}, fakeErc1155NftContract);

const nfts = [
    fakeErc721Nft,
    fakeErc1155Nft,
];

const nftViewerIsPreviewMode = ref(true);
const tileQuantity = ref(1);

</script>

<template>
<div class="row q-mb-xl">
    <div class="col-12">
        <h3>NFTs / Collectibles</h3>
    </div>
</div>
<hr>
<div class="row q-mb-xl">
    <div class="col-12">
        <h5>NFT Tile</h5>
        <p class="q-mb-md">Note: tiles link to detail page; the mock data will not be present</p>

        <div class="row">
            <div class="col-2">
                <q-input
                    v-model="tileQuantity"
                    type="number"
                    step="1"
                    label="Quantity"
                    hint="Quantity of NFTs to display in tile"
                />
            </div>
        </div>
    </div>

    <div v-for="nft in nfts" :key="`tile-demo-${nft.id}`" class="col-xs-12 col-md-6 col-lg-3 q-mb-md">
        <NftTile
            :nft="nft"
            :quantity="tileQuantity"
        />
    </div>
</div>
<hr>
<div class="row q-mb-xl">
    <div class="col-12">
        <h5 class="q-mb-md">NFT Viewer</h5>
        <q-checkbox v-model="nftViewerIsPreviewMode">
            Viewers in preview mode?
        </q-checkbox>
    </div>
    <div class="col-12">
        <q-expansion-item
            expand-separator
            label="NFT Viewers"
            caption="Expand / collapse NFT Viewer demos"
        >
            <div class="c-nft-demo__viewer-container">
                <NftViewer
                    v-for="nft in nfts"
                    :key="`viewer-demo-${nft.id}`"
                    :nft="nft"
                    :preview-mode="nftViewerIsPreviewMode"
                    :tile-mode="false"
                />
            </div>
        </q-expansion-item>
    </div>
</div>
<hr>
</template>

<style lang="scss">
.c-nft-demo {
    &__viewer-container {
        display: grid;
        grid-template-columns: 1fr;
        gap: 24px;
        max-width: 472px;
        margin: auto;
    }
}
</style>
