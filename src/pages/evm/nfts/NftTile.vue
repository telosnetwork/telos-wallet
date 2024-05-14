<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { Collectible } from 'src/antelope/types';
import { useChainStore } from 'src/antelope';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';

import NftViewer from 'src/components/evm/nfts/NftViewer.vue';
import ExternalLink from 'components/ExternalLink.vue';
import ToolTip from 'components/ToolTip.vue';
import { abbreviateNumber, getShapedNftName } from 'src/antelope/stores/utils/text-utils';

const chainSettings = useChainStore().currentChain.settings as EVMChainSettings;

const { t } = useI18n();

const props = defineProps<{
    nft: Collectible,
    quantity: number,
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
const nftName = computed(() => getShapedNftName(props.nft.name, props.nft.id));
const nftQuantityText = computed(() => abbreviateNumber(navigator.language, props.quantity));

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
        <div v-if="quantity > 1" class="c-nft-tile__quantity-badge">
            <ToolTip :text="quantity.toString()" :hide-icon="true">
                x{{ nftQuantityText }}
            </ToolTip>
        </div>
    </router-link>
    <div class="c-nft-tile__text-container">
        <h4 class="c-nft-tile__text">
            <span v-if="nft.name" class="u-text--high-contrast q-pr-sm">
                {{ nftName }}
            </span>
            <span class="u-text--default-contrast">{{nft.id}}</span>
        </h4>
        <ExternalLink :text="creatorLinkText" :url="creatorLinkUrl" />
    </div>
</div>
</template>

<style lang="scss">
.c-nft-tile {
    border-radius: 4px;
    border: 1px solid var(--border-over-header-color);
    background-color: var(--card-background-color);
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
        position: relative;
    }

    &__quantity-badge {
        @include text--small-bold;

        position: absolute;
        bottom: 0;
        right: 0;
        height: 32px;
        width: 56px;
        display: flex;
        justify-content: center;
        align-items: center;
        background: var(--bg-color);
        border-radius: 4px 0 0 0;
        color: var(--accent-color-2);
    }
}
</style>
