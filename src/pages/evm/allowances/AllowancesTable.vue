<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import { ShapedAllowanceRow } from 'src/antelope/types/Allowances';
import AllowancesTableRow from 'pages/evm/allowances/AllowancesTableRow.vue';

const props = defineProps<{
    rows: ShapedAllowanceRow[];
}>();

const { t: $t } = useI18n();

const tableColumns = [
    {
        name: 'asset',
        field: 'asset',
        label: $t('global.asset'),
        align: 'left' as 'left',
        sortable: true,
    },
    {
        name: 'balance',
        field: 'balance',
        label: $t('global.balance'),
        align: 'left' as 'left',
        sortable: true,
    },
    {
        name: 'allowance',
        field: 'allowance',
        label: $t('evm_allowances.allowance'),
        align: 'left' as 'left',
        sortable: true,
    },
    {
        name: 'spender',
        field: 'spender',
        label: $t('evm_allowances.authorized_spender'),
        align: 'left' as 'left',
        sortable: true,
    },
    {
        name: 'type',
        field: 'type',
        label: $t('global.type'),
        align: 'left' as 'left',
        sortable: true,
    },
    {
        name: 'updated',
        field: 'updated',
        label: $t('global.last_updated'),
        align: 'left' as 'left',
        sortable: true,
    },
];
</script>

<template>
<q-table
    :columns="tableColumns"
    :rows="rows"
    :binary-state-sort="true"
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
        <AllowancesTableRow :row="props.row" />
    </template>
</q-table>
</template>

<style lang="scss">
.c-allowances-table {

}
</style>
