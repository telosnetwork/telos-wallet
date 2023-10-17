<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { formatUnits } from 'ethers/lib/utils';
import { BigNumber } from 'ethers';

import {
    HUGE_ALLOWANCE_THRESHOLD,
    ShapedAllowanceRow,
    ShapedAllowanceRowERC20,
    ShapedAllowanceRowNftCollection,
    ShapedAllowanceRowSingleERC721,
    isErc20AllowanceRow,
    isErc721SingleAllowanceRow,
    isNftCollectionAllowanceRow,
} from 'src/antelope/types/Allowances';
import { prettyPrintCurrency } from 'src/antelope/stores/utils/currency-utils';
import { CURRENT_CONTEXT, useChainStore, useNftsStore, useUserStore } from 'src/antelope';
import { truncateAddress, truncateText } from 'src/antelope/stores/utils/text-utils';
import { NFTClass } from 'src/antelope/types';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';

import ToolTip from 'src/components/ToolTip.vue';
import NftViewer from 'src/components/evm/nfts/NftViewer.vue';
import NftCollectionStack from 'src/components/evm/nfts/NftCollectionStack.vue';
import ExternalLink from 'src/components/ExternalLink.vue';

const tlosLogo = require('src/assets/logo--tlos.svg');

const props = defineProps<{
    row: ShapedAllowanceRow;
}>();

const { t: $t } = useI18n();
const nftStore = useNftsStore();
const chainSettings = useChainStore().currentChain.settings as EVMChainSettings;
const { fiatLocale, fiatCurrency } = useUserStore();

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

const fiatValueTextShort = computed(() => {
    if (!isErc20Row || !props.row.tokenPrice) {
        return '';
    }

    const balance = Number(formatUnits(props.row.balance, props.row.tokenDecimals));
    const fiatValue = balance * props.row.tokenPrice;

    return prettyPrintCurrency(fiatValue, 2, fiatLocale, true, fiatCurrency);
});

const fiatValueTextFull = computed(() => {
    if (!isErc20Row || !props.row.tokenPrice) {
        return '';
    }

    const balance = Number(formatUnits(props.row.balance, props.row.tokenDecimals));
    const fiatValue = balance * props.row.tokenPrice;

    return prettyPrintCurrency(fiatValue, 2, fiatLocale, false, fiatCurrency);
});

const allowanceTextShort = computed(() => {
    if (isErc20Row) {
        if (props.row.allowance instanceof BigNumber) {
            const allowance = props.row.allowance.div(BigNumber.from(10).pow(props.row.tokenDecimals));

            if (allowance.gte(HUGE_ALLOWANCE_THRESHOLD)) {
                return $t('global.huge');
            }

            if (allowance.eq(0)) {
                return $t('global.none');
            }
            const numberAllowed = Number(formatUnits(props.row.allowance, props.row.tokenDecimals));

            return prettyPrintCurrency(numberAllowed, 2, fiatLocale, true);
        }

        return $t('global.none');
    }

    return props.row.allowed ? $t('global.allowed') : $t('global.not_allowed');
});

const allowanceTextFull = computed(() => {
    if (isErc20Row) {
        const allowance = props.row.allowance ?? BigNumber.from(0);
        return prettyPrintCurrency(allowance, 4, fiatLocale, false, props.row.tokenSymbol, false, props.row.tokenDecimals, true);
    }

    return props.row.allowed ? $t('global.allowed') : $t('global.not_allowed');
});

const spenderUrl = computed(() => `${chainSettings.getExplorerUrl()}/address/${props.row.spenderAddress}`);

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
        <NftCollectionStack
            v-else
            :collection="rowAsCollectionRow.collectionAddress"
        />

        <ToolTip :text="assetTextFull" :hide-icon="true">
            <span class="o-text--paragraph-bold u-text--default-contrast">
                {{ assetTextShort }}
            </span>
        </ToolTip>
    </q-td>
    <q-td key="value">
        <ToolTip v-if="fiatValueTextShort" :text="fiatValueTextFull" :hide-icon="true">
            {{ fiatValueTextShort }}
        </ToolTip>
        <ToolTip v-else :warnings="[$t('evm_wallet.no_fiat_value')]">
            {{ $t('global.not_applicable_short') }}
        </ToolTip>
    </q-td>
    <q-td key="allowance">
        <ToolTip :text="allowanceTextFull" :hide-icon="true">
            {{ allowanceTextShort }}
        </ToolTip>
    </q-td>
    <q-td key="spender">
        <ExternalLink
            :text="row.spenderName ?? row.spenderAddress"
            :url="spenderUrl"
            :purpose="$t('evm_allowances.spender_link_label')"
        />
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
