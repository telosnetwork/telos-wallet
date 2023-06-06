<script setup lang="ts">
/*
Possible NFT configurations after shaping:
- no media
    - display full-size no media placeholder
- image
    - display image
- video
    - preview mode
        - show cover image with play icon in center
    - regular mode:
        - display cover image with play icon in the center. on hover icon should grow slightly
        - on click, play video (no loop)
        - on hover, show controls
        - after video completes, show replay icon in center. on hover icon should grow slightly
- audio with cover image
    - show image
    - preview mode:
        - show cover image with headphones icon in the center
    - regular mode:
        - show audio controls under the image (no loop)
        - on hover of image, show play icon in the center
        - on click, play audio
        - on hover while playing, show pause icon
        - after audio completes, show replay icon
- audio without cover image
    - preview mode:
        - show gray tile with headphones icon
    - regular mode:
        - same as audio with cover image, but show no image;
          show headphones icon in the center when not hovering
 */

import { computed } from 'vue';
import { ShapedNFT } from 'src/antelope/types/NFTs';

const props = defineProps<{
    nft: ShapedNFT,
    previewMode: boolean, // controls whether video/audio can be played, and how those types are displayed
}>();

// data
const nftTypes = {
    image: 'image',
    video: 'video',
    audio: 'audio',
    none: 'none',
};

// computed
const nftType = computed(() => {
    if (props.nft.imageSrcFull && !props.nft.audioSrc && !props.nft.videoSrc) {
        return nftTypes.image;
    } else if (props.nft.videoSrc) {
        return nftTypes.video;
    } else if (props.nft.audioSrc) {
        return nftTypes.audio;
    } else {
        return nftTypes.none;
    }
});
</script>

<template>
<div class="c-nft-viewer">
    <div v-if="nftType === nftTypes.image" class="c-nft-viewer__image-container">
        <img
            :src="nft.imageSrcFull"
            :alt="`NFT - ${nft.name} ${nft.id}`"
            class="c-nft-viewer__image"
        >
    </div>

    <div v-else-if="nftType === nftTypes.video" class="c-nft-viewer__video-container">

    </div>

    <div v-else-if="nftType === nftTypes.audio" class="c-nft-viewer__audio-container">

    </div>

    <div v-else-if="nftType === nftTypes.none" class="c-nft-viewer__blank-container">

    </div>
</div>
</template>

<style lang="scss">
.c-nft-viewer {

    &__image-container,
    &__image,
    &__video-container,
    &__audio-container,
    &__blank-container {
        max-width: 100%;
    }

    &__image-container {
        display: flex;
        justify-content: center;
        align-items: center;
    }

    &__image {
        border-radius: 4px;
    }

    &__video-container {

    }

    &__audio-container {

    }

    &__blank-container {

    }
}
</style>
