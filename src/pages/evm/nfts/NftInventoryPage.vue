<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

import AppPage from 'components/evm/AppPage.vue';
import NftTile from 'pages/evm/nfts/NftTile.vue';
import NftViewer from 'src/components/evm/nfts/NftViewer.vue';
import ExternalLink from 'components/ExternalLink.vue';

import { useNftsStore } from 'src/antelope/stores/nfts';
import { CURRENT_CONTEXT, useChainStore } from 'src/antelope';
import { Collectible, Erc1155Nft } from 'src/antelope/types';
import { useAccountStore } from 'src/antelope';

import { truncateText } from 'src/antelope/stores/utils/text-utils';

import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import TableControls from 'components/evm/TableControls.vue';
import { truncateAddress } from 'src/antelope/stores/utils/text-utils';

const nftStore = useNftsStore();
const chainStore = useChainStore();
const accountStore = useAccountStore();
const chainSettings = (chainStore.currentChain.settings as EVMChainSettings);

chainSettings.checkAndWarnIndexerHealth();

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
    {
        name: 'quantity',
        field: 'quantity',
        label: $t('global.quantity'),
        align: 'left' as 'left',
    },
];

const rowsPerPageOptions = [6, 12, 24, 48, 96];

// data
const nftsLoaded = ref(false); // because the account is not necessarily loaded when the page loads, we need to wait for it to load before we can fetch the NFTs
const initialQueryParamsApplied = ref(false);
const showNftsAsTiles = ref(initialInventoryDisplayPreference === tile);
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
const userAccount = computed(() => accountStore.loggedAccount?.account);
const loading = computed(() => nftStore.loggedInventoryLoading || !nftsLoaded.value || Boolean(!collectionList.value.length && nfts.value.length));
const nftsAndCollectionListLoaded = computed(() => nftsLoaded.value && collectionList.value.length);
const nfts = computed(() => nftsLoaded.value ? (nftStore.getUserFilteredInventory(CURRENT_CONTEXT) as Collectible[]) : []);
const nftsToShow = computed(() => {
    const { page, rowsPerPage } = pagination.value;
    const start = page === 1 ? 0 : (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return nfts.value.slice(start, end);
});
const collectionList = computed(() => nftStore.getCollectionList(CURRENT_CONTEXT) || []);
const collectionSelectOptions = computed(() => collectionList.value.map(item => item.name));
const tableRows = computed(() => {
    if (showNftsAsTiles.value) {
        return [];
    }

    return nftsToShow.value.map((nft: Collectible) => ({
        image: nft.imgSrc,
        name: truncateText(nft.name, 35),
        isAudio: !!nft.audioSrc,
        isVideo: !!nft.videoSrc,
        id: nft.id,
        collectionName: nft.contractPrettyName || nft.contractAddress,
        collectionAddress: nft.contractAddress,
        quantity: nft instanceof Erc1155Nft ? (nft.owners[userAccount.value] ?? 0) : 1,
    }));
});
const showNoFilteredResultsState = computed(() => (collectionFilter.value || searchFilter.value) && !nftsToShow.value.length);


// watchers
watch(nftsAndCollectionListLoaded, (loaded) => {
    if (loaded) {
        // if this is initial load and there are pagination query params, validate and apply them
        const { rowsPerPage, page, collection, search } = route.query;

        let newRowsPerPage = 12;
        let newPage = 1;

        if (rowsPerPage && rowsPerPageOptions.includes(+(rowsPerPage ?? 12))) {
            newRowsPerPage = +(rowsPerPage ?? 12);
        }

        // if the page query param is valid (not greater than the total number of pages), apply it
        const newPageIsNotPastLastPage = page && (newRowsPerPage * (+page - 1)) < nfts.value.length;
        if (newPageIsNotPastLastPage) {
            newPage = +page;
        }

        pagination.value = {
            rowsNumber: nfts.value.length,
            page: newPage,
            rowsPerPage: newRowsPerPage,
        };

        // on initial load, if there are collection or search query params, apply them to the inputs
        if (search) {
            searchFilter.value = search as string;
        }

        if (collection) {
            const collectionPrettyName = collectionList.value.find(item => item.contract === collection)?.name;

            if (collectionPrettyName) {
                collectionFilter.value = collectionPrettyName;
            } else {
                collectionFilter.value = truncateAddress(collection as string);
            }
        }

        nftStore.setUserFilter({
            collection: (collection ?? '') as string,
            searchTerm: (search ?? '') as string,
        });

        initialQueryParamsApplied.value = true;
    }
});

watch(userAccount, (account, oldAccount) => {
    const accountChanged = account !== oldAccount;
    const isFirstLoad = oldAccount === undefined;

    // fetch initial data / fetchdata when account changes
    if (account && (accountChanged || isFirstLoad)) {
        nftStore.updateNFTsForAccount(CURRENT_CONTEXT, account).finally(() => {
            nftsLoaded.value = true;
        });
    }
},
{ immediate: true },
);

watch(showNftsAsTiles, (showAsTile) => {
    localStorage.setItem('nftInventoryDisplayPreference', showAsTile ? tile : list);
});

watch(pagination, ({ rowsPerPage, page }) => {
    router.replace({
        name: 'evm-nft-inventory',
        query: {
            ...route.query,
            rowsPerPage,
            page,
        },
    });
});

watch(route, (newRoute) => {
    if (newRoute.name !== 'evm-nft-inventory') {
        return;
    }

    if (newRoute.query.collection) {
        const collectionPrettyName = collectionList.value.find(item => item.contract === newRoute.query.collection)?.name;
        if (collectionPrettyName) {
            collectionFilter.value = collectionPrettyName;
        } else {
            collectionFilter.value = truncateAddress(newRoute.query.collection as string);
        }
    } else {
        collectionFilter.value = '';
    }

    searchFilter.value = (newRoute.query.search ?? '') as string;

    pagination.value = {
        page: +(newRoute.query.page ?? 1),
        rowsPerPage: +(newRoute.query.rowsPerPage ?? 12),
        rowsNumber: nfts.value.length,
    };
});

watch(userInventoryFilter, (filter) => {
    let page = pagination.value.page;
    if (initialQueryParamsApplied.value && (filter.collection || filter.searchTerm)) {
        page = 1;
    }

    router.replace({
        name: 'evm-nft-inventory',
        query: {
            rowsPerPage: pagination.value.rowsPerPage,
            page,
            collection: filter.collection,
            search: filter.searchTerm,
        },
    });
});

watch(collectionFilter, (collection) => {
    // collectionFilter is a list of contract names and, for those with no name, addresses
    // so we need to get the address for the selected collection
    const collectionAddress = (collectionList.value.find(item => item.name === collection || item.contract === collection))?.contract || '';

    const currentFilter = nftStore.getUserFilter;

    if (currentFilter.collection !== collectionAddress) {
        nftStore.setUserFilter({
            ...currentFilter,
            collection: collectionAddress,
        });
    }
});

watch(searchFilter, (filter) => {
    const currentFilter = nftStore.getUserFilter;

    if (currentFilter.searchTerm !== filter) {
        nftStore.setUserFilter({
            ...currentFilter,
            searchTerm: filter,
        });
    }
});

// methods
function getCollectionUrl(address: string) {
    const explorer = chainSettings.getExplorerUrl();

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

function getNftForViewer(row: { id: string, collectionAddress: string }) {
    // nft definitely exists as it comes from the list of NFTs, hence 'as NFTClass' for NftViewer prop typing
    return nftsToShow.value.find(nft => nft.id === row.id && nft.contractAddress === row.collectionAddress) as Collectible;
}

// we update the inventory while the user is on the page
let timer: ReturnType<typeof setInterval> | undefined;
const minuteMilliseconds = 1000 * 60;
onMounted(async () => {
    timer = setInterval(async () => {
        if (accountStore.loggedAccount) {
            await nftStore.updateNFTsForAccount(CURRENT_CONTEXT, accountStore.loggedAccount.account);
        }
    }, minuteMilliseconds);
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
                    :quantity="nft instanceof Erc1155Nft ? (nft.owners[userAccount] ?? 0) : 1"
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
                                <template v-if="props.row.image || props.row.isVideo">
                                    <NftViewer
                                        :nft="getNftForViewer(props.row)"
                                        :previewMode="false"
                                        :tileMode="false"
                                    />
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
                        <q-td key="quantity" :props="props">
                            {{ props.row.quantity }}
                        </q-td>
                    </q-tr>
                </template>
            </q-table>

            <TableControls
                class="q-mt-lg"
                :pagination="pagination"
                :rows-per-page-options="rowsPerPageOptions"
                :row-label="'nft.collectibles_per_page'"
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
