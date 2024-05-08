<script setup lang="ts">
import {
    computed,
    onBeforeMount,
    ref,
    watch,
} from 'vue';
import { useI18n } from 'vue-i18n';
import { BigNumber } from 'ethers';

import {
    MAX_UINT_256,
    ShapedAllowanceRow,
    ShapedAllowanceRowERC20,
    ShapedAllowanceRowNftCollection,
    ShapedAllowanceRowSingleERC721,
    isErc20AllowanceRow,
    isErc721SingleAllowanceRow,
} from 'src/antelope/types/Allowances';
import {
    CURRENT_CONTEXT,
    getAntelope,
    useAccountStore,
    useAllowancesStore,
    useChainStore,
    useFeedbackStore,
    useUserStore,
} from 'src/antelope';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';

import ExternalLink from 'src/components/ExternalLink.vue';
import ToolTip from 'src/components/ToolTip.vue';
import CurrencyInput from 'components/evm/inputs/CurrencyInput.vue';
import { truncateAddress } from 'src/antelope/stores/utils/text-utils';
import { TransactionResponse } from 'src/antelope/types/EvmTransaction';

enum Erc20AllowanceAmountOptions {
    none = 'none',
    unlimited = 'unlimited',
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

const ant = getAntelope();
const explorerUrl = (useChainStore().currentChain.settings as EVMChainSettings).getExplorerUrl();
const { fiatLocale } = useUserStore();


// data
const erc20AllowanceAmountModel = ref<Erc20AllowanceAmountOptions>(Erc20AllowanceAmountOptions.none);
const nftAllowanceAmountModel = ref<NftAllowanceAmountOptions>(NftAllowanceAmountOptions.allowed);
const newErc20AllowanceAmount = ref(BigNumber.from(0));
const newNftAllowanceIsAllowed = ref(false);
const customErc20AllowanceModel = ref(BigNumber.from(0));

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
        return !newErc20AllowanceAmount.value.eq(rowAsErc20Row.value.allowance) && newErc20AllowanceAmount.value.lte(MAX_UINT_256);
    }

    return newNftAllowanceIsAllowed.value !== rowAsNftRow.value.allowed;
});

const confirmButtonIsLoading = computed(() =>
    useFeedbackStore().isLoading('updateErc20Allowance') ||
    useFeedbackStore().isLoading('updateSingleErc721Allowance') ||
    useFeedbackStore().isLoading('updateNftCollectionAllowance'),
);

const userAddress = computed(() => useAccountStore().currentAccount.account);

// watchers
watch(erc20AllowanceAmountModel, (newAmount) => {
    if (newAmount === Erc20AllowanceAmountOptions.none) {
        newErc20AllowanceAmount.value = BigNumber.from(0);
    } else if (newAmount === Erc20AllowanceAmountOptions.unlimited) {
        newErc20AllowanceAmount.value = MAX_UINT_256;
    } else {
        newErc20AllowanceAmount.value = customErc20AllowanceModel.value;
    }
});

watch(nftAllowanceAmountModel, (newAllowed) => {
    newNftAllowanceIsAllowed.value = newAllowed === NftAllowanceAmountOptions.allowed;
});

watch(customErc20AllowanceModel, (newAmount) => {
    newErc20AllowanceAmount.value = newAmount;
});

// methods
onBeforeMount(() => {
    if (rowIsErc20Row.value) {
        const allowanceAmountBn = rowAsErc20Row.value.allowance;

        if (allowanceAmountBn.isZero()) {
            erc20AllowanceAmountModel.value = Erc20AllowanceAmountOptions.none;
        } else if (allowanceAmountBn.gt(rowAsErc20Row.value.tokenMaxSupply)) {
            erc20AllowanceAmountModel.value = Erc20AllowanceAmountOptions.unlimited;
        } else {
            customErc20AllowanceModel.value = rowAsErc20Row.value.allowance;
            erc20AllowanceAmountModel.value = Erc20AllowanceAmountOptions.custom;
        }

        newErc20AllowanceAmount.value = allowanceAmountBn;
    } else {
        nftAllowanceAmountModel.value = rowAsNftRow.value.allowed ? NftAllowanceAmountOptions.allowed : NftAllowanceAmountOptions.not_allowed;
        newNftAllowanceIsAllowed.value = rowAsNftRow.value.allowed;
    }
});

