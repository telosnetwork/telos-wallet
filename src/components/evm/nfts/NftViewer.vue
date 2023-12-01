<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { Collectible } from 'src/antelope/types';
import { usePlatformStore } from 'src/antelope';

const platformStore = usePlatformStore();
const { t: $t } = useI18n();

const props = defineProps<{
    nft: Collectible;
    previewMode: boolean; // controls whether video/audio can be played, and how those types are displayed
    tileMode: boolean;
    iconSize?: number; // only used in icon mode
}>();

// data
const nftTypes = {
    image: 'image',
    video: 'video',
    audio: 'audio',
    none: 'none',
};
const rootElement = ref<HTMLDivElement | null>(null);
const iconElement = ref<HTMLDivElement | null>(null);

const imageError = ref(false); // true if the image failed to load
const videoIsPlaying = ref(false);
const videoIsAtEnd = ref(false);
const videoElement = ref<HTMLVideoElement | null>(null);
const isMediaLoading = ref(true);
const passedMaxLoadingTime = ref(false);
const isHovering = ref(false);

// computed
const isIos = computed(() => platformStore.isIOSMobile);
const isMobile = computed(() => platformStore.isMobile);

// 'icon mode' is when the nft is displayed as an icon in a list, such as in the NFT inventory in table view
const isIconMode = computed(() => !props.tileMode && !props.previewMode);
const showHoverContainer = computed(() => isIconMode.value && isHovering.value);

