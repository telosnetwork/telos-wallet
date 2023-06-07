<script setup lang="ts">
import { ref } from 'vue';

import AppPage from 'components/evm/AppPage.vue';
import NftTile from 'pages/evm/nfts/NftTile.vue';
import { ShapedNFT } from 'src/antelope/types/NFTs';

// eztodo move to demo route
// eztodo post in chat solution for different nft types
/*
Types of NFT states:
- image with thumbnail
- image without thumbnail
- video with cover image
- video without cover image
- audio with cover image
- audio without cover image
 */
const nfts: ShapedNFT[] = [{
    name: 'Cool Picture',
    id: '123456',
    collectionOwnerAddress: '0x0000000000000000000000000000000000000000',
    collectionOwnerName: 'NFT Creator 1',
    imageSrcFull: 'http://nfts.telos.net/40/0x2d7d3B1f9569037635eDfbE04C640BB4556A4EA6/5655/1440.webp',
    imageSrcIcon: 'http://nfts.telos.net/40/0x2d7d3B1f9569037635eDfbE04C640BB4556A4EA6/5655/280.webp',
}, {
    name: 'Small Picture',
    id: '613432',
    collectionOwnerAddress: '0x0000000000000000000000000000000000000000',
    collectionOwnerName: 'NFT Creator 1',
    imageSrcFull: 'https://www.gardenersnet.com/flower/gallery/vinca.jpg',
    imageSrcIcon: 'https://www.gardenersnet.com/flower/gallery/vinca.jpg',
}, {
    name: 'Cool Video',
    id: '0987',
    collectionOwnerAddress: '0x1111111111111111111111111111111111111111',
    collectionOwnerName: 'NFT Creator 2',
    videoSrc: 'https://v.ftcdn.net/03/27/66/38/700_F_327663872_S1AbV0TvAyrsbatojIUrfe6Egqanl3q3_ST.mp4',
    imageSrcFull: 'https://4.bp.blogspot.com/-q9pjOVNcCU8/TcqOj6TuQfI/AAAAAAAAAN8/xlXjfoWS7j8/s1600/purple+pair+flowers+wallpaper.jpg',
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
    imageSrcFull: 'https://4.bp.blogspot.com/-Mf_LhHkjckk/Ux1fSdz8DZI/AAAAAAAAGTY/lpYisOBjgZ0/s1600/dahlia-flower-2-top-10-best-beautiful-spectacular-world-wallpaper-free.jpg',
    imageSrcIcon: 'https://4.bp.blogspot.com/-Mf_LhHkjckk/Ux1fSdz8DZI/AAAAAAAAGTY/lpYisOBjgZ0/s1600/dahlia-flower-2-top-10-best-beautiful-spectacular-world-wallpaper-free.jpg',
    audioSrc: 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3',
},  {
    name: 'MP3 w/o Image',
    id: '82457',
    collectionOwnerAddress: '0x4444444444444444444444444444444444444444',
    collectionOwnerName: 'NFT Creator 5',
    imageSrcFull: '',
    imageSrcIcon: '',
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

    <div class="c-nft-page">
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
