<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { formatUnits } from 'ethers/lib/utils';

import AppPage from 'components/evm/AppPage.vue';
import AllowancesPageControls from 'pages/evm/allowances/AllowancesPageControls.vue';
import AllowancesTable from 'pages/evm/allowances/AllowancesTable.vue';
import CollapsibleAside from 'components/evm/CollapsibleAside.vue';

import { CURRENT_CONTEXT, useAccountStore, useAllowancesStore } from 'src/antelope';
import {
    AllowanceTableColumns,
    HUGE_ALLOWANCE_THRESHOLD,
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
            const localizedHuge = $t('global.huge').toLowerCase();
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
                    (Number(formatUnits(row.allowance, row.tokenDecimals)) > HUGE_ALLOWANCE_THRESHOLD && localizedHuge.includes(searchTextLower)) ||
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
</script>

<template>
<AppPage>
    <template v-slot:header>
        <h1 class="u-text--high-contrast">
            {{ $t('global.revoke') }}
        </h1>
    </template>

    <div class="c-allowances-page__body">
        <CollapsibleAside
            :header="asideHeader"
            :content="asideContent"
            class="q-mb-lg"
        />

        <AllowancesPageControls
            :enable-revoke-button="false"
            @search-updated="handleSearchUpdated"
            @include-cancelled-updated="handleIncludeCancelledUpdated"
        />

        <div v-if="loading" class="q-mt-lg">
            <q-skeleton
                v-for="i in 10"
                :key="`allowance-loading-row-${i}`"
                class="c-allowances-page__skeleton-row"
                type="rect"
            />
        </div>
        <AllowancesTable v-else :rows="shapedAllowanceRows" @sortChanged="handleSortChanged"/>
    </div>
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