const nftType = computed(() => {
    if (props.nft.imgSrc && !props.nft.audioSrc && !props.nft.videoSrc) {
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
    () => ([nftTypes.image, nftTypes.audio, nftTypes.none].includes(nftType.value) || props.previewMode) && props.nft.imgSrc,
);
const showPlaceholderCoverImage = computed(() => !props.nft.imgSrc);

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
        (nftType.value === nftTypes.audio && !props.nft.imgSrc) ||
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

// watchers
watch(props, () => {
    setIconSizeVariable();
}, {
    immediate: true,
});

onMounted(() => {
    setIconSizeVariable();

    setTimeout(() => {
        passedMaxLoadingTime.value = true;
    }, 5000);
});

// methods
function setIconSizeVariable() {
    rootElement.value?.style.setProperty('--list-icon-size', `${props.iconSize ?? 40}px`);
}

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

function calculateHoverPreviewPosition() {
    const root = rootElement.value;
    const iconContainerElement = iconElement.value;
    if (!root || !iconContainerElement) {
        return;
    }

    // the height of the chevron on the hover element that points to the root element
    const chevronHeight = 14;
    // the minimum padding between the hover element and the border of the window / the edge of the left navbar
    const padding = 16;
    // the width of the left nav
    const leftNavWidth = platformStore.__evm_nav_is_collapsed ? 0 : 300;
    // the height of the top navbar
    const navBarHeight = 64;
    // width of the chevron's base
    const chevronWidth = 17;

    const iconRect = iconContainerElement.getBoundingClientRect();
    const iconWidth = iconRect.width;
    const iconHeight = iconRect.height;
    const iconElementCenter = {
        x: iconRect.left + iconWidth / 2,
        y: iconRect.top + iconHeight / 2,
    };
    const hoverElementSize = 278;

    // true if there is enough room between the icon and navbar to fit the hover element; if false, the hover element will be shown below
    const hoverElementWillFitAbove = (iconRect.top > (hoverElementSize + chevronHeight + padding + navBarHeight));

    // the amount that the hover element would be clipped by the left nav / left side of the window
    const leftClipped = Math.max((leftNavWidth - (iconElementCenter.x - hoverElementSize / 2)), 0);
    const rightClipped = Math.max((iconElementCenter.x + hoverElementSize / 2) - document.documentElement.clientWidth, 0);
    const leftOffset = leftClipped ? leftClipped + padding : 0;
    const rightOffset = rightClipped ? rightClipped + padding : 0;

    // the 'left' value in pixels that has to be set on the chevron to center it over the NFT icon
    let chevronXOffset = hoverElementSize / 2 - chevronWidth / 2;

    if (leftOffset) {
        chevronXOffset -= leftOffset;
    } else if (rightOffset) {
        chevronXOffset += rightOffset;
    }

    root.style.setProperty('--hover-preview-x', `${iconElementCenter.x - hoverElementSize / 2 + leftOffset - rightOffset}px`);
    root.style.setProperty('--hover-preview-chevron-x', `${chevronXOffset}px`);

    if (hoverElementWillFitAbove) {
        root.style.setProperty('--hover-preview-y', `${iconElementCenter.y - iconHeight/2 - padding - hoverElementSize - 4}px`);
        root.style.setProperty('--hover-preview-chevron-y', `${hoverElementSize - 13.5}px`);
        root.style.setProperty('--hover-preview-chevron-rotation', '-45deg');

    } else {
        root.style.setProperty('--hover-preview-y', `${iconElementCenter.y + iconHeight / 2 + padding}px`);
        root.style.setProperty('--hover-preview-chevron-y', '-12px');
        root.style.setProperty('--hover-preview-chevron-rotation', '135deg');
    }
}

function setHoverPreviewVisibility(visible: boolean) {
    if (isMobile.value) {
        // never show the NFT preview on mobile
        isHovering.value = false;
        return;
    }

    // set position variables
    calculateHoverPreviewPosition();
    isHovering.value = visible;
}

function getIconSize(defaultSize: string) {
    if (props.iconSize) {
        return `${props.iconSize}px`;
    }

    return defaultSize;
}
</script>

<template>
<div
    ref="rootElement"
    :class="{
        'c-nft-viewer': true,
        'c-nft-viewer--icon-mode': isIconMode,
    }"
>
    <div
        v-if="props.tileMode"
        :class="{
            'c-nft-viewer__nft-container': true,
            'c-nft-viewer__nft-container--preview': previewMode,
            'c-nft-viewer__nft-container--video': nftType === nftTypes.video,
        }"
    >
        <div class="c-nft-viewer__media-container">
            <div
                v-if="showCoverImage"
                :class="{
                    'c-nft-viewer__image-container': true,
                    'c-nft-viewer__image-container--preview-mode': previewMode
                }"
            >
                <q-skeleton v-if="!passedMaxLoadingTime && isMediaLoading" type="rect" class="c-nft-viewer__image-loading" />
                <img
                    v-show="!showPlaceholderCoverImage && !isMediaLoading && !imageError"
                    :src="nft.imgSrc"
                    :alt="imageAlt"
                    class="c-nft-viewer__image"
                    @load="isMediaLoading = false"
                    @error="imageError = true"
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
                        :poster="nft.imgSrc"
                        playsinline
                        class="c-nft-viewer__video"
                        @loadeddata="isMediaLoading = false"
                    ></video>
                </div>
                <q-icon
                    v-if="(passedMaxLoadingTime && isMediaLoading) || (imageError && !isMediaLoading)"
                    :alt="`${$t('nft.broken_image')} ${imageAlt}`"
                    name="o_broken_image"
                    :size="getIconSize('md')"
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
                    :poster="nft.imgSrc"
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

            <template v-if="(!isMediaLoading && iconOverlayName) || (!nft.imgSrc && !nft.videoSrc)">
                <div class="c-nft-viewer__overlay-icon-bg shadow-2"></div>

                <q-icon
                    :name="iconOverlayName"
                    :size="getIconSize('lg')"
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
    <div
        v-else
        ref="iconElement"
        class="c-nft-viewer__icon-container"
        @mouseenter="setHoverPreviewVisibility(true)"
        @mouseleave="setHoverPreviewVisibility(false)"
    >
        <q-skeleton v-if="isMediaLoading && !passedMaxLoadingTime" type="rect" class="c-nft-viewer__list-image" />
        <q-icon
            v-else-if="nft.videoSrc"
            name="o_movie"
            :alt="imageAlt"
            :size="getIconSize('md')"
            color="grey-7"
            class="c-nft-viewer__list-image"
        />
        <q-icon
            v-else-if="(isMediaLoading && passedMaxLoadingTime) || (!nft.imgSrc) || imageError"
            name="o_broken_image"
            :alt="`${$t('nft.broken_image')} ${imageAlt}`"
            :size="getIconSize('md')"
            color="grey-7"
            class="c-nft-viewer__list-image"
        />
        <img
            v-show="!isMediaLoading && nft.imgSrc && !imageError"
            :src="nft.imgSrc"
            :alt="`${$t('nft.collectible')} ${imageAlt}`"
            class="c-nft-viewer__list-image"
            :height="iconSize ?? 40"
            :width="iconSize ?? 40"
            @load="isMediaLoading = false"
        >
    </div>
    <div v-if="showHoverContainer" class="c-nft-viewer__hover-container shadow-3">
        <div class="c-nft-viewer__image-container">
            <q-skeleton v-if="!passedMaxLoadingTime && isMediaLoading" type="rect" class="c-nft-viewer__image-loading" />
            <img
                v-show="!showPlaceholderCoverImage && !isMediaLoading"
                :src="nft.imgSrc"
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
                    :poster="nft.imgSrc"
                    playsinline
                    autoplay
                    muted
                    class="c-nft-viewer__video"
                    @loadeddata="isMediaLoading = false"
                ></video>
            </div>
            <q-icon
                v-if="passedMaxLoadingTime && isMediaLoading"
                :alt="`${$t('nft.broken_image')} ${imageAlt}`"
                name="o_broken_image"
                :size="getIconSize('md')"
                color="grey-7"
                class="c-nft-viewer__image"
            />
        </div>
    </div>
