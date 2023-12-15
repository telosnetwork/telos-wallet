<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { formatUnits } from 'ethers/lib/utils';
import { BigNumber } from 'ethers';

import {
    ShapedAllowanceRow,
    ShapedAllowanceRowERC20,
    ShapedAllowanceRowNftCollection,
    ShapedAllowanceRowSingleERC721,
    TINY_ALLOWANCE_THRESHOLD,
    isErc20AllowanceRow,
    isErc721SingleAllowanceRow,
    isNftCollectionAllowanceRow,
} from 'src/antelope/types/Allowances';
import { prettyPrintCurrency } from 'src/antelope/stores/utils/currency-utils';
import { CURRENT_CONTEXT, useChainStore, useNftsStore, useUserStore } from 'src/antelope';
import { truncateAddress, truncateText } from 'src/antelope/stores/utils/text-utils';
import { Collectible } from 'src/antelope/types';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { WEI_PRECISION } from 'src/antelope/stores/utils';
import { DEFAULT_DATE_FORMAT, getFormattedDate, prettyTimePeriod } from 'src/antelope/stores/utils/date-utils';

import ToolTip from 'src/components/ToolTip.vue';
import NftViewer from 'src/components/evm/nfts/NftViewer.vue';
import NftCollectionStack from 'src/components/evm/nfts/NftCollectionStack.vue';
import ExternalLink from 'src/components/ExternalLink.vue';
import TextBadge from 'src/components/TextBadge.vue';
import EditAllowanceModal from 'src/pages/evm/allowances/EditAllowanceModal.vue';

const tlosLogo = require('src/assets/logo--tlos.svg');

const props = defineProps<{
    row: ShapedAllowanceRow;
    revokeChecked: boolean;
}>();

const emit = defineEmits(['revoke-toggled']);

const { t: $t } = useI18n();
const nftStore = useNftsStore();
const chainSettings = useChainStore().currentChain.settings as EVMChainSettings;
const { fiatLocale, fiatCurrency } = useUserStore();

const isErc20Row = isErc20AllowanceRow(props.row);
const isSingleErc721Row = isErc721SingleAllowanceRow(props.row);
const isCollectionRow = isNftCollectionAllowanceRow(props.row);

// data
const erc721Nft = ref<Collectible | null>(null);
const showEditModal = ref(false);

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
        prettyAmount = `1 ${props.row.tokenName} (${props.row.collectionName ?? truncateAddress(props.row.collectionAddress)} #${props.row.tokenId})`;
    } else if (isErc20Row) {
        const { balance, tokenSymbol, tokenDecimals } = props.row;
        prettyAmount = prettyPrintCurrency(balance, WEI_PRECISION, fiatLocale, false, tokenSymbol, false, tokenDecimals, true);
    } else {
        const { balance, collectionName, collectionAddress } = props.row;
        const collectionNamePretty = collectionName ?? collectionAddress;
        prettyAmount = prettyPrintCurrency(balance, 0, fiatLocale, false, collectionNamePretty, false, 0, false);
    }

    return $t('evm_allowances.you_own', { asset: prettyAmount });
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

    return `1 ${props.row.tokenSymbol} = ${prettyPrintCurrency(fiatValue, 2, fiatLocale, false, fiatCurrency)}`;
});

const allowanceTextShort = computed(() => {
    if (isErc20Row) {
        const allowanceBn = props.row.allowance;

        if (allowanceBn.eq(0)) {
            return $t('global.none');
        }

        const numberAllowed = Number(formatUnits(allowanceBn, props.row.tokenDecimals));

        if (allowanceBn.gt(props.row.tokenMaxSupply)) {
            return $t('global.unlimited');
        }

        if (numberAllowed < TINY_ALLOWANCE_THRESHOLD && numberAllowed > 0) {
            return $t('global.less_than', { amount: TINY_ALLOWANCE_THRESHOLD });
        }

        return prettyPrintCurrency(numberAllowed, 2, fiatLocale, true);
    }

    return props.row.allowed ? $t('global.allowed') : $t('global.not_allowed');
});

