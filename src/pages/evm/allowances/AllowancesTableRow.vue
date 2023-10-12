<script setup lang="ts">
import { computed } from 'vue';

import {
    ShapedAllowanceRow,
    ShapedAllowanceRowERC20,
    ShapedAllowanceRowNftCollection,
    ShapedAllowanceRowSingleERC721,
    isErc20AllowanceRow,
    isErc721SingleAllowanceRow,
    isNftCollectionAllowanceRow,
} from 'src/antelope/types/Allowances';
import { prettyPrintCurrency } from 'src/antelope/stores/utils/currency-utils';
import { useUserStore } from 'src/antelope';
import { truncateAddress, truncateText } from 'src/antelope/stores/utils/text-utils';

const tlosLogo = require('src/assets/logo--tlos.svg');

const props = defineProps<{
    row: ShapedAllowanceRow;
}>();

const fiatLocale = useUserStore().fiatLocale;

const isErc20Row = isErc20AllowanceRow(props.row);
const isSingleErc721Row = isErc721SingleAllowanceRow(props.row);
const isCollectionRow = isNftCollectionAllowanceRow(props.row);

// computed
const rowAsErc20Row = computed(() => props.row as ShapedAllowanceRowERC20);
const rowAsSingleErc721Row = computed(() => props.row as ShapedAllowanceRowSingleERC721);
const rowAsCollectionRow = computed(() => props.row as ShapedAllowanceRowNftCollection);

const assetText = computed(() => {
    let prettyAmount: string;

    if (isSingleErc721Row) {
        prettyAmount = '1 '.concat(truncateText(props.row.tokenName, 12));
    } else if (isErc20Row) {
        const { balance, tokenSymbol, tokenDecimals } = props.row;
        prettyAmount = prettyPrintCurrency(balance, 4, fiatLocale, true, tokenSymbol, false, tokenDecimals, true);
    } else {
        const { balance, collectionName, collectionAddress } = props.row;
        const collectionNamePretty = collectionName ? truncateText(collectionName, 12) : truncateAddress(collectionAddress);
        prettyAmount = prettyPrintCurrency(balance, 0, fiatLocale, false, collectionNamePretty, false, 0);
    }

    return prettyAmount;
});

</script>

<template>
<q-tr>
    <q-td key="asset">
        <img
            v-if="isErc20Row"
            :src="rowAsErc20Row.tokenLogo ?? tlosLogo"
            alt="eztodo"
            height="24"
            width="24"
            :class="{
                'c-allowances-table-row__asset-logo': true,
                'c-allowances-table-row__asset-logo--gray': !rowAsErc20Row.tokenLogo,
            }"
        >
        <span class="o-text--paragraph-bold u-text--default-contrast">
            {{ assetText }}
        </span>
        <!-- tooltip here -->
    </q-td>
    <q-td key="balance">
        {{ row.lastUpdated }}
    </q-td>
    <q-td key="allowance">
        {{ row.lastUpdated }}
    </q-td>
    <q-td key="spender">
        {{ row.lastUpdated }}
    </q-td>
    <q-td key="type">
        {{ row.lastUpdated }}
    </q-td>
    <q-td key="updated">
        {{ row.lastUpdated }}
    </q-td>
</q-tr>
</template>

<style lang="scss">
.c-allowances-table-row {
    &__asset-logo {
        width: 24px;
        height: 24px;

        &--gray {
            filter: grayscale(100%) opacity(50%);
        }
    }
}
</style>
