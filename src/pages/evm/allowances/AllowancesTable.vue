<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { AllowanceTableColumns, ShapedAllowanceRow } from 'src/antelope/types/Allowances';
import { useUserStore } from 'src/antelope';
import { getCurrencySymbol } from 'src/antelope/stores/utils/currency-utils';

import AllowancesTableRow from 'pages/evm/allowances/AllowancesTableRow.vue';
import TableControls from 'components/evm/TableControls.vue';

const props = defineProps<{
    rows: ShapedAllowanceRow[];
}>();

const emit = defineEmits(['sortChanged']);

const { t: $t } = useI18n();
const { fiatLocale, fiatCurrency } = useUserStore();

const fiatSymbol = getCurrencySymbol(fiatLocale, fiatCurrency);

// data
const pagination = ref({
    page: 1,
    rowsPerPage: 10,
    rowsNumber: props.rows.length,
    sortBy: AllowanceTableColumns.asset,
    descending: true,
});

const tableColumns = [
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
                <div
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
        <AllowancesTableRow :key="props.row.collectionAddress" :row="props.row" />
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
