<script setup lang="ts">
import { computed, onBeforeMount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { BigNumber } from 'ethers';
import { formatUnits, parseUnits } from 'ethers/lib/utils';

import { HUGE_ALLOWANCE_THRESHOLD, ShapedAllowanceRow, ShapedAllowanceRowERC20, ShapedAllowanceRowNftCollection, ShapedAllowanceRowSingleERC721, isErc20AllowanceRow, isErc721SingleAllowanceRow } from 'src/antelope/types/Allowances';
import { useChainStore } from 'src/antelope';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';

import ExternalLink from 'src/components/ExternalLink.vue';
import ToolTip from 'src/components/ToolTip.vue';

enum Erc20AllowanceAmountOptions {
    none = 'none',
    huge = 'huge',
    custom = 'custom',
}

enum NftAllowanceAmountOptions {
    allowed = 'allowed',
    not_allowed = 'not_allowed',
}

const props = defineProps<{
    row: ShapedAllowanceRow;
    showDialog: boolean;
}>();

const emit = defineEmits(['close']);

const { t: $t } = useI18n();

// data
const erc20AllowanceAmountModel = ref<Erc20AllowanceAmountOptions>(Erc20AllowanceAmountOptions.none);
const nftAllowanceAmountModel = ref<NftAllowanceAmountOptions>(NftAllowanceAmountOptions.allowed);
const newErc20AllowanceAmount = ref<BigNumber>(BigNumber.from(0));
const newNftAllowanceIsAllowed = ref(false);

// computed
const rowIsErc20Row = computed(() => isErc20AllowanceRow(props.row));
const rowIsSingleErc721Row = computed(() => isErc721SingleAllowanceRow(props.row));

const rowAsErc20Row = computed(() => props.row as ShapedAllowanceRowERC20);
const rowAsSingleErc721Row = computed(() => props.row as ShapedAllowanceRowSingleERC721);
const rowAsNftRow = computed(() => props.row as ShapedAllowanceRowSingleERC721 | ShapedAllowanceRowNftCollection);

const spenderUrl = computed(() => {
    const { spenderAddress } = props.row;
    const blockExplorerUrl = (useChainStore().currentChain.settings as EVMChainSettings).getExplorerUrl();

    return `${blockExplorerUrl}/address/${spenderAddress}`;
});

const tokenSectionHeaderText = computed(() => {
    if (rowIsErc20Row.value) {
        return $t('global.token');
    }

    if (rowIsSingleErc721Row.value) {
        return $t('global.collectible');
    }

    return $t('global.collection');
});

const tokenText = computed(() => {
    if (rowIsErc20Row.value) {
        return `${rowAsErc20Row.value.tokenName} (${rowAsErc20Row.value.tokenSymbol})`;
    }

    const row = props.row as ShapedAllowanceRowSingleERC721 | ShapedAllowanceRowNftCollection;
    const collectionText = row.collectionName || row.collectionAddress;

    if (rowIsSingleErc721Row.value) {
        return `${collectionText} #${rowAsSingleErc721Row.value.tokenId}`;
    }

    return `${collectionText} (${$t('evm_allowances.entire_collection')})`;
});

// disable the confirm button if the user hasn't changed anything
const enableConfirmButton = computed(() => {
    if (rowIsErc20Row.value) {
        return !newErc20AllowanceAmount.value.eq(rowAsErc20Row.value.allowance);
    }

    return newNftAllowanceIsAllowed.value !== rowAsNftRow.value.allowed;
});

// watchers
watch(erc20AllowanceAmountModel, (newAmount) => {
    if (newAmount === Erc20AllowanceAmountOptions.none) {
        newErc20AllowanceAmount.value = BigNumber.from(0);
    } else if (newAmount === Erc20AllowanceAmountOptions.huge) {
        newErc20AllowanceAmount.value = parseUnits(HUGE_ALLOWANCE_THRESHOLD.toString(), rowAsErc20Row.value.tokenDecimals);
    }
    // eztodo else if custom
});

watch(nftAllowanceAmountModel, (newAllowed) => {
    newNftAllowanceIsAllowed.value = newAllowed === NftAllowanceAmountOptions.allowed;
});

// methods
onBeforeMount(() => {
    if (rowIsErc20Row.value) {
        const allowanceAmountBn = rowAsErc20Row.value.allowance;
        const allowanceAmountAsNumber = Number(formatUnits(allowanceAmountBn.toString(), rowAsErc20Row.value.tokenDecimals));

        if (allowanceAmountBn.isZero()) {
            erc20AllowanceAmountModel.value = Erc20AllowanceAmountOptions.none;
        } else if (allowanceAmountAsNumber > HUGE_ALLOWANCE_THRESHOLD) {
            erc20AllowanceAmountModel.value = Erc20AllowanceAmountOptions.huge;
        } else {
            erc20AllowanceAmountModel.value = Erc20AllowanceAmountOptions.custom;
        }

        newErc20AllowanceAmount.value = allowanceAmountBn;
    } else {
        nftAllowanceAmountModel.value = rowAsNftRow.value.allowed ? NftAllowanceAmountOptions.allowed : NftAllowanceAmountOptions.not_allowed;
        newNftAllowanceIsAllowed.value = rowAsNftRow.value.allowed;
    }
});
</script>

<template>
<!-- eztodo aria labels and i18n -->
<q-dialog :model-value="showDialog" @update:model-value="() => emit('close')">
    <q-card class="q-pa-md">
        <q-card-section>
            {{ $t('evm_allowances.edit_modal_description') }}
            <ExternalLink :text="row.spenderName || row.spenderAddress" :url="spenderUrl" />
        </q-card-section>

        <q-card-section>
            <div class="c-edit-allowance-modal__options-container">
                {{ tokenSectionHeaderText }}
                <br>
                <span class="o-text--paragraph-bold">{{ tokenText }}</span>
                <br>
                <br>
                {{ $t('global.allowance') }}
                <br>
                <template v-if="rowIsErc20Row">
                    <q-radio
                        v-model="erc20AllowanceAmountModel"
                        :val="Erc20AllowanceAmountOptions.none"
                        :label="$t('global.none')"
                    />
                    <br>
                    <q-radio
                        v-model="erc20AllowanceAmountModel"
                        :val="Erc20AllowanceAmountOptions.huge"
                    >
                        <ToolTip :text="$t('evm_allowances.huge_allowance_option_tooltip', { symbol: rowAsErc20Row.tokenSymbol })">
                            {{ $t('global.huge') }}
                        </ToolTip>
                    </q-radio>
                    <br>
                    <q-radio
                        v-model="erc20AllowanceAmountModel"
                        :val="Erc20AllowanceAmountOptions.custom"
                        :label="$t('global.custom')"
                    />
                </template>
                <template v-else>
                    <q-radio
                        v-model="nftAllowanceAmountModel"
                        :val="NftAllowanceAmountOptions.not_allowed"
                        :label="$t('global.not_allowed')"
                    />
                    <br>
                    <q-radio
                        v-model="nftAllowanceAmountModel"
                        :val="NftAllowanceAmountOptions.allowed"
                        :label="$t('global.allowed')"
                    />
                </template>
            </div>
        </q-card-section>

        <q-card-actions align="right">
            <q-btn
                :label="$t('global.cancel')"
                flat
                color="primary"
                @click="() => emit('close')"
            />

            <q-btn
                :disable="!enableConfirmButton"
                :label="$t('global.confirm')"
                color="primary"
            />
        </q-card-actions>
    </q-card>
</q-dialog>
</template>

<style lang="scss">
.c-edit-allowance-modal {
    &__options-container {
        background-color: var(--accent-color-5);
        padding: 16px;
        border-radius: 4px;
        margin-bottom: 24px;
    }
}
</style>
