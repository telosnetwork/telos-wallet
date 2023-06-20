<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import AppPage from 'components/evm/AppPage.vue';
import NftTile from 'pages/evm/nfts/NftTile.vue';
import ExternalLink from 'components/ExternalLink.vue';

import { useNftsStore } from 'src/antelope/stores/nfts';
import { useChainStore } from 'src/antelope';

import { NFTClass, ShapedNFT } from 'src/antelope/types';
import { truncateText } from 'src/antelope/stores/utils/text-utils';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { useRouter } from 'vue-router';

const nftStore = useNftsStore();
const chainStore = useChainStore();

const router = useRouter();

const tile = 'tile';
const list = 'list';
const initialInventoryDisplayPreference = localStorage.getItem('nftInventoryDisplayPreference') || tile;

// eztodo i18n
const tableColumns = [
    { name: 'image', field: 'image', label: '', align: 'left' as 'left' },
    { name: 'name', field: 'name', label: 'Name', align: 'left' as 'left' },
    { name: 'id', field: 'id', label: 'ID', align: 'left' as 'left' },
    { name: 'collection', field: 'collection', label: 'Collection', align: 'left' as 'left' },
];

// data
const showNftsAsTiles = ref(initialInventoryDisplayPreference === tile);
const collectionFilter = ref('');
const collectionList = ref(['', 'Test', 'Test 2']);
const searchFilter = ref('');


// computed
const loading = computed(() => nftStore.loggedInventoryLoading);
// const loading = true;
const nfts = computed(() => nftStore.getInventory('logged')?.list || [] as NFTClass[]);
const tableRows = computed(() => nfts.value.map((nft: ShapedNFT) => ({
    image: nft.imageSrcIcon || nft.imageSrcFull,
    name: truncateText(nft.name, 35),
    isAudio: !!nft.audioSrc,
    isVideo: !!nft.videoSrc,
    id: truncateText(nft.id),
    collectionName: nft.contractPrettyName || nft.contractAddress,
    collectionAddress: nft.contractAddress,
})));


// watchers
watch(showNftsAsTiles, (showAsTile) => {
    localStorage.setItem('nftInventoryDisplayPreference', showAsTile ? tile : list);
});


// methods
function getCollectionUrl(address: string) {
    const explorer = (chainStore.currentChain.settings as EVMChainSettings).getExplorerUrl();

    return `${explorer}/address/${address}`;
}

function getListIconName({ isAudio, isVideo }: Record<string, boolean>) {
    if (isAudio) {
        return 'o_headphones';
    }

    if (isVideo) {
        return 'o_movie';
    }

    return 'o_image_not_supported';
}

function goToDetailPage({ collectionAddress, id }: Record<string, string>) {
    router.push({
        name: 'evm-nft-details',
        query: {
            contract: collectionAddress,
            id: id,
        },
    });
}

</script>