const allowanceTextFull = computed(() => {
    if (isErc20Row) {
        const allowance = props.row.allowance ?? BigNumber.from(0);
        return prettyPrintCurrency(allowance, WEI_PRECISION, fiatLocale, false, props.row.tokenSymbol, false, props.row.tokenDecimals, true);
    }

    return props.row.allowed ? $t('global.allowed') : $t('global.not_allowed');
});

const spenderUrl = computed(() => `${chainSettings.getExplorerUrl()}/address/${props.row.spenderAddress}`);

const badgeText = computed(() => isErc20Row ? $t('global.token') : $t('nft.collectible'));

const updatedTextPretty = computed(() => {
    const todaySeconds = (Date.now() / 1000);
    const updatedSeconds = props.row.lastUpdated / 1000;
    const secondsSinceUpdate = todaySeconds - updatedSeconds;
    const timePeriod = prettyTimePeriod(
        secondsSinceUpdate,
        (key: string) => $t(`antelope.words.${key}`),
        true,
    );

    return $t('global.time_ago', { time: timePeriod });
});
const updatedTextFull = computed(() => getFormattedDate(props.row.lastUpdated / 1000, DEFAULT_DATE_FORMAT, true));

const ariaLabelForRevokeCheckbox = computed(() => {
    const { spenderName, spenderAddress } = props.row;
    const spenderPretty = spenderName || truncateAddress(spenderAddress);

    const tokenPretty = isErc20AllowanceRow(props.row) ? props.row.tokenSymbol : props.row.collectionName ?? truncateAddress(props.row.collectionAddress);

    return $t('evm_allowances.revoke_checkbox_aria_label', { spender: spenderPretty, token: tokenPretty });
});

const ariaLabelForEditIcon = computed(() => {
    const { spenderName, spenderAddress } = props.row;
    const spenderPretty = spenderName || truncateAddress(spenderAddress);

    const tokenPretty = isErc20AllowanceRow(props.row) ? props.row.tokenSymbol : props.row.collectionName ?? truncateAddress(props.row.collectionAddress);

    return $t('evm_allowances.edit_allowance_aria_label', { spender: spenderPretty, token: tokenPretty });
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
    <q-td key="revoke">
        <div class="flex items-center">
            <q-checkbox
                :model-value="revokeChecked"
                size="xs"
                :aria-label="ariaLabelForRevokeCheckbox"
                @click="() => $emit('revoke-toggled')"
                @keydown.enter.space.prevent="() => $emit('revoke-toggled')"
            />
        </div>
    </q-td>
    <q-td key="asset">
        <div class="c-allowances-table-row__flex-td">
            <img
                v-if="isErc20Row"
                :src="rowAsErc20Row.tokenLogo ?? tlosLogo"
                :alt="$t('evm_allowances.asset_logo_alt', { symbol: rowAsErc20Row.tokenSymbol })"
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
        </div>
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
        <div class="c-allowances-table-row__flex-td">
            <ToolTip :text="allowanceTextFull" :hide-icon="true">
                {{ allowanceTextShort }}
            </ToolTip>

            <q-icon
                :aria-label="ariaLabelForEditIcon"
                class="c-allowances-table-row__edit-icon"
                name="o_edit"
                size="xs"
                color="primary"
                tabindex="0"
                @click="showEditModal = true"
                @keydown.enter.space.prevent="showEditModal = true"
            />
        </div>

        <EditAllowanceModal
            :row="row"
            :showDialog="showEditModal"
            @close="showEditModal = false"
        />
    </q-td>
    <q-td key="spender">
        <ExternalLink
            :text="row.spenderName || row.spenderAddress"
            :url="spenderUrl"
            :purpose="$t('evm_allowances.spender_link_label')"
        />
    </q-td>
    <q-td key="type">
        <TextBadge :label="badgeText" />
    </q-td>
    <q-td key="updated">
        <ToolTip :text="updatedTextFull" :hide-icon="true">
            {{ updatedTextPretty }}
        </ToolTip>
    </q-td>
</q-tr>
</template>

<style lang="scss">
.c-allowances-table-row {
    &__flex-td {
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

    &__edit-icon {
        cursor: pointer;
    }
}
</style>