async function handleSubmit() {
    let tx: TransactionResponse;
    let neutralMessageText: string;

    if (!await useAccountStore().assertNetworkConnection(CURRENT_CONTEXT)) {
        return;
    }

    if (rowIsErc20Row.value) {
        tx = await useAllowancesStore().updateErc20Allowance(
            userAddress.value,
            props.row.spenderAddress,
            rowAsErc20Row.value.tokenAddress,
            newErc20AllowanceAmount.value,
        );

        neutralMessageText = $t(
            'notification.neutral_message_updating_erc20_allowance',
            {
                symbol: rowAsErc20Row.value.tokenSymbol,
                spender: props.row.spenderName || truncateAddress(props.row.spenderAddress),
            },
        );
    } else if (rowIsSingleErc721Row.value) {
        tx = await useAllowancesStore().updateSingleErc721Allowance(
            userAddress.value,
            props.row.spenderAddress,
            rowAsSingleErc721Row.value.collectionAddress,
            rowAsSingleErc721Row.value.tokenId,
            newNftAllowanceIsAllowed.value,
        );

        const tokenText = `${rowAsSingleErc721Row.value.collectionName || truncateAddress(rowAsSingleErc721Row.value.collectionAddress)} #${rowAsSingleErc721Row.value.tokenId}`;

        neutralMessageText = $t(
            'notification.neutral_message_updating_nft_allowance',
            {
                tokenText,
                operator: props.row.spenderName || truncateAddress(props.row.spenderAddress),
            },
        );
    } else {
        tx = await useAllowancesStore().updateNftCollectionAllowance(
            userAddress.value,
            props.row.spenderAddress,
            rowAsNftRow.value.collectionAddress,
            newNftAllowanceIsAllowed.value,
        );

        const tokenText = rowAsNftRow.value.collectionName || truncateAddress(rowAsNftRow.value.collectionAddress);

        neutralMessageText = $t(
            'notification.neutral_message_updating_nft_allowance',
            {
                tokenText,
                operator: props.row.spenderName || truncateAddress(props.row.spenderAddress),
            },
        );
    }

    const dismiss = ant.config.notifyNeutralMessageHandler(neutralMessageText);

    tx.wait().then(() => {
        ant.config.notifySuccessfulTrxHandler(
            `${explorerUrl}/tx/${tx.hash}`,
        );
    }).catch((err) => {
        ant.config.notifyErrorHandler(err);
        console.error(err);
    }).finally(() => {
        emit('close');
        dismiss();
    });
}
</script>

<template>
<q-dialog :model-value="showDialog" @update:model-value="() => emit('close')">
    <q-card class="c-edit-allowance-modal__card q-pa-md shadow-3">
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
                <template v-if="rowIsSingleErc721Row">
                    <br>
                    {{ $t('evm_allowances.erc_721_single_allowance_blurb') }}
                    <br>
                </template>
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
                        :val="Erc20AllowanceAmountOptions.unlimited"
                        :label="$t('global.unlimited')"
                    />
                    <br>
                    <q-radio
                        v-model="erc20AllowanceAmountModel"
                        :val="Erc20AllowanceAmountOptions.custom"
                        :label="$t('global.custom')"
                    />
                    <CurrencyInput
                        v-model="customErc20AllowanceModel"
                        :symbol="rowAsErc20Row.tokenSymbol"
                        :decimals="rowAsErc20Row.tokenDecimals"
                        :decimals-to-display="rowAsErc20Row.tokenDecimals"
                        :locale="fiatLocale"
                        :label="$t('evm_allowances.token_amount_input_label')"
                        :disabled="erc20AllowanceAmountModel !== Erc20AllowanceAmountOptions.custom"
                        name="custom-erc20-allowance-input"
                        class="c-edit-allowance-modal__currency-input"
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
                :loading="confirmButtonIsLoading"
                :disable="!enableConfirmButton"
                :label="$t('global.confirm')"
                color="primary"
                @click="handleSubmit"
            />
        </q-card-actions>
    </q-card>
</q-dialog>
</template>

<style lang="scss">
.c-edit-allowance-modal {
    &__card {
        color: var(--text-color);
        background-color: var(--bg-color) !important;
    }

    &__options-container {
        background-color: var(--header-background-color);
        padding: 16px;
        border-radius: 4px;
        margin-bottom: 24px;
    }

    &__currency-input {
        margin-top: 0;
        margin-bottom: 24px;
        max-width: 260px;

        @include sm-and-up {
            margin-left: 40px;
        }
    }
}
</style>
