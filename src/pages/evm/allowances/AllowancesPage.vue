<script setup lang="ts">
import {
    ref,
    computed,
    watch,
    onMounted,
    onBeforeUnmount,
    nextTick,
} from 'vue';
import { useI18n } from 'vue-i18n';

import AppPage from 'components/evm/AppPage.vue';
import AllowancesPageControls from 'pages/evm/allowances/AllowancesPageControls.vue';
import AllowancesTable from 'pages/evm/allowances/AllowancesTable.vue';
import CollapsibleAside from 'components/evm/CollapsibleAside.vue';

import { CURRENT_CONTEXT, useAccountStore, useAllowancesStore } from 'src/antelope';
import {
    AllowanceTableColumns,
    Sort,
    isErc20AllowanceRow,
} from 'src/antelope/types';

const { t: $t } = useI18n();
const allowanceStore = useAllowancesStore();

const asideHeader = $t('evm_allowances.aside_header');

const asideContent = [{
    text: $t('evm_allowances.aside_content_fragment_1'),
}, {
    text: $t('evm_allowances.aside_content_fragment_2_bold'),
    bold: true,
}, {
    text: $t('evm_allowances.aside_content_fragment_3'),
}, {
    text: $t('evm_allowances.aside_content_fragment_4_bold'),
    bold: true,
}, {
    text: $t('evm_allowances.aside_content_fragment_5'),
    bold: false,
}];

// data
const loading = ref(true);
const includeCancelledAllowances = ref(false);
const sort = ref<{ descending: boolean; sortBy: AllowanceTableColumns }>({
    descending: true,
    sortBy: AllowanceTableColumns.asset,
});
const searchText = ref('');
const timeout = ref<ReturnType<typeof setTimeout> | null>(null);
const selectedRows = ref<string[]>([]); // rows are keyed like: `${row.spenderAddress}-${tokenAddress/collectionAddress}${ isSingleErc721 ? `-${tokenId}` : ''}`
const showRevokeInProgressModal = ref(false);
const cancelBatchRevoke = ref<(() => void) | null>(null);
const cancelBatchRevokeButtonLoading = ref(false);
const batchRevokeAllowancesRemaining = ref(0);

// computed
const userAddress = computed(() => useAccountStore().currentAccount.account);
const shapedAllowanceRows = computed(() => {
    const {
        asset,
        value,
        allowance,
        spender,
        type,
    } = AllowanceTableColumns;
    const { sortBy } = sort.value;

    const order = sort.value.descending ? Sort.descending : Sort.ascending;
    const getterArgs: [string, Sort, boolean] = [CURRENT_CONTEXT, order, includeCancelledAllowances.value];

    let allowances;

    if (sortBy === asset) {
        allowances = allowanceStore.allowancesSortedByAssetQuantity(...getterArgs);
    } else if (sortBy === value) {
        allowances = allowanceStore.allowancesSortedByAllowanceFiatValue(...getterArgs);
    } else if (sortBy === allowance) {
        allowances = allowanceStore.allowancesSortedByAllowanceAmount(...getterArgs);
    } else if (sortBy === spender) {
        allowances = allowanceStore.allowancesSortedBySpender(...getterArgs);
    } else if (sortBy === type) {
        allowances = allowanceStore.allowancesSortedByAssetType(...getterArgs);
    } else {
        allowances = allowanceStore.allowancesSortedByLastUpdated(...getterArgs);
    }

    if (searchText.value) {
        allowances = allowances.filter((row) => {
            const searchTextLower = searchText.value.toLowerCase();
            const localizedNone = $t('global.none').toLowerCase();
            const localizedUnlimited = $t('global.unlimited').toLowerCase();
            const localizedAllowed = $t('global.allowed').toLowerCase();
            const localizedNotAllowed = $t('global.not_allowed').toLowerCase();

            const rowIsErc20 = isErc20AllowanceRow(row);

            let tokenNameMatches = false;
            let tokenContractMatches = false;
            let allowanceMatches = false;

            if (rowIsErc20) {
                tokenNameMatches = row.tokenSymbol.toLowerCase().includes(searchTextLower);
                tokenContractMatches = row.tokenAddress.toLowerCase().includes(searchTextLower);

                allowanceMatches =
                    row.allowance.toString().includes(searchTextLower) ||
                    (row.allowance.toString() === '0' && (localizedNone.includes(searchTextLower) || localizedNotAllowed.includes(searchTextLower))) ||
                    (row.allowance.gt(row.tokenMaxSupply) && localizedUnlimited.includes(searchTextLower)) ||
                    (row.allowance.toString() !== '0' && localizedAllowed.includes(searchTextLower));

            } else {
                tokenNameMatches =
                    (row.collectionName ?? '').toLowerCase().includes(searchTextLower) ||
                    row.collectionAddress.toLowerCase().includes(searchTextLower);

                tokenContractMatches = row.collectionAddress.toLowerCase().includes(searchTextLower);

                allowanceMatches =
                    (row.allowed && localizedAllowed.includes(searchTextLower)) ||
                    (!row.allowed && (localizedNotAllowed.includes(searchTextLower) || localizedNone.includes(searchTextLower)));
            }

            const spenderMatches =
                row.spenderAddress.toLowerCase().includes(searchTextLower) ||
                (row.spenderName ?? '').toLowerCase().includes(searchTextLower);

            return tokenNameMatches || allowanceMatches || spenderMatches || tokenContractMatches;
        });
    }

    return allowances;
});

