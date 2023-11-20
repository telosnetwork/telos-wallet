<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { useChainStore } from 'src/antelope';

import TableControls from 'components/evm/TableControls.vue';
import ExternalLink from 'components/ExternalLink.vue';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import BaseTextInput from 'src/components/evm/inputs/BaseTextInput.vue';


const props = defineProps<{
    owners: { [address: string]: number; }
}>();

const { t: $t } = useI18n();
const chainSettings = useChainStore().currentChain.settings as EVMChainSettings;

const columns = [{
    name: 'address',
    field: 'address',
    label: $t('global.address'),
    align: 'left' as 'left',
}, {
    name: 'quantity',
    field: 'quantity',
    label: $t('global.quantity'),
    align: 'left' as 'left',
}];


// data
const pagination = ref<{
    page: number;
    rowsPerPage: number;
    rowsNumber: number;
}>({
    page: 1,
    rowsPerPage: 10,
    rowsNumber: 0,
});

const searchValue = ref('');

// computed
const shapedOwners = computed(() => {
    const keys = Object.keys(props.owners).filter((address) => {
        if (!searchValue.value) {
            return true;
        }

        return address.toLowerCase().includes(searchValue.value.toLowerCase());
    });

    return keys.map(address => ({ address, quantity: props.owners[address] }));
});

const ownersToShow = computed(() => {
    const { page, rowsPerPage } = pagination.value;
    const start = page === 1 ? 0 : (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return shapedOwners.value.slice(start, end);
});

function getExplorerAddress(address: string) {
    return `${chainSettings.getExplorerUrl()}/address/${address}`;
}

// watchers
watch(shapedOwners, () => {
    pagination.value.rowsNumber = shapedOwners.value.length;
}, { immediate: true });
</script>

<template>
<div class="c-nft-owners-table">
    <BaseTextInput
        v-model="searchValue"
        :label="$t('global.search')"
        class="c-nft-owners-table__input"
        name="owners-table-address-search"
    >
        <template v-slot:append>
            <q-icon name="search" />
        </template>
    </BaseTextInput>

    <q-table
        :columns="columns"
        :rows="ownersToShow"
        :pagination="{ rowsPerPage: 0 }"
        hide-pagination
        flat
        class="q-mb-lg"
    >
        <template v-slot:body="props">
            <q-tr :props="props">
                <q-td key="address">
                    <ExternalLink
                        :text="props.row.address"
                        :url="getExplorerAddress(props.row.address)"
                        :purpose="$t('nft.view_owner_on_block_explorer_label')"
                        :expand-address="true"
                    />
                </q-td>
                <q-td key="quantity">
                    {{ props.row.quantity }}
                </q-td>
            </q-tr>
        </template>
    </q-table>

    <TableControls
        :pagination="pagination"
        :scroll-on-update="false"
        class="q-mb-lg"
        @pagination-updated="pagination = $event"
    />
</div>
</template>

<style lang="scss">
.c-nft-owners-table {
    width: 100%;
    max-width: 1000px;
    margin: auto;

    &__input {
        max-width: 400px;
    }
}
</style>
