<script setup lang="ts">
import { ref } from 'vue';

import AppPage from 'components/evm/AppPage.vue';
import NftTile from 'pages/evm/nfts/NftTile.vue';
import { ShapedNFT } from 'src/antelope/types/NFTs';


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
    contractAddress: '0x0000000000000000000000000000000000000000',
    contractPrettyName: 'NFT Creator 1',
    description: 'A cool picture of something',
    ownerAddress: '0x160505F3dfD1cb58B91e322c828Ae0F74c043c3C',
    attributes: [{
        label: 'Level of Detail',
        text: 'Highly detailed!',
    }, {
        label: 'Scent',
        text: 'Somewhat cheesy with hints of spring water',
    }, {
        label: 'Time It Took to Make',
        text: 'Like 15 minutes',
    }],
    imageSrcFull: 'http://nfts.telos.net/40/0x2d7d3B1f9569037635eDfbE04C640BB4556A4EA6/5655/1440.webp',
    imageSrcIcon: 'http://nfts.telos.net/40/0x2d7d3B1f9569037635eDfbE04C640BB4556A4EA6/5655/280.webp',
}, {
    name: 'Small Picture',
    id: '613432',
    contractAddress: '0x0000000000000000000000000000000000000000',
    contractPrettyName: 'NFT Creator 1',
    description: 'A little tiny picture of something',
    ownerAddress: '0x160505F3dfD1cb58B91e322c828Ae0F74c043c3C',
    attributes: [{
        label: 'Level of Detail',
        text: 'Low :(',
    }, {
        label: 'Scent',
        text: 'Woody top notes, grassy finish',
    }, {
        label: 'Time It Took to Make',
        text: 'You don\'t wanna know...',
    }],
    imageSrcFull: 'https://www.gardenersnet.com/flower/gallery/vinca.jpg',
    imageSrcIcon: 'https://www.gardenersnet.com/flower/gallery/vinca.jpg',
}, {
    name: 'Cool Video',
    id: '0987',
    contractAddress: '0x1111111111111111111111111111111111111111',
    contractPrettyName: 'NFT Creator 2',
    description: 'A real, moving video',
    ownerAddress: '0x160505F3dfD1cb58B91e322c828Ae0F74c043c3C',
    attributes: [{
        label: 'Level of Detail',
        text: 'Not really applicable',
    }, {
        label: 'Scent',
        text: 'Very digital, reminiscent of ozone',
    }, {
        label: 'Time It Took to Make',
        text: 'A year and a half of nonstop work',
    }],
    videoSrc: 'https://v.ftcdn.net/03/27/66/38/700_F_327663872_S1AbV0TvAyrsbatojIUrfe6Egqanl3q3_ST.mp4',
    imageSrcFull: 'https://4.bp.blogspot.com/-q9pjOVNcCU8/TcqOj6TuQfI/AAAAAAAAAN8/xlXjfoWS7j8/s1600/purple+pair+flowers+wallpaper.jpg',
}, {
    name: 'Cool Image with URI',
    id: '51234',
    contractAddress: '0x2222222222222222222222222222222222222222',
    contractPrettyName: 'NFT Creator 3',
    description: 'An image whose src is not a URL, but rather, a data URI. Nifty.',
    ownerAddress: '0x160505F3dfD1cb58B91e322c828Ae0F74c043c3C',
    attributes: [{
        label: 'Level of Detail',
        text: 'Who makes these attributes...?',
    }, {
        label: 'Scent',
        text: 'Just... off. Not quite right ya know?',
    }, {
        label: 'Time It Took to Make',
        text: 'It made itself actually',
    }],
    imageSrcFull: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHByZXNlcnZlQXNwZWN0UmF0aW89InhNaW5ZTWluIG1lZXQiIHZpZXdCb3g9IjAgMCAzNTAgMzUwIj48c3R5bGU+LmJhc2UgeyBmaWxsOiB3aGl0ZTsgZm9udC1mYW1pbHk6IHNlcmlmOyBmb250LXNpemU6IDE0cHg7IH08L3N0eWxlPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InJlZCIgLz48dGV4dCB4PSIxMCIgeT0iMjAiIGNsYXNzPSJiYXNlIj5XYXJoYW1tZXI8L3RleHQ+PHRleHQgeD0iMTAiIHk9IjQwIiBjbGFzcz0iYmFzZSI+Um9iZTwvdGV4dD48dGV4dCB4PSIxMCIgeT0iNjAiIGNsYXNzPSJiYXNlIj5HcmVhdCBIZWxtIG9mIFBlcmZlY3Rpb248L3RleHQ+PHRleHQgeD0iMTAiIHk9IjgwIiBjbGFzcz0iYmFzZSI+U3R1ZGRlZCBMZWF0aGVyIEJlbHQ8L3RleHQ+PHRleHQgeD0iMTAiIHk9IjEwMCIgY2xhc3M9ImJhc2UiPkdyZWF2ZXM8L3RleHQ+PHRleHQgeD0iMTAiIHk9IjEyMCIgY2xhc3M9ImJhc2UiPk9ybmF0ZSBHYXVudGxldHM8L3RleHQ+PHRleHQgeD0iMTAiIHk9IjE0MCIgY2xhc3M9ImJhc2UiPk5lY2tsYWNlIG9mIFByb3RlY3Rpb248L3RleHQ+PHRleHQgeD0iMTAiIHk9IjE2MCIgY2xhc3M9ImJhc2UiPlBsYXRpbnVtIFJpbmcgb2YgUG93ZXI8L3RleHQ+PC9zdmc+',
    imageSrcIcon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHByZXNlcnZlQXNwZWN0UmF0aW89InhNaW5ZTWluIG1lZXQiIHZpZXdCb3g9IjAgMCAzNTAgMzUwIj48c3R5bGU+LmJhc2UgeyBmaWxsOiB3aGl0ZTsgZm9udC1mYW1pbHk6IHNlcmlmOyBmb250LXNpemU6IDE0cHg7IH08L3N0eWxlPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InJlZCIgLz48dGV4dCB4PSIxMCIgeT0iMjAiIGNsYXNzPSJiYXNlIj5XYXJoYW1tZXI8L3RleHQ+PHRleHQgeD0iMTAiIHk9IjQwIiBjbGFzcz0iYmFzZSI+Um9iZTwvdGV4dD48dGV4dCB4PSIxMCIgeT0iNjAiIGNsYXNzPSJiYXNlIj5HcmVhdCBIZWxtIG9mIFBlcmZlY3Rpb248L3RleHQ+PHRleHQgeD0iMTAiIHk9IjgwIiBjbGFzcz0iYmFzZSI+U3R1ZGRlZCBMZWF0aGVyIEJlbHQ8L3RleHQ+PHRleHQgeD0iMTAiIHk9IjEwMCIgY2xhc3M9ImJhc2UiPkdyZWF2ZXM8L3RleHQ+PHRleHQgeD0iMTAiIHk9IjEyMCIgY2xhc3M9ImJhc2UiPk9ybmF0ZSBHYXVudGxldHM8L3RleHQ+PHRleHQgeD0iMTAiIHk9IjE0MCIgY2xhc3M9ImJhc2UiPk5lY2tsYWNlIG9mIFByb3RlY3Rpb248L3RleHQ+PHRleHQgeD0iMTAiIHk9IjE2MCIgY2xhc3M9ImJhc2UiPlBsYXRpbnVtIFJpbmcgb2YgUG93ZXI8L3RleHQ+PC9zdmc+',
}, {
    name: 'Cool MP3 w/o Image',
    id: '245512',
    contractAddress: '0x3333333333333333333333333333333333333333',
    contractPrettyName: 'NFT Creator 4',
    description: 'A music file which has absolutely no image associated with it. Close your eyes and use your imagination.',
    ownerAddress: '0x160505F3dfD1cb58B91e322c828Ae0F74c043c3C',
    attributes: [{
        label: 'Level of Detail',
        text: '7',
    }, {
        label: 'Scent',
        text: 'Floral yet somehow also like acrylic paint.',
    }, {
        label: 'Time It Took to Make',
        text: 'What do you think? It took several time units',
    }],
    audioSrc: 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3',
}, {
    name: 'Cool MP3 w/ Image',
    id: '83546',
    contractAddress: '0x4444444444444444444444444444444444444444',
    contractPrettyName: 'NFT Creator 5',
    description: 'A true multimodal experience... an image and audio... wowee',
    ownerAddress: '0x160505F3dfD1cb58B91e322c828Ae0F74c043c3C',
    attributes: [{
        label: 'Level of Detail',
        text: 'Medium-ish',
    }, {
        label: 'Scent',
        text: 'Ever smelled naphtha?',
    }, {
        label: 'Time It Took to Make',
        text: 'I don\'t know, I didn\'t make it',
    }],
    imageSrcFull: 'https://4.bp.blogspot.com/-Mf_LhHkjckk/Ux1fSdz8DZI/AAAAAAAAGTY/lpYisOBjgZ0/s1600/dahlia-flower-2-top-10-best-beautiful-spectacular-world-wallpaper-free.jpg',
    imageSrcIcon: 'https://4.bp.blogspot.com/-Mf_LhHkjckk/Ux1fSdz8DZI/AAAAAAAAGTY/lpYisOBjgZ0/s1600/dahlia-flower-2-top-10-best-beautiful-spectacular-world-wallpaper-free.jpg',
    audioSrc: 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3',
}, {
    name: 'Cool GIF',
    id: '8756',
    contractAddress: '0x5555555555555555555555555555555555555555',
    contractPrettyName: '',
    description: 'A gif is like a bunch of pictures all in a row. Like a video but not. That is what this is.',
    ownerAddress: '0x160505F3dfD1cb58B91e322c828Ae0F74c043c3C',
    attributes: [{
        label: 'Level of Detail',
        text: 'Grainier than a field of wheat',
    }, {
        label: 'Scent',
        text: 'Like a field of wheat',
    }, {
        label: 'Time It Took to Make',
        text: 'As long as it takes a crop of wheat to grow',
    }],
    imageSrcFull: 'https://res.cloudinary.com/demo/image/upload/cell_animation.gif',
    imageSrcIcon: 'https://res.cloudinary.com/demo/image/upload/cell_animation.gif',
}, {
    name: 'Cool Animated WebP',
    id: '93532',
    contractAddress: '0x6666666666666666666666666666666666666666',
    contractPrettyName: 'NFT Creator 7',
    description: 'This one smells funny, you\'ll know what I mean when you read the attributes >:)',
    ownerAddress: '0x160505F3dfD1cb58B91e322c828Ae0F74c043c3C',
    attributes: [{
        label: 'Level of Detail',
        text: 'Yowza!',
    }, {
        label: 'Scent',
        text: 'Here\'s the thing. This is a piece of digital art. Digital art has no scent per se, but what I can do is tell you about how it makes me feel, and try to map that onto an olfactory sensation. It makes me feel like I am writing this description to make sure we handle long strings alright. How about that?',
    }, {
        label: 'Time It Took to Make',
        text: 'Who knows man, I usually track time by how many songs I listened to while making it, but I was listening to the same some over and over. Sorry',
    }],
    imageSrcFull: 'https://res.cloudinary.com/demo/image/upload/fl_awebp/bored_animation.webp',
    imageSrcIcon: 'https://res.cloudinary.com/demo/image/upload/fl_awebp/bored_animation.webp',
}, {
    name: 'Boring NFT with no media',
    id: '7134',
    contractAddress: '0x7777777777777777777777777777777777777777',
    contractPrettyName: 'NFT Creator 8',
    ownerAddress: '0x160505F3dfD1cb58B91e322c828Ae0F74c043c3C',
    attributes: [],
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
