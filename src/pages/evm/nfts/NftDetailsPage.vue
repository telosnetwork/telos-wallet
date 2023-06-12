<script setup lang="ts">
import AppPage from 'components/evm/AppPage.vue';
import { useNftsStore } from 'src/antelope/stores/nfts';
import { useRoute } from 'vue-router';
import { ShapedNFT } from 'src/antelope/types/NFTs';
import { computed, onBeforeMount, ref } from 'vue';
import NftViewer from 'pages/evm/nfts/NftViewer.vue';
import NftDetailsCard from 'pages/evm/nfts/NftDetailsCard.vue';
import ExternalLink from 'components/ExternalLink.vue';
import { useChainStore } from 'src/antelope';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';

const route = useRoute();

const nftStore = useNftsStore();
const chainStore = useChainStore();

const nft = ref<ShapedNFT | null>(null);

// eztodo handle invalid state / no query params / invalid query params

onBeforeMount(() => {
    nftStore.getNftDetails('current', route.query.contract as string, route.query.id as string).then((nftResponse) => {
        nft.value = nftResponse ?? null;
    });
});

// data
const explorerUrl = (chainStore.currentChain.settings as EVMChainSettings).getExplorerUrl();


// computed
const contractLink = computed(() => {
    if (!nft.value) {
        return '';
    }

    return `${explorerUrl}/address/${nft.value.contractAddress}`;
});

const ownerLink = computed(() => {
    if (!nft.value) {
        return '';
    }

    return `${explorerUrl}/address/${nft.value.contractAddress}`;
});

</script>

<template>
<AppPage>
    <!--eztodo i18n-->
    <template v-slot:header>
        <div v-if="!nft">
            <!--eztodo loading state-->
            NFT not found placeholder
        </div>
        <div v-else class="c-nft-details__header-container">
            <NftViewer :nft="nft" :preview-mode="false" class="c-nft-details__viewer" />
            <NftDetailsCard title="Collection" class="c-nft-details__header-card">
                <ExternalLink :text="nft.contractPrettyName || nft.contractAddress" :url="contractLink" />
            </NftDetailsCard>

            <NftDetailsCard title="ID" class="c-nft-details__header-card">
                {{ nft.id }}
            </NftDetailsCard>

            <NftDetailsCard title="Owner" class="c-nft-details__header-card">
                <ExternalLink :text="nft.ownerAddress" :url="contractLink" />
            </NftDetailsCard>

            <NftDetailsCard v-if="nft.description" title="Description" class="c-nft-details__header-card">
                {{ nft.description }}
            </NftDetailsCard>
        </div>
    </template>

    <div v-if="!nft">
        <!--eztodo loading state-->
        NFT not found placeholder
    </div>

    <div v-else>
        <h4 class="q-mb-lg">Attributes</h4>

        <div class="c-nft-details__attributes-container">
            <NftDetailsCard
                v-for="(attribute, index) in nft.attributes"
                :key="`nft-attr-${index}`"
                :title="attribute.label"
                class="q-mb-sm"
            >
                {{ attribute.text }}
            </NftDetailsCard>
        </div>
    </div>

</AppPage>
</template>

<style lang="scss">
.c-nft-details {
    &__header-container {
        display: grid;
        grid-template-areas:
                'a'
                'b'
                'c'
                'd'
                'e';
        gap: 8px;
        width: 100%;

        @include sm-and-up {
            grid-template-areas:
                'a a'
                'b b'
                'c d'
                'e e';
            max-width: 432px;
        }

        @include md-and-up {
            grid-template-areas:
                'a a a b b'
                'a a a c d'
                'a a a e e'
                'a a a . .';
            max-width: 1000px;
            width: max-content;
            grid-template-columns: repeat(5, 1fr);
        }
    }

    &__viewer {
        grid-area: a;
    }

    &__header-card {
        &:nth-of-type(2) {
            grid-area: b;
        }

        &:nth-of-type(3) {
            grid-area: c;
        }

        &:nth-of-type(4) {
            grid-area: d;
        }

        &:nth-of-type(5) {
            grid-area: e;
        }
    }

    &__attributes-container {
        display: grid;
        gap: 8px;
        grid-template-columns: 1fr;

        @include sm-and-up {
            grid-template-columns: 1fr 1fr;
        }

        @include md-and-up {
            grid-template-columns: 1fr 1fr 1fr;
        }
    }
}
</style>
