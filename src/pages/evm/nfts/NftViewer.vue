<script setup lang="ts">

import { computed, nextTick, ref } from 'vue';
import { ShapedNFT } from 'src/antelope/types';
import { useI18n } from 'vue-i18n';
import { usePlatformStore } from 'src/antelope';

const platformStore = usePlatformStore();
const { t: $t } = useI18n();

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

const videoIsPlaying = ref(false);
const videoIsAtEnd = ref(false);
const videoElement = ref<HTMLVideoElement | null>(null);


// computed
const isIos = computed(() => platformStore.isIOSMobile);

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

const showCoverImage = computed(() =>
    [nftTypes.image, nftTypes.audio, nftTypes.none].includes(nftType.value) ||
    props.previewMode,
);
const showPlaceholderCoverImage = computed(() => !props.nft.imageSrcFull);

const imageAlt = computed(() => {
    const details = `${props.nft.name} ${props.nft.id}`;
    if (nftType.value === nftTypes.image) {
        return $t('nft.img_alt', { nftInfo: details });
    } else if (nftType.value === nftTypes.video && props.previewMode) {
        return $t('nft.img_alt_video_nft', { nftInfo: details });
    }

    return '';
});

const iconOverlayName = computed(() => {
    const showIconOverlay =
        (props.previewMode && nftType.value !== nftTypes.image) ||
        (nftType.value === nftTypes.video && !videoIsPlaying.value && !isIos.value) ||
        (nftType.value === nftTypes.audio && !props.nft.imageSrcFull) ||
        nftType.value === nftTypes.none;

    if (!showIconOverlay) {
        return '';
    }

    if (nftType.value === nftTypes.video) {
        if (props.previewMode) {
            return 'o_movie';
        }

        if (videoIsAtEnd.value) {
            return 'o_replay';
        } else {
            return 'o_play_arrow';
        }
    }

    if (nftType.value === nftTypes.audio) {
        return 'o_headphones';
    }

    return 'o_image_not_supported';
});


// methods
function playVideo() {
    if (!isIos.value) {
        // prevent weird iOS behavior where video pauses and unpauses quickly
        toggleVideoPlay(true);
    }
}

function toggleVideoPlay(playOnly?: boolean) {
    if (videoElement.value === null || props.previewMode) {
        return;
    }

    if (!videoIsPlaying.value || playOnly) {
        videoElement.value.play();
    } else {
        videoElement.value.pause();
    }
}

</script>

<template>
<div
    :class="{
        'c-nft-viewer': true,
        'c-nft-viewer--preview': previewMode,
        'c-nft-viewer--video': nftType === nftTypes.video,
    }"
>
    <div class="c-nft-viewer__media-container">
        <div v-if="showCoverImage" class="c-nft-viewer__image-container">
            <img
                v-if="!showPlaceholderCoverImage"
                :src="nft.imageSrcFull"
                :alt="imageAlt"
                class="c-nft-viewer__image"
            >
            <div
                v-else-if="nftType === nftTypes.video"
                class="c-nft-viewer__video-container"
                tabindex="0"
                role="preview"
            ><video
                ref="videoElement"
                :controls="false"
                :src="nft.videoSrc"
                :poster="nft.imageSrcFull"
                playsinline
                class="c-nft-viewer__video"
            ></video></div>
            <div v-else class="c-nft-viewer__placeholder-image"></div>
        </div>

        <div
            v-else-if="nftType === nftTypes.video"
            class="c-nft-viewer__video-container"
            tabindex="0"
            role="button"
            :aria-label="$t('nft.play_video')"
            @click="playVideo"
            @keypress.space.enter.prevent="toggleVideoPlay(false)"
        >
            <video
                ref="videoElement"
                :src="nft.videoSrc"
                :controls="videoIsPlaying || isIos"
                :poster="nft.imageSrcFull"
                playsinline
                class="c-nft-viewer__video"
                @play="videoIsPlaying = true; videoIsAtEnd = false"
                @pause="videoIsPlaying = false; videoIsAtEnd = false"
                @ended="videoIsPlaying = false; videoIsAtEnd = true"
            ></video>
        </div>

        <template v-if="iconOverlayName">
            <div class="c-nft-viewer__overlay-icon-bg shadow-2"></div>

            <q-icon
                :name="iconOverlayName"
                size="lg"
                color="primary"
                class="c-nft-viewer__overlay-icon"
            />
        </template>
    </div>


    <audio
        v-if="nftType === nftTypes.audio && !previewMode"
        controls
        :src="nft.audioSrc"
        class="c-nft-viewer__audio"
    ></audio>
</div>
</template>

<style lang="scss">
.c-nft-viewer {
    $this: &;

    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    gap: 8px;

    &--preview {
        max-height: 270px;
    }

    &--video:hover:not(#{$this}--preview) {
        #{$this}__overlay-icon-bg,
        #{$this}__overlay-icon {
            transform: scale(1.1);
        }
    }

    &__media-container {
        position: relative;
        height: 100%;
        width: 100%;
    }

    &__image-container,
    &__video-container,
    &__blank-container {
        width: 100%;
    }

    &__image-container {
        display: flex;
        justify-content: center;
        align-items: center;
        margin: auto;
        height: 100%;
        max-height: 432px;
    }

    &__image {
        border-radius: 4px;
        height: auto;
        width: auto;
        max-width: 100%;
        max-height: 100%;
    }

    &__overlay-icon-bg,
    &__overlay-icon {
        transition: transform 0.2s ease;
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
        pointer-events: none;

        border-radius: 50%;
        background: #FFFFFFA0;
    }

    &__overlay-icon {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        margin: auto;
        pointer-events: none;
    }

    &__placeholder-image {
        height: 100%;
        width: 100%;
        min-height: 270px;
        max-width: 432px;
        border-radius: 4px;
        background-color: var(--header-bg-color);
        border: 1px solid darken($page-header, 5%);
    }

    &__video-container {
        margin: auto;
    }

    &__video {
        width: 100%;
        cursor: pointer;
    }

    &__audio-container {

    }

    &__audio {
        width: 100%;
        margin: auto;
        max-width: 432px;
        display: block;
        flex-shrink: 0;
    }

    &__blank-container {

    }
}
</style>
