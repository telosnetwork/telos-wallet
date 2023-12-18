<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import {
    AllowanceTableColumns,
    ShapedAllowanceRow,
    isErc20AllowanceRow,
    isErc721SingleAllowanceRow,
} from 'src/antelope/types/Allowances';
import { useUserStore } from 'src/antelope';
import { getCurrencySymbol } from 'src/antelope/stores/utils/currency-utils';

import AllowancesTableRow from 'pages/evm/allowances/AllowancesTableRow.vue';
import TableControls from 'components/evm/TableControls.vue';

const props = defineProps<{
    rows: ShapedAllowanceRow[];
}>();

const emit = defineEmits(['sortChanged', 'selectedRowsChanged']);

const { t: $t } = useI18n();
const { fiatLocale, fiatCurrency } = useUserStore();

const fiatSymbol = getCurrencySymbol(fiatLocale, fiatCurrency);

// data
const revokeAllCheckboxChecked = ref(false);
const pagination = ref({
    page: 1,
    rowsPerPage: 10,
    rowsNumber: props.rows.length,
    sortBy: AllowanceTableColumns.asset,
    descending: true,
});
const revokeCheckboxesModel = ref<Record<string, boolean>>({});

const tableColumns = [
    {
        name: AllowanceTableColumns.revoke,
        field: AllowanceTableColumns.revoke,
        label: '',
        align: 'left' as 'left',
    },
    {
        name: AllowanceTableColumns.asset,
        field: AllowanceTableColumns.asset,
        label: $t('global.asset'),
        align: 'left' as 'left',
    },
    {
        name: AllowanceTableColumns.value,
        field: AllowanceTableColumns.value,
        label: `${$t('global.value')} (${fiatSymbol})`,
        align: 'left' as 'left',
    },
    {
        name: AllowanceTableColumns.allowance,
        field: AllowanceTableColumns.allowance,
        label: $t('evm_allowances.allowance'),
        align: 'left' as 'left',
    },
    {
        name: AllowanceTableColumns.spender,
        field: AllowanceTableColumns.spender,
        label: $t('evm_allowances.authorized_spender'),
        align: 'left' as 'left',
    },
    {
        name: AllowanceTableColumns.type,
        field: AllowanceTableColumns.type,
        label: $t('global.type'),
        align: 'left' as 'left',
    },
    {
        name: AllowanceTableColumns.updated,
        field: AllowanceTableColumns.updated,
        label: $t('global.last_updated'),
        align: 'left' as 'left',
    },
];