<template>
<AppPage>
    <template v-slot:header>
        <h1>{{ $t('evm_wallet.inventory') }}</h1>
    </template>

    <div class="c-nft-page">
        <!--eztodo i18n-->
        <div class="c-nft-page__controls-container">
            <q-select
                v-model="collectionFilter"
                :options="collectionList"
                :disable="loading"
                outlined
                label="Collection"
                class="c-nft-page__input"
            />

            <q-input
                v-model="searchFilter"
                :disable="loading"
                outlined
                label="Search"
                class="c-nft-page__input"
            >
                <template v-slot:append>
                    <q-icon
                        v-if="searchFilter !== ''"
                        name="close"
                        class="cursor-pointer"
                        @click="searchFilter = ''"
                    />
                    <q-icon name="search" />
                </template>
            </q-input>

            <div class="c-nft-page__grid-toggles">
                <!--eztodo aria, a11y-->
                <q-icon
                    size="sm"
                    name="o_format_list_bulleted"
                    :color="!showNftsAsTiles ? 'primary' : ''"
                    class="cursor-pointer"
                    @click="showNftsAsTiles = false"
                />
                <q-icon
                    size="sm"
                    name="o_grid_view"
                    :color="showNftsAsTiles ? 'primary' : ''"
                    class="cursor-pointer"
                    @click="showNftsAsTiles = true"
                />
            </div>
        </div>

        <div v-if="loading">
            <div v-if="showNftsAsTiles" class="c-nft-page__tiles-loading-container">
                <q-skeleton
                    v-for="index in 25"
                    :key="`loading-tile-${index}`"
                    type="rect"
                    class="c-nft-page__tile-skeleton"
                />
            </div>

            <template v-else>
                <div
                    v-for="index in 25"
                    :key="`loading-row-${index}`"
                    class="c-nft-page__list-loading-container"
                >
                    <q-skeleton type="rect" class="c-nft-page__list-skeleton-icon" />
                    <q-skeleton type="rect" class="c-nft-page__list-skeleton-row" />
                </div>
            </template>
        </div>

        <div v-else>
            <div v-if="nfts.length === 0" class="c-nft-page__empty-inventory" >
                <h2 class="c-nft-page__empty-title">{{ $t('nft.empty_collection_title') }}</h2>
                <p class="c-nft-page__empty-text">{{ $t('nft.empty_collection_message') }} <ExternalLink :text="$t('nft.empty_collection_link_text')" :url="'contractLink'" /></p>
            </div>

            <div v-if="showNftsAsTiles" class="c-nft-page__tiles-container">
                <NftTile
                    v-for="nft in nfts"
                    :key="nft.key"
                    :nft="nft"
                />
            </div>

            <q-table
                v-else
                :columns="tableColumns"
                :rows="tableRows"
                :pagination="{ rowsPerPage: 0 }"
                hide-pagination
                flat
            >
                <template v-slot:header="props">
                    <q-tr :props="props">
                        <q-th
                            v-for="col in props.cols"
                            :key="col.name"
                            :props="props"
                            class="o-text--paragraph u-text--default-contrast"
                        >
                            {{ col.label }}
                        </q-th>
                    </q-tr>
                </template>

                <template v-slot:body="props">
                    <q-tr :props="props">
                        <q-td key="image" :props="props">
                            <!--eztodo alt-->
                            <!--eztodo a11y-->
                            <div class="c-nft-page__table-image-container" @click="goToDetailPage(props.row)">
                                <img
                                    v-if="props.row.image"
                                    :src="props.row.image"
                                    height="40"
                                    width="40"
                                >
                                <q-icon
                                    v-else
                                    :name="getListIconName(props.row)"
                                    size="md"
                                    color="grey-7"
                                />
                            </div>
                        </q-td>
                        <q-td key="name" :props="props">
                            <span v-if="props.row.name" class="o-text--paragraph-bold u-text--default-contrast">
                                {{ props.row.name }}
                            </span>
                            <template v-else>
                                <!--eztodo i18n-->
                                (No name)
                            </template>
                        </q-td>
                        <q-td key="id" :props="props">
                            <span class="o-text--paragraph">
                                {{ props.row.id }}
                            </span>
                        </q-td>
                        <q-td key="collection" :props="props">
                            <ExternalLink
                                :text="props.row.collectionName"
                                :url="getCollectionUrl(props.row.collectionAddress)"
                            />
                        </q-td>
                    </q-tr>
                </template>
            </q-table>
        </div>
    </div>


</AppPage>
</template>

<style lang="scss">
.c-nft-page {
    max-width: 1000px;
    margin: auto;

    &__controls-container {
        margin: 24px 0;
        display: flex;
        gap: 8px;
        flex-direction: column;
        align-items: center;

        @include md-and-up {
            flex-direction: row;
            margin: 16px 0 32px;
        }
    }

    &__empty-inventory {
        text-align: center;
        margin: auto;
        margin-top: 50px;
    }

    &__empty-title {
    }

    &__empty-text {
        margin-top: 20px;
    }

    &__input {
        width:  clamp(275px, 100%, 375px);

        @include md-and-up {
            flex-basis: 100%;
        }
    }

    &__grid-toggles {
        width: 100%;
        max-width: 375px;
        display: flex;
        gap: 8px;
        justify-content: center;
        margin-top: 16px;

        @include md-and-up {
            margin-top: unset;
            justify-content: flex-end;
        }
    }

    &__tiles-container,
    &__tiles-loading-container {
        width: max-content;
        margin: auto;
        display: grid;
        gap: 16px;
        grid-template-columns: 1fr;

        @media only screen and (min-width: 700px) {
            grid-template-columns: 1fr 1fr;
        }

        @media only screen and (min-width: 1400px) {
            grid-template-columns: 1fr 1fr 1fr;
        }
    }

    &__image-col-header {
        width: 42px;
    }

    &__table-image-container {
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
    }

    &__tile-skeleton {
        margin: auto;
        width: 280px;
        height: 280px;
    }

    &__list-loading-container {
        display: flex;
        gap: 8px;
        margin-bottom: 8px;
    }

    &__list-skeleton-icon {
        height: 40px;
        width: 40px;
    }

    &__list-skeleton-row {
        flex-basis: 100%;
        flex-shrink: 1;
    }
}
</style>
