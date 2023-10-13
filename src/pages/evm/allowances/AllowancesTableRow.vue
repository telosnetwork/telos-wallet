<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

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
import { CURRENT_CONTEXT, useAccountStore, useNftsStore, useUserStore } from 'src/antelope';
import { truncateAddress, truncateText } from 'src/antelope/stores/utils/text-utils';

import ToolTip from 'src/components/ToolTip.vue';
import NftViewer from 'pages/evm/nfts/NftViewer.vue';
import { NFTClass } from 'src/antelope/types';

const tlosLogo = require('src/assets/logo--tlos.svg');

const props = defineProps<{
    row: ShapedAllowanceRow;
}>();

const accountStore = useAccountStore();
const nftStore = useNftsStore();
const fiatLocale = useUserStore().fiatLocale;

const isErc20Row = isErc20AllowanceRow(props.row);
const isSingleErc721Row = isErc721SingleAllowanceRow(props.row);
const isCollectionRow = isNftCollectionAllowanceRow(props.row);

// data
const erc721Nft = ref<NFTClass | null>(null);

// computed
const rowAsErc20Row = computed(() => props.row as ShapedAllowanceRowERC20);
const rowAsSingleErc721Row = computed(() => props.row as ShapedAllowanceRowSingleERC721);
const rowAsCollectionRow = computed(() => props.row as ShapedAllowanceRowNftCollection);

const assetTextShort = computed(() => {
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

const assetTextFull = computed(() => {
    let prettyAmount: string;

    if (isSingleErc721Row) {
        prettyAmount = '1 '.concat(props.row.tokenName);
    } else if (isErc20Row) {
        const { balance, tokenSymbol, tokenDecimals } = props.row;
        prettyAmount = prettyPrintCurrency(balance, 4, fiatLocale, false, tokenSymbol, false, tokenDecimals, false);
    } else {
        const { balance, collectionName, collectionAddress } = props.row;
        const collectionNamePretty = collectionName ?? collectionAddress;
        prettyAmount = prettyPrintCurrency(balance, 0, fiatLocale, false, collectionNamePretty, false, 0, false);
    }

    return prettyAmount;
});

// methods
onMounted(async () => {
    if (isSingleErc721Row) {
        const { collectionAddress, tokenId } = rowAsSingleErc721Row.value;
        erc721Nft.value = await nftStore.fetchNftDetails(CURRENT_CONTEXT, collectionAddress, tokenId, 'ERC721');
    }
});
</script>

<template>
<q-tr>
    <q-td key="asset" class="c-allowances-table-row__asset-td">
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
        <NftViewer
            v-else-if="erc721Nft && isSingleErc721Row"
            :nft="erc721Nft"
            :preview-mode="false"
            :tile-mode="false"
            :icon-size="24"
        />
        <ToolTip :text="assetTextFull" :hide-icon="true">
            <span class="o-text--paragraph-bold u-text--default-contrast">
                {{ assetTextShort }}
            </span>
        </ToolTip>
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
    &__asset-td {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    &__asset-logo {
        width: 24px;
        height: 24px;

        &--gray {
            filter: grayscale(100%) opacity(50%);
        }
    }
}
</style>
