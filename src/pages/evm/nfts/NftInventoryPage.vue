<script setup lang="ts">
import { computed, ref, watch, onBeforeMount, onMounted, onUnmounted, toRaw } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

import AppPage from 'components/evm/AppPage.vue';
import NftTile from 'pages/evm/nfts/NftTile.vue';
import ExternalLink from 'components/ExternalLink.vue';

import { useNftsStore } from 'src/antelope/stores/nfts';
import { useChainStore } from 'src/antelope';
import { NFTClass, ShapedNFT } from 'src/antelope/types';
import { useAccountStore } from 'src/antelope';

import { truncateText } from 'src/antelope/stores/utils/text-utils';

import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import TableControls from 'components/evm/TableControls.vue';
import { isAddress } from 'ethers/lib/utils.js';
import { truncateAddress } from 'src/antelope/stores/utils/text-utils';
import { storeToRefs } from 'pinia';


const nftStore = useNftsStore();
const chainStore = useChainStore();
const accountStore = useAccountStore();

const router = useRouter();
const route = useRoute();
const { t: $t } = useI18n();

const tile = 'tile';
const list = 'list';
const initialInventoryDisplayPreference = localStorage.getItem('nftInventoryDisplayPreference') || tile;

const tableColumns = [
    {
        name: 'image',
        field: 'image',
        label: '',
        align: 'left' as 'left',
    },
    {
        name: 'name',
        field: 'name',
        label: $t('global.name'),
        align: 'left' as 'left',
    },
    {
        name: 'id',
        field: 'id',
        label: $t('global.id'),
        align: 'left' as 'left',
    },
    {
        name: 'collection',
        field: 'collection',
        label: $t('global.collection'),
        align: 'left' as 'left',
    },
];

const rowsPerPageOptions = [6, 12, 24, 48, 96];

// data
const initialLoadComplete = ref(false);
const showNftsAsTiles = ref(initialInventoryDisplayPreference === tile);
const listImagesLoadingStates = ref<Record<string, boolean>>({});
const collectionFilter = ref('');
const searchFilter = ref('');
const searchbar = ref<HTMLElement | null>(null); // search input element
const pagination = ref<{
    page: number;
    rowsPerPage: number;
    rowsNumber: number;
}>({
    page: 1,
    rowsPerPage: 12,
    rowsNumber: 0,
});
const { __user_filter: userInventoryFilter } = storeToRefs(nftStore);

