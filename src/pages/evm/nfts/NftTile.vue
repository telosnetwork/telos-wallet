<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

import { ShapedNFT } from 'src/antelope/types';
import { useChainStore } from 'src/antelope';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';

import NftViewer from 'pages/evm/nfts/NftViewer.vue';
import ExternalLink from 'components/ExternalLink.vue';

const chainSettings = useChainStore().currentChain.settings as EVMChainSettings;

const router = useRouter();
const { t } = useI18n();

const props = defineProps<{
    nft: ShapedNFT,
}>();

// data
const nftDetailsRoute = {
    name: 'evm-nft-details',
    query: {
        contract: props.nft.contractAddress,
        id: props.nft.id,
    },
};

// computed
const creatorLinkText = computed(() => props.nft.contractPrettyName || props.nft.contractAddress);
const creatorLinkUrl = computed(() => `${chainSettings.getExplorerUrl()}/address/${props.nft.contractAddress}`);
// hide ID text if the NFT name includes the ID, which is common
const showId = computed(() => !props.nft.name.includes(props.nft.id));

</script>

<template>
<div
    class="c-nft-tile"
>
    <router-link
        :to="nftDetailsRoute"
        :aria-label="t('nft.link_to_nft_details', { name: nft.name})"
        class="c-nft-tile__link"
    >
        <NftViewer
            :nft="nft"
            :preview-mode="true"
            :tile-mode="true"
        />
    </router-link>
    <div class="c-nft-tile__text-container">
        <h4 class="c-nft-tile__text">
            <span v-if="nft.name" class="u-text--high-contrast q-pr-sm">
                {{nft.name}}
            </span>
            <span v-if="showId" class="u-text--default-contrast">{{nft.id}}</span>
        </h4>
        <ExternalLink :text="creatorLinkText" :url="creatorLinkUrl" />
    </div>
</div>
</template>

<style lang="scss">
.c-nft-tile {
    border-radius: 4px;
    border: 1px solid var(--accent-color-6);
    padding: 16px 24px;

    display: flex;
    min-height: 320px;
    width: 320px;
    flex-direction: column;
    justify-content: space-between;
    gap: 16px;

    @include tiny-only {
        width: 288px;
    }

    &__text {
        text-overflow: ellipsis;
        overflow: hidden;
    }

    &__link {
        height: 100%;
        text-decoration: none;
    }
}
</style>
