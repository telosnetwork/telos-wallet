<script setup lang="ts">
import { ref } from 'vue';

import AppPage from 'components/evm/AppPage.vue';
import NftTile from 'pages/evm/nfts/NftTile.vue';
import { ShapedNFT } from 'src/antelope/types/NFTs';

// eztodo move to demo route
const nfts: ShapedNFT[] = [{
    name: 'Cool Picture',
    id: '123456',
    collectionOwnerAddress: '0x0000000000000000000000000000000000000000',
    collectionOwnerName: 'NFT Creator 1',
    imageSrcFull: 'http://nfts.telos.net/40/0x2d7d3B1f9569037635eDfbE04C640BB4556A4EA6/5655/1440.webp',
    imageSrcIcon: 'http://nfts.telos.net/40/0x2d7d3B1f9569037635eDfbE04C640BB4556A4EA6/5655/280.webp',
}, {
    name: 'Cool Video',
    id: '0987',
    collectionOwnerAddress: '0x1111111111111111111111111111111111111111',
    collectionOwnerName: 'NFT Creator 2',
    videoSrc: 'https://v.ftcdn.net/03/27/66/38/700_F_327663872_S1AbV0TvAyrsbatojIUrfe6Egqanl3q3_ST.mp4',
}, {
    name: 'Cool Image with URI',
    id: '51234',
    collectionOwnerAddress: '0x2222222222222222222222222222222222222222',
    collectionOwnerName: 'NFT Creator 3',
    imageSrcFull: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHByZXNlcnZlQXNwZWN0UmF0aW89InhNaW5ZTWluIG1lZXQiIHZpZXdCb3g9IjAgMCAzNTAgMzUwIj48c3R5bGU+LmJhc2UgeyBmaWxsOiB3aGl0ZTsgZm9udC1mYW1pbHk6IHNlcmlmOyBmb250LXNpemU6IDE0cHg7IH08L3N0eWxlPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InJlZCIgLz48dGV4dCB4PSIxMCIgeT0iMjAiIGNsYXNzPSJiYXNlIj5XYXJoYW1tZXI8L3RleHQ+PHRleHQgeD0iMTAiIHk9IjQwIiBjbGFzcz0iYmFzZSI+Um9iZTwvdGV4dD48dGV4dCB4PSIxMCIgeT0iNjAiIGNsYXNzPSJiYXNlIj5HcmVhdCBIZWxtIG9mIFBlcmZlY3Rpb248L3RleHQ+PHRleHQgeD0iMTAiIHk9IjgwIiBjbGFzcz0iYmFzZSI+U3R1ZGRlZCBMZWF0aGVyIEJlbHQ8L3RleHQ+PHRleHQgeD0iMTAiIHk9IjEwMCIgY2xhc3M9ImJhc2UiPkdyZWF2ZXM8L3RleHQ+PHRleHQgeD0iMTAiIHk9IjEyMCIgY2xhc3M9ImJhc2UiPk9ybmF0ZSBHYXVudGxldHM8L3RleHQ+PHRleHQgeD0iMTAiIHk9IjE0MCIgY2xhc3M9ImJhc2UiPk5lY2tsYWNlIG9mIFByb3RlY3Rpb248L3RleHQ+PHRleHQgeD0iMTAiIHk9IjE2MCIgY2xhc3M9ImJhc2UiPlBsYXRpbnVtIFJpbmcgb2YgUG93ZXI8L3RleHQ+PC9zdmc+',
    imageSrcIcon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHByZXNlcnZlQXNwZWN0UmF0aW89InhNaW5ZTWluIG1lZXQiIHZpZXdCb3g9IjAgMCAzNTAgMzUwIj48c3R5bGU+LmJhc2UgeyBmaWxsOiB3aGl0ZTsgZm9udC1mYW1pbHk6IHNlcmlmOyBmb250LXNpemU6IDE0cHg7IH08L3N0eWxlPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InJlZCIgLz48dGV4dCB4PSIxMCIgeT0iMjAiIGNsYXNzPSJiYXNlIj5XYXJoYW1tZXI8L3RleHQ+PHRleHQgeD0iMTAiIHk9IjQwIiBjbGFzcz0iYmFzZSI+Um9iZTwvdGV4dD48dGV4dCB4PSIxMCIgeT0iNjAiIGNsYXNzPSJiYXNlIj5HcmVhdCBIZWxtIG9mIFBlcmZlY3Rpb248L3RleHQ+PHRleHQgeD0iMTAiIHk9IjgwIiBjbGFzcz0iYmFzZSI+U3R1ZGRlZCBMZWF0aGVyIEJlbHQ8L3RleHQ+PHRleHQgeD0iMTAiIHk9IjEwMCIgY2xhc3M9ImJhc2UiPkdyZWF2ZXM8L3RleHQ+PHRleHQgeD0iMTAiIHk9IjEyMCIgY2xhc3M9ImJhc2UiPk9ybmF0ZSBHYXVudGxldHM8L3RleHQ+PHRleHQgeD0iMTAiIHk9IjE0MCIgY2xhc3M9ImJhc2UiPk5lY2tsYWNlIG9mIFByb3RlY3Rpb248L3RleHQ+PHRleHQgeD0iMTAiIHk9IjE2MCIgY2xhc3M9ImJhc2UiPlBsYXRpbnVtIFJpbmcgb2YgUG93ZXI8L3RleHQ+PC9zdmc+',
}, {
    name: 'Cool MP3 w/o Image',
    id: '245512',
    collectionOwnerAddress: '0x3333333333333333333333333333333333333333',
    collectionOwnerName: 'NFT Creator 4',
    audioSrc: 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3',
}, {
    name: 'Cool MP3 w/ Image',
    id: '83546',
    collectionOwnerAddress: '0x4444444444444444444444444444444444444444',
    collectionOwnerName: 'NFT Creator 5',
    imageSrcFull: 'http://nfts.telos.net/40/0x2d7d3B1f9569037635eDfbE04C640BB4556A4EA6/5655/1440.webp',
    imageSrcIcon: 'http://nfts.telos.net/40/0x2d7d3B1f9569037635eDfbE04C640BB4556A4EA6/5655/280.webp',
    audioSrc: 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3',
}, {
    name: 'Cool GIF',
    id: '8756',
    collectionOwnerAddress: '0x5555555555555555555555555555555555555555',
    collectionOwnerName: 'NFT Creator 6',
    imageSrcFull: 'https://res.cloudinary.com/demo/image/upload/cell_animation.gif',
    imageSrcIcon: 'https://res.cloudinary.com/demo/image/upload/cell_animation.gif',
}, {
    name: 'Cool Animated WebP',
    id: '93532',
    collectionOwnerAddress: '0x6666666666666666666666666666666666666666',
    collectionOwnerName: 'NFT Creator 7',
    imageSrcFull: 'https://res.cloudinary.com/demo/image/upload/fl_awebp/bored_animation.webp',
    imageSrcIcon: 'https://res.cloudinary.com/demo/image/upload/fl_awebp/bored_animation.webp',
}, {
    name: 'Boring NFT with no media',
    id: '7134',
    collectionOwnerAddress: '0x7777777777777777777777777777777777777777',
    collectionOwnerName: 'NFT Creator 8',
}];

// data
const showNftsAsTiles = ref(true);
</script>

<template>
<AppPage>
    <template v-slot:header>
        <h1>{{ $t('evm_wallet.inventory') }}</h1>
    </template>

    <q-checkbox v-model="showNftsAsTiles">Show as tile?</q-checkbox>

    <template v-if="showNftsAsTiles">
        <div class="col-xs-12 col-6">
            <NftTile
                v-for="nft in nfts"
                :key="nft.id"
                :nft="nft"
            />
        </div>

    </template>

    <div v-else>
        nft table view placeholder
    </div>

</AppPage>
</template>

<style lang="scss">

</style>