// computed
const loading = computed(() => nftStore.loggedInventoryLoading || !initialLoadComplete.value);
const nfts = computed(() => initialLoadComplete.value ? (nftStore.getUserFilteredInventory('logged') || [] as NFTClass[]) : []);
const nftsToShow = computed(() => {
    const { page, rowsPerPage } = pagination.value;
    const start = page === 1 ? 0 : (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return nfts.value.slice(start, end);
});
const collectionList = computed(() => nftStore.getCollectionList('logged') || []);
const collectionSelectOptions = computed(() => collectionList.value.map(item => item.name));
const tableRows = computed(() => {
    if (showNftsAsTiles.value) {
        return [];
    }

    return nftsToShow.value.map((nft: ShapedNFT) => ({
        image: nft.imageSrcIcon || nft.imageSrcFull,
        name: truncateText(nft.name, 35),
        isAudio: !!nft.audioSrc,
        isVideo: !!nft.videoSrc,
        id: nft.id,
        collectionName: nft.contractPrettyName || nft.contractAddress,
        collectionAddress: nft.contractAddress,
    }));
});
const showNoFilteredResultsState = computed(() => (collectionFilter.value || searchFilter.value) && !nftsToShow.value.length);


// watchers
watch(accountStore, (store) => {
    // fetch initial data
    if (store.loggedAccount) {
        nftStore.updateNFTsForAccount('logged', toRaw(store.loggedAccount)).finally(() => {
            initialLoadComplete.value = true;
        });
    }
},
{ immediate: true },
);

watch(showNftsAsTiles, (showAsTile) => {
    localStorage.setItem('nftInventoryDisplayPreference', showAsTile ? tile : list);
});

// eztodo change rows per page, go to another page, select collection from dropdown, does not behave as expected

watch(nfts, (list) => {
    // if NFTs are loaded...
    if (list.length && list.length === pagination.value.rowsNumber) {
        list.forEach((nft) => {
            // if an NFT icon in list view hasn't yet been loaded, enable the loading state for that image
            // the loading state will be ended when the @loaded event is fired by that image
            if (!showNftsAsTiles.value && listImagesLoadingStates.value?.[nft.id] !== false) {
                listImagesLoadingStates.value[nft.id] = true;
            }
        });
        return;
    }

    pagination.value.rowsNumber = list.length;
    const { rowsPerPage, page } = route.query;

    // if this is initial load and there are pagination query params, validate and apply them
    if (rowsPerPage && page && rowsPerPageOptions.includes(+rowsPerPage)) {
        pagination.value.rowsPerPage = +rowsPerPage;

        if ((+rowsPerPage * (+page - 1)) < list.length) {
            pagination.value.page = +page;
        } else {
            router.push({
                name: 'evm-nft-inventory',
                query: { },
            });
        }
    }
});

watch(pagination, ({ rowsPerPage, page }) => {
    router.push({
        name: 'evm-nft-inventory',
        query: {
            ...route.query,
            rowsPerPage,
            page,
        },
    });
});

watch(collectionList, (list, oldList) => {
    // the watcher for collection filter requires collectionList to be loaded because it needs to get the address for the selected collection
    // as such, we need to defer handling query params until collectionList is loaded
    if (list.length && !oldList.length) {
        nftStore.clearUserFilter();

        const { collection, search } = route.query;

        if (search) {
            searchFilter.value = search as string;
        }

        if (collection) {
            if (isAddress(collection as string)) {
                collectionFilter.value = truncateAddress(collection as string);
            } else {
                collectionFilter.value = collectionList.value.find(item => item.name === collection)?.name || '';
            }
        }

    }
});

watch(route, (newRoute) => {
    if (newRoute.name !== 'evm-nft-inventory') {
        return;
    }

    if (!newRoute.query.collection) {
        collectionFilter.value = '';
    }

    if (!newRoute.query.search) {
        searchFilter.value = '';
    }

    if (!newRoute.query.page) {
        pagination.value.page = 1;
    }

    if (!newRoute.query.rowsPerPage) {
        pagination.value.rowsPerPage = 12;
    }
});

watch(userInventoryFilter, (filter) => {
    pagination.value.page = 1;

    router.push({
        name: 'evm-nft-inventory',
        query: {
            rowsPerPage: pagination.value.rowsPerPage,
            collection: filter.collection,
            search: filter.searchTerm,
        },
    });
});

watch(collectionFilter, (collection) => {
    if (!collectionList.value?.length) {
        return;
    }

    // collectionFilter is a list of contract names and, for those with no name, addresses
    // so we need to get the address for the selected collection
    const collectionAddress = (collectionList.value.find(item => item.name === collection || item.contract === collection))?.contract || '';

    const currentFilter = nftStore.getUserFilter;

    nftStore.setUserFilter({
        ...currentFilter,
        collection: collectionAddress,
    });
});

watch(searchFilter, (filter) => {
    const currentFilter = nftStore.getUserFilter;

    nftStore.setUserFilter({
        ...currentFilter,
        searchTerm: filter,
    });
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

// we update the inventory while the user is on the page
let timer: string | number | NodeJS.Timer | undefined;
onMounted(async () => {
    timer = setInterval(async () => {
        if (accountStore.loggedAccount) {
            await nftStore.updateNFTsForAccount('logged', accountStore.loggedAccount);
        }
    }, 13000);
});

onUnmounted(() => {
    clearInterval(timer);
});

</script>

<template>
<AppPage>
    <template v-slot:header>
        <h1>{{ $t('evm_wallet.inventory') }}</h1>
    </template>

    <div class="c-nft-page">
        <div v-if="nfts.length === 0 && !loading && !showNoFilteredResultsState" class="c-nft-page__empty-inventory" >
            <h2 class="c-nft-page__empty-title">
                {{ $t('nft.empty_collection_title') }}
            </h2>
        </div>

        <div
            v-else-if="nfts.length || loading || showNoFilteredResultsState"
            class="c-nft-page__controls-container"
        >
            <q-select
                v-model="collectionFilter"
                :options="collectionSelectOptions"
                :disable="loading"
                :label="$t('global.collection')"
                outlined
                clearable
                class="c-nft-page__input"
            />

            <q-input
                ref="searchbar"
                v-model="searchFilter"
                :disable="loading"
                :label="$t('global.search')"
                outlined
                clearable
                class="c-nft-page__input"
            />

            <div class="c-nft-page__grid-toggles">
                <q-icon
                    size="sm"
                    name="o_format_list_bulleted"
                    :color="!showNftsAsTiles ? 'primary' : ''"
                    class="cursor-pointer"
                    tabindex="0"
                    role="button"
                    :aria-label="$t('nft.show_as_list_label')"
                    @click="showNftsAsTiles = false"
                    @keydown.space.enter.prevent="showNftsAsTiles = false"
                />
                <q-icon
                    size="sm"
                    name="o_grid_view"
                    :color="showNftsAsTiles ? 'primary' : ''"
                    class="cursor-pointer"
                    tabindex="0"
                    role="button"
                    :aria-label="$t('nft.show_as_tiles_label')"
                    @click="showNftsAsTiles = true"
                    @keydown.space.enter.prevent="showNftsAsTiles = true"
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

        <div v-else-if="showNoFilteredResultsState">
            <h4 class="text-center">{{ $t('global.no_results') }}</h4>
        </div>

        <div v-else-if="nfts.length">
            <div v-if="showNftsAsTiles" class="c-nft-page__tiles-container">
                <NftTile
                    v-for="nft in nftsToShow"
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
                            <div
                                class="c-nft-page__table-image-container"
                                role="link"
                                tabindex="0"
                                :aria-label="$t('nft.go_to_detail_page_label')"
                                @click="goToDetailPage(props.row)"
                                @keydown.space.enter.prevent="goToDetailPage(props.row)"
                            >
                                <template v-if="props.row.image">
                                    <q-skeleton
                                        v-if="listImagesLoadingStates[props.row.id]"
                                        type="rect"
                                        class="c-nft-page__list-image"
                                    />
                                    <img
                                        v-show="!listImagesLoadingStates[props.row.id]"
                                        :src="props.row.image"
                                        :alt="`${$t('nft.collectible')} ${props.row.id}`"
                                        class="c-nft-page__list-image"
                                        height="40"
                                        width="40"
                                        @load="listImagesLoadingStates[props.row.id] = false"
                                    >
                                </template>

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
                                {{ $t('nft.name_missing') }}
                            </template>
                        </q-td>
                        <q-td key="id" :props="props">
                            <span class="o-text--paragraph">
                                {{ truncateText(props.row.id) }}
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

            <TableControls
                class="q-mt-lg"
                :pagination="pagination"
                :rows-per-page-options="rowsPerPageOptions"
                @pagination-updated="pagination = $event"
            />
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

    &__list-image {
        border-radius: 4px;
        height: 40px;
        width: 40px;
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

    // quasar overrides
    .q-td,
    .q-th {
        &:first-of-type {
            width: 42px;
        }
    }
}
</style>