</div>

</template>
<style lang="scss">
.c-nft-viewer {
    $this: &;
    height: 100%;

    &--icon-mode {
        height: var(--list-icon-size);
        width: var(--list-icon-size);
    }

    &__nft-container {
        position: relative;
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        gap: 8px;

        &--preview {
            max-height: 270px;

            #{$this}__video-container {
                height: 100%;
            }

            #{$this}__image,
            #{$this}__video {
                height: 100%;
                width: 100%;
                max-height: unset;
                max-width: unset;
                object-fit: cover;
            }
        }

        &--video:hover:not(#{$this}--preview) {
            #{$this}__overlay-icon-bg,
            #{$this}__overlay-icon {
                transform: scale(1.1);
            }
        }
    }

    &__media-container {
        position: relative;
        height: 100%;
        width: 100%;
        display: flex;
        max-height: 80vh;
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
        &--preview-mode{
            height: 100%;
            max-height: 432px;
        }
    }

    &__image {
        border-radius: 4px;
        height: auto;
        width: auto;
        max-width: 100%;
    }

    &__image-loading {
        height: 100%;
        width: 100%;
    }

    &__list-image {
        border-radius: 4px;
        height: 100%;
        width: 100%;
        object-fit: cover;
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
        background-color: var(--accent-color-5);
        border: 1px solid var(--header-item-outline-color);
    }

    &__video-container {
        margin: auto;
        display: flex;
        max-height: 100%;
    }

    &__video {
        width: 100%;
        cursor: pointer;
        max-height: 100%;
    }

    &__audio {
        width: 100%;
        margin: auto;
        max-width: 432px;
        display: block;
        flex-shrink: 0;
    }

    &__icon-container {
        height: 100%;
        width: 100%;
    }

    &__hover-container {
        position: fixed;
        height: 278px;
        width: 278px;
        left: var(--hover-preview-x);
        top: var(--hover-preview-y);
        background: var(--accent-color-5);
        z-index: $z-index--nft-hover-preview;
        border-radius: 4px;
        padding: 8px;

        &::before {
            content: '';
            position: absolute;
            top: var(--hover-preview-chevron-y);
            left: var(--hover-preview-chevron-x);
            transform: rotate(var(--hover-preview-chevron-rotation));
            height: 24px;
            width: 24px;
            background: linear-gradient(45deg, var(--accent-color-5) 50%, transparent 50%);
            box-shadow: -3px 4px 5px -4px rgba(0,0,0,0.6);
        }
    }
}
</style>
