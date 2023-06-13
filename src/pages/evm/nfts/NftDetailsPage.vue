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
const loading = ref(true);

// eztodo handle invalid state / no query params / invalid query params

onBeforeMount(() => {
    nftStore.getNftDetails('current', route.query.contract as string, route.query.id as string).then((nftResponse) => {
        // eztodo remove fake loading time
        setTimeout(() => {
            nft.value = nftResponse ?? null;
            loading.value = false;
        }, 1500);
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
        <div class="c-nft-details__header-container">
            <template v-if="loading">
                <div class="c-nft-details__header-card c-nft-details__header-card--placeholder">
                    <q-skeleton type="rect" class="c-nft-details__header-skeleton" />
                </div>
                <div class="c-nft-details__header-card c-nft-details__header-card--placeholder">
                    <q-skeleton type="rect" class="c-nft-details__header-skeleton" />
                </div>
                <div class="c-nft-details__header-card c-nft-details__header-card--placeholder">
                    <q-skeleton type="rect" class="c-nft-details__header-skeleton" />
                </div>
                <div class="c-nft-details__header-card c-nft-details__header-card--placeholder">
                    <q-skeleton type="rect" class="c-nft-details__header-skeleton" />
                </div>
                <div class="c-nft-details__header-card c-nft-details__header-card--placeholder">
                    <q-skeleton type="rect" class="c-nft-details__header-skeleton" />
                </div>
            </template>

            <template v-else-if="nft === null">
                not found placeholder
            </template>

            <template v-else>
                <NftViewer :nft="nft" :preview-mode="false" class="c-nft-details__viewer" />
                <NftDetailsCard title="Collection" class="c-nft-details__header-card">
                    <ExternalLink :text="nft.contractPrettyName || nft.contractAddress" :url="contractLink" />
                </NftDetailsCard>

                <NftDetailsCard title="ID" class="c-nft-details__header-card">
                    {{ nft.id }}
                </NftDetailsCard>

                <NftDetailsCard title="Owner" class="c-nft-details__header-card">
                    <ExternalLink :text="nft.ownerAddress" :url="ownerLink" />
                </NftDetailsCard>

                <NftDetailsCard v-if="nft.description" title="Description" class="c-nft-details__header-card">
                    {{ nft.description }}
                </NftDetailsCard>
            </template>

        </div>
    </template>

    <div class="c-nft-details__body-container">
        <q-skeleton v-if="loading" type="text" class="c-nft-details__body-header-skeleton"/>
        <!--eztodo not found state-->
        <h4 v-else class="q-mb-lg">Attributes</h4>

        <div class="c-nft-details__attributes-container">
            <template v-if="loading">
                <q-skeleton
                    v-for="index in 9"
                    :key="`nft-detail-body-skeleton-${index}`"
                    class="c-nft-details__attribute-skeleton"
                />
            </template>

            <template v-else-if="nft === null">

            </template>

            <template v-else>
                <NftDetailsCard
                    v-for="(attribute, index) in nft.attributes"
                    :key="`nft-attr-${index}`"
                    :title="attribute.label"
                    class="q-mb-sm"
                >
                    {{ attribute.text }}
                </NftDetailsCard>
            </template>
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

    &__body-container {
        margin: auto;
        max-width: 1000px;
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

        &--placeholder {
            margin: auto;
            height: 80px;
            width: 100%;

            &:first-of-type {
                grid-area: a;
                width: 270px;
                height: 270px;

                @include md-and-up {
                    width: 432px;
                    height: 432px;
                }
            }
        }
    }

    &__header-skeleton {
        height: 100%;
        width: 100%;
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

    &__body-header-skeleton {
        width: 100%;
        height: 50px;
        max-width: 250px;
        margin-bottom: 24px;
    }

    &__attribute-skeleton {
        height: 100px;
    }
}
</style>
