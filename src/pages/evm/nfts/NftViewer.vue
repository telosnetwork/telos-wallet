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

const coverImageIsUri = computed(() => props.nft.imageSrcFull?.startsWith('data:'));
const showCoverImage = computed(() => nftType.value === nftTypes.image || props.previewMode);
const showPlaceholderCoverImage = computed(() => !props.nft.imageSrcFull);

const imageAlt = computed(() => {
    if (nftType.value === nftTypes.image) {
        return `NFT - ${props.nft.name} ${props.nft.id}`;
    } else if (nftType.value === nftTypes.video && props.previewMode) {
        return `Video NFT cover - ${props.nft.name} ${props.nft.id}`;
    }

    return '';
});

const iconOverlayName = computed(() => {
    const showIconOverlay = props.previewMode && nftType.value !== nftTypes.image;

    if (!showIconOverlay) {
        return '';
    }

    if (nftType.value === nftTypes.video) {
        return 'play_arrow';
    }

    if (nftType.value === nftTypes.audio) {
        return 'headphones';
    }

    return 'image_not_supported';
});

</script>

<template>
<!--eztodo i18n for all alt attrs-->
<div class="c-nft-viewer">
    <div v-if="showCoverImage" class="c-nft-viewer__image-container">
        <img
            v-if="!showPlaceholderCoverImage"
            :src="nft.imageSrcFull"
            :alt="imageAlt"
            class="c-nft-viewer__image"
        >
        <div v-else class="c-nft-viewer__placeholder-image"></div>

        <template v-if="iconOverlayName">
            <div class="c-nft-viewer__overlay-icon-bg shadow-2"></div>

            <q-icon
                :name="iconOverlayName"
                size="xl"
                color="primary"
                class="c-nft-viewer__overlay-icon"
            />
        </template>
    </div>

    <div v-else-if="nftType === nftTypes.video" class="c-nft-viewer__video-container">
        <!-- Implement video here https://github.com/telosnetwork/telos-wallet/issues/347 -->
    </div>

    <div v-else-if="nftType === nftTypes.audio" class="c-nft-viewer__audio-container">
        <!-- Implement audio here https://github.com/telosnetwork/telos-wallet/issues/347 -->
    </div>

    <div v-else-if="nftType === nftTypes.none" class="c-nft-viewer__blank-container">

    </div>
</div>
</template>

<style lang="scss">
.c-nft-viewer {
    height: 100%;
    width: 100%;
    max-height: 270px;

    &__image-container,
    &__image,
    &__video-container,
    &__audio-container,
    &__blank-container {
        height: 100%;
        width: 100%;
    }

    &__image-container {
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
    }

    &__image {
        border-radius: 4px;
        height: auto;
        width: auto;
        max-width: 100%;
        max-height: 100%;
    }

    &__overlay-icon-bg {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        margin: auto;
        height: 64px;
        width: 64px;
        content: '';

        border-radius: 50%;
        background: white;
    }

    &__overlay-icon {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        margin: auto;
    }

    &__placeholder-image {
        height: 100%;
        width: 100%;
        min-height: 270px;
        border-radius: 4px;
        background-color: var(--header-bg-color);
    }

    &__video-container {

    }

    &__audio-container {

    }

    &__blank-container {

    }
}
</style>