const enableRevokeButton = computed(() => selectedRows.value.length > 0);

// watchers
watch(userAddress, (address) => {
    if (address) {
        loading.value = true;
        useAllowancesStore().fetchAllowancesForAccount(address).then(() => {
            loading.value = false;
        });
    }

}, { immediate: true });

// methods
onMounted(() => {
    timeout.value = setTimeout(() => {
        useAllowancesStore().fetchAllowancesForAccount(userAddress.value);
    }, 13000);
});

onBeforeUnmount(() => {
    if (timeout.value) {
        clearTimeout(timeout.value);
    }
});

function handleSearchUpdated(newSearchText: string) {
    searchText.value = newSearchText;
}

function handleIncludeCancelledUpdated(includeCancelled: boolean) {
    includeCancelledAllowances.value = includeCancelled;
}

function handleSortChanged(newSort: { descending: boolean, sortBy: AllowanceTableColumns }) {
    sort.value = {
        descending: newSort.descending,
        sortBy: newSort.sortBy,
    };
}

function handleSelectedRowsChange(newSelectedRows: Record<string, boolean>) {
    const selectedRowsTemp: string[] = [];

    Object.keys(newSelectedRows).forEach((key) => {
        if (newSelectedRows[key]) {
            selectedRowsTemp.push(key);
        }
    });
    selectedRows.value = selectedRowsTemp;
}

function handleRevokeSelectedClicked() {
    showRevokeInProgressModal.value = true;
    batchRevokeAllowancesRemaining.value = selectedRows.value.length;

    function handleRevokeCompleted(completed: number, remaining: number) {
        console.log('completed:', completed);
        console.log('remaining:', remaining);
        console.log('\n\n');

        batchRevokeAllowancesRemaining.value = remaining;
    }

    const {
        promise,
        cancelToken,
    } = useAllowancesStore().batchRevokeAllowances(selectedRows.value, userAddress.value, handleRevokeCompleted);

    cancelBatchRevoke.value = () => {
        cancelToken.cancel();
        showRevokeInProgressModal.value = false;
    };

    // eztodo close modal when user cancels from metamask
    // eztodo handle row already cancelled
    // eztodo set cancel button loading while waiting for tx?

    promise.finally(() => {
        cancelBatchRevokeButtonLoading.value = true;

        setTimeout(() => {
            useAllowancesStore().fetchAllowancesForAccount(userAddress.value).finally(() => {
                cancelBatchRevokeButtonLoading.value = false;
                showRevokeInProgressModal.value = false;

                nextTick(() => {
                    cancelBatchRevoke.value = null;
                    batchRevokeAllowancesRemaining.value = 0;
                });
            });
        }, 3000); // give the indexer a chance to catch up
    });
}
</script>

<template>
<AppPage>
    <template v-slot:header>
        <h1 class="u-text--high-contrast">
            {{ $t('nav.allowances') }}
        </h1>
    </template>

    <div class="c-allowances-page__body">
        <CollapsibleAside
            :header="asideHeader"
            :content="asideContent"
            class="q-mb-lg"
        />

        <AllowancesPageControls
            :enable-revoke-button="enableRevokeButton"
            @search-updated="handleSearchUpdated"
            @include-cancelled-updated="handleIncludeCancelledUpdated"
            @revoke-selected="handleRevokeSelectedClicked"
        />

        <div v-if="loading" class="q-mt-lg">
            <q-skeleton
                v-for="i in 10"
                :key="`allowance-loading-row-${i}`"
                class="c-allowances-page__skeleton-row"
                type="rect"
            />
        </div>
        <AllowancesTable
            v-else
            :rows="shapedAllowanceRows"
            @sort-changed="handleSortChanged"
            @selected-rows-changed="handleSelectedRowsChange"
        />
    </div>

    <q-dialog v-model="showRevokeInProgressModal" persistent>
        <q-card>
            <q-card-section>
                <h5 class="o-text--header-5">
                    {{
                        $t(
                            'evm_allowances.revoking_allowances_title',
                            { total: selectedRows.length, remaining: batchRevokeAllowancesRemaining },
                        )
                    }}
                </h5>
                <p>
                    {{ $t('evm_allowances.revoking_allowances_description') }}
                </p>
            </q-card-section>

            <q-card-actions align="right">
                <q-btn
                    :loading="cancelBatchRevokeButtonLoading"
                    color="primary"
                    :label="$t('global.cancel')"
                    @click="cancelBatchRevoke?.()"
                />
            </q-card-actions>
        </q-card>
    </q-dialog>
</AppPage>
</template>

<style lang="scss">
.c-allowances-page {
    &__body {
        max-width: 1000px;
        margin: auto;
    }

    &__skeleton-row {
        height: 48px;
        margin-bottom: 8px;
    }
}
</style>
