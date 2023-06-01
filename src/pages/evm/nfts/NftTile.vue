<script setup lang="ts">
import { computed } from 'vue';

import { ShapedNFT } from 'src/antelope/types/NFTs';

const genericHeadphoneIcon = ''; // eztodo replace with real icon
const genericImageIcon = '';

const props = defineProps<{
    nft: ShapedNFT,
}>();

// computed
// const showImagePlaceholder = computed(() => {
//
// });
//
// const showAudioPlaceholder = computed(() => {
//
// });


// the icon to display in the corner to indicate an NFT is a non-image type
// used for the 'name' attribute of q-icon
const nft = computed(() => props.nft);

const mediaOverlayIcon = computed(() => {
    if (nft.value.audioSrc && nft.value.imageSrcFull) {
        return 'headphones';
    }

    // video NFTs always have imageSrcFull due to shaping process
    if (nft.value.videoSrc) {
        return 'play_arrow';
    }

    return '';
});

const fullSizeIconName = computed(() => {
    if (!nft.value.imageSrcFull && nft.value.audioSrc) {
        return 'headphones';
    }

    if (!nft.value.imageSrcFull) {
        return 'image';
    }

    return '';
});

</script>

<template>
<div class="c-nft-tile">
    <div class="c-nft-tile__media-container">
        <video v-if="nft.videoSrc" autoplay="autoplay">
            <source :src="nft.videoSrc">
        </video>
        <img
            v-else-if="nft.imageSrcFull"
            :src="nft.imageSrcFull"
            :alt="`NFT Image - ${nft.name} ${nft.id}`"
            class="c-nft-tile__image"
        >
        <q-icon
            v-else
            :name="fullSizeIconName"
            size="xl"
            color="primary"
        />

    </div>
</div>
</template>

<style lang="scss">
.c-nft-tile {
    border-radius: 4px;
    border: 1px solid $page-header;
    padding: 16px 24px;

    &__image {
        margin: auto;
    }
}
</style>
