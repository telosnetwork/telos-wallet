<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { ShapedNFT } from 'src/antelope/types';
import { useI18n } from 'vue-i18n';
import { usePlatformStore } from 'src/antelope';

const platformStore = usePlatformStore();
const { t: $t } = useI18n();

const props = defineProps<{
    nft: ShapedNFT,
    previewMode: boolean, // controls whether video/audio can be played, and how those types are displayed
    tileMode: boolean,
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
let isMediaLoading = ref(true);
let passedMaxLoadingTime = ref(false);

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

const showCoverImage = computed(
    () => [nftTypes.image, nftTypes.audio, nftTypes.none].includes(nftType.value) || props.previewMode,
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

onMounted(() => {
    setTimeout(() => {
        passedMaxLoadingTime.value = true;
    }, 5000);
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
    v-if="props.tileMode"
    :class="{
        'c-nft-viewer': true,
        'c-nft-viewer--preview': previewMode,
        'c-nft-viewer--video': nftType === nftTypes.video,
    }"
>
    <div class="c-nft-viewer__media-container">
        <div v-if="showCoverImage" class="c-nft-viewer__image-container">
            <q-skeleton v-if="!passedMaxLoadingTime && isMediaLoading" type="rect" class="c-nft-viewer__image-loading" />
            <img
                v-show="!showPlaceholderCoverImage && !isMediaLoading"
                :src="nft.imageSrcFull"
                :alt="imageAlt"
                class="c-nft-viewer__image"
                @load="isMediaLoading = false"
            >
            <div
                v-show="nftType === nftTypes.video && !isMediaLoading"
                class="c-nft-viewer__video-container"
                tabindex="0"
                role="preview"
            >
                <video
                    ref="videoElement"
                    :controls="false"
                    :src="nft.videoSrc"
                    :poster="nft.imageSrcFull"
                    playsinline
                    class="c-nft-viewer__video"
                    @loadeddata="isMediaLoading = false"
                ></video>
            </div>
            <q-icon
                v-if="passedMaxLoadingTime && isMediaLoading"
                :alt="`${$t('nft.broken_image')} ${imageAlt}`"
                name="o_broken_image"
                size="md"
                color="grey-7"
                class="c-nft-viewer__image"
            />
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
                v-show="!isMediaLoading"
                ref="videoElement"
                :src="nft.videoSrc"
                :controls="videoIsPlaying || isIos"
                :poster="nft.imageSrcFull"
                playsinline
                class="c-nft-viewer__video"
                @loadeddata="isMediaLoading = false"
                @play="
                    videoIsPlaying = true;
                    videoIsAtEnd = false;
                "
                @pause="
                    videoIsPlaying = false;
                    videoIsAtEnd = false;
                "
                @ended="
                    videoIsPlaying = false;
                    videoIsAtEnd = true;
                "
            ></video>
        </div>

        <template v-if="!isMediaLoading && iconOverlayName">
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
<template v-else>
    <q-skeleton v-if="isMediaLoading && !passedMaxLoadingTime" type="rect" class="c-nft-viewer__list-image" />
    <q-icon
        v-else-if="isMediaLoading && passedMaxLoadingTime"
        name="o_broken_image"
        :alt="`${$t('nft.broken_image')} ${imageAlt}`"
        size="md"
        color="grey-7"
        class="c-nft-viewer__list-image"
    />
    <img
        v-show="!isMediaLoading"
        :src="nft.imageSrcFull"
        :alt="`${$t('nft.collectible')} ${imageAlt}`"
        class="c-nft-viewer__list-image"
        height="40"
        width="40"
        @load="isMediaLoading = false"
    >
</template>
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

    &__image-loading {
        height: 100%;
        width: 100%;
    }

    &__list-image {
        border-radius: 4px;
        height: 40px;
        width: 40px;
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
        background: #ffffffa0;
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
        border: 1px solid var(--header-item-outline-color);
    }

    &__video-container {
        margin: auto;
    }

    &__video {
        width: 100%;
        cursor: pointer;
    }

    &__audio {
        width: 100%;
        margin: auto;
        max-width: 432px;
        display: block;
        flex-shrink: 0;
    }
}
</style>