// computed
const tableRows = computed(() => {
    const { page, rowsPerPage } = pagination.value;
    const start = page === 1 ? 0 : (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return props.rows.slice(start, end);
});

// watchers
watch(tableRows, (newRows) => {
    revokeCheckboxesModel.value = newRows.reduce((acc, row) => {
        const rowIsErc20 = isErc20AllowanceRow(row);
        const rowIsSingleErc721 = isErc721SingleAllowanceRow(row);
        const tokenAddress = rowIsErc20 ? row.tokenAddress : row.collectionAddress;
        const tokenId = rowIsSingleErc721 ? `-${row.tokenId}` : '';

        acc[`${row.spenderAddress}-${tokenAddress}${tokenId}`] = false;
        return acc;
    }, {} as Record<string, boolean>);

    revokeAllCheckboxChecked.value = false;
    updateAllRevokeCheckboxes();
    pagination.value.rowsNumber = props.rows.length;
}, { immediate: true });

watch(revokeCheckboxesModel, () => {
    emit('selectedRowsChanged', revokeCheckboxesModel.value);
}, { deep: true });

// methods
function getAriaLabelForTh(columnName: AllowanceTableColumns) {
    const { descending, sortBy } = pagination.value;

    const labelSaysDescending = (!descending && sortBy === columnName) || sortBy !== columnName;

    const {
        asset,
        value,
        allowance,
        spender,
        type,
    } = AllowanceTableColumns;

    let columnDescription = '';
    if (columnName === asset) {
        columnDescription = $t('evm_allowances.column_description_asset');
    } else if (columnName === value) {
        columnDescription = $t('evm_allowances.column_description_value');
    } else if (columnName === allowance) {
        columnDescription = $t('evm_allowances.column_description_allowance');
    } else if (columnName === spender) {
        columnDescription = $t('evm_allowances.column_description_spender');
    } else if (columnName === type) {
        columnDescription = $t('evm_allowances.column_description_asset_type');
    } else {
        columnDescription = $t('evm_allowances.column_description_updated');
    }

    return labelSaysDescending ?
        $t('global.sort_by_descending', { column: columnDescription }) :
        $t('global.sort_by_ascending', { column: columnDescription });
}

function getKeyForRow(row: ShapedAllowanceRow) {
    const rowIsErc20 = isErc20AllowanceRow(row);
    const rowIsSingleErc721 = isErc721SingleAllowanceRow(row);
    const tokenAddress = rowIsErc20 ? row.tokenAddress : row.collectionAddress;
    const tokenId = rowIsSingleErc721 ? `-${row.tokenId}` : '';

    return `${row.spenderAddress}-${tokenAddress}${tokenId}`;
}

// normally, we would use the q-table's @request event to handle sorting. However, the table was failing to react to changes
// in the sort object. This is a workaround.
function handleThClick(columnName: AllowanceTableColumns) {
    let newDescending;

    if (columnName === pagination.value.sortBy) {
        pagination.value.descending = !pagination.value.descending;
        newDescending = pagination.value.descending;
    } else {
        pagination.value.sortBy = columnName;
        pagination.value.descending = true;
        newDescending = true;
    }

    emit('sortChanged', { descending: newDescending, sortBy: columnName });
}

function updateAllRevokeCheckboxes() {
    const { value: checked } = revokeAllCheckboxChecked;
    Object.keys(revokeCheckboxesModel.value).forEach((key) => {
        revokeCheckboxesModel.value[key] = checked;
    });
}

function getCheckboxModelForRow(row: ShapedAllowanceRow) {
    const rowIsErc20 = isErc20AllowanceRow(row);
    const rowIsSingleErc721 = isErc721SingleAllowanceRow(row);
    const tokenAddress = rowIsErc20 ? row.tokenAddress : row.collectionAddress;
    const tokenId = rowIsSingleErc721 ? `-${row.tokenId}` : '';

    return revokeCheckboxesModel.value[`${row.spenderAddress}-${tokenAddress}${tokenId}`];
}

function toggleRevokeChecked(row: ShapedAllowanceRow) {
    const rowIsErc20 = isErc20AllowanceRow(row);
    const rowIsSingleErc721Row = isErc721SingleAllowanceRow(row);

    const tokenAddress = rowIsErc20 ? row.tokenAddress : row.collectionAddress;
    let key = `${row.spenderAddress}-${tokenAddress}`;

    if (rowIsSingleErc721Row) {
        key += `-${row.tokenId}`;
    }

    // rows are keyed like: `${row.spenderAddress}-${tokenAddress/collectionAddress}${ isSingleErc721 ? `-${tokenId}` : ''}`
    revokeCheckboxesModel.value[key] = !revokeCheckboxesModel.value[key];

    if (!revokeCheckboxesModel.value[key]) {
        revokeAllCheckboxChecked.value = false;
    }

    if (Object.values(revokeCheckboxesModel.value).every(value => value)) {
        revokeAllCheckboxChecked.value = true;
    }
}
</script>

<template>
<q-table
    :columns="tableColumns"
    :rows="tableRows"
    :pagination="pagination"
    binary-state-sort
    hide-pagination
    flat
    class="q-mb-md"
>
    <template v-slot:header="props">
        <q-tr :props="props">
            <q-th
                v-for="col in props.cols"
                :key="col.name"
                :props="props"
                class="o-text--paragraph u-text--default-contrast"
            >
                <div v-if="col.name === AllowanceTableColumns.revoke" class="flex items-center">
                    <q-checkbox
                        v-model="revokeAllCheckboxChecked"
                        :aria-label="$t('evm_allowances.revoke_all_checkbox_aria_label')"
                        size="xs"
                        @update:model-value="updateAllRevokeCheckboxes"
                    />
                </div>
                <div
                    v-else
                    class="c-allowances-table__th-container"
                    tabindex="0"
                    :aria-label="getAriaLabelForTh(col.name)"
                    @click="handleThClick(col.name)"
                    @keydown.enter.space.prevent="handleThClick(col.name)"
                >
                    {{ col.label }}
                    <q-icon
                        :class="{
                            'c-allowances-table__sort-icon': true,
                            'c-allowances-table__sort-icon--active': pagination.sortBy === col.name,
                            'c-allowances-table__sort-icon--descending': (pagination.descending && pagination.sortBy === col.name) || pagination.sortBy !== col.name,
                        }"
                        name="arrow_upward"
                    />
                </div>
            </q-th>
        </q-tr>
    </template>

    <template v-slot:body="props">
        <AllowancesTableRow
            :key="getKeyForRow(props.row)"
            :row="props.row"
            :revokeChecked="getCheckboxModelForRow(props.row)"
            @revoke-toggled="toggleRevokeChecked(props.row)"
        />
    </template>
</q-table>

<TableControls :pagination="pagination" @pagination-updated="pagination = $event"/>
</template>

<style lang="scss">
.c-allowances-table {
    $this: &;

    &__th-container {
        display: flex;
        align-items: center;
        cursor: pointer;

        &:hover {
            #{$this}__sort-icon {
                opacity: 0.8;
            }
        }
    }

    &__sort-icon {
        margin-left: 4px;
        opacity: 0;

        &--active {
            opacity: 1;
        }

        &--descending {
            transform: rotate(180deg);
        }
    }
}
</style>
