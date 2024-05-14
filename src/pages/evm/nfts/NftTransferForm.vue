<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';

import { truncateAddress } from 'src/antelope/stores/utils/text-utils';
import {
    CURRENT_CONTEXT,
    getAntelope,
    useAccountStore,
    useChainStore,
    useNftsStore,
} from 'src/antelope';
import {
    Collectible,
    ERC1155_TYPE,
    ERC721_TYPE,
    Erc1155Nft,
    Erc721Nft,
    addressString,
} from 'src/antelope/types';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';

import UserInfo from 'components/evm/UserInfo.vue';
import AddressInput from 'components/evm/inputs/AddressInput.vue';
import IntegerInput from 'src/components/evm/inputs/IntegerInput.vue';

const props = defineProps<{
    nft: Collectible;
}>();

const route = useRoute();
const { t: $t } = useI18n();

const ant = getAntelope();
const accountStore = useAccountStore();
const chainStore = useChainStore();
const nftStore = useNftsStore();

const contractAddress = route.query.contract as string;
const nftId = route.query.id as string;
const explorerUrl = (chainStore.currentChain.settings as EVMChainSettings).getExplorerUrl();

let addressIsValid = false;

// data
const address = ref('');
const transferLoading = ref(false);
const quantityToTransfer = ref(1);


// computed
const loggedAccount = computed(() =>
    accountStore.loggedEvmAccount,
);
const isErc721 = computed(() => props.nft instanceof Erc721Nft);
const isErc1155 = computed(() => props.nft instanceof Erc1155Nft);
const nftAsErc1155 = computed(() => props.nft as Erc1155Nft);
const nftType = computed(() => isErc721.value ? ERC721_TYPE : ERC1155_TYPE);
const quantityToTransferIsValid = computed(() => {
    if (isErc1155.value) {
        return quantityToTransfer.value > 0 && quantityToTransfer.value <= nftAsErc1155.value.owners[loggedAccount.value.account];
    }
    return quantityToTransfer.value === 1;
});

// methods
onMounted(() => {
    if (isErc1155.value) {
        quantityToTransfer.value = 0;
    }
});

async function startTransfer() {
    const label = CURRENT_CONTEXT;
    transferLoading.value = true;
    const nameString = `${props.nft.contractPrettyName || props.nft.contractAddress} #${props.nft.id}`;
    try {
        if (!await useAccountStore().assertNetworkConnection(label)) {
            return;
        }
        const trx = await nftStore.transferNft(
            label,
            contractAddress,
            nftId,
            nftType.value,
            loggedAccount.value.address,
            address.value as addressString,
            quantityToTransfer.value,
        );
        const dismiss = ant.config.notifyNeutralMessageHandler(
            $t('notification.neutral_message_sending', { quantity: nameString, address: truncateAddress(address.value) }),
        );
        trx.wait().then(() => {
            ant.config.notifySuccessfulTrxHandler(
                `${explorerUrl}/tx/${trx.hash}`,
            );
        }).catch((err) => {
            console.error(err);
        }).finally(() => {
            dismiss();

            setTimeout(() => {
                transferLoading.value = false;
            }, 3000); // give the indexer some time to update owner information
        });
    } catch (e) {
        console.error(e); // tx error notification handled in store
        transferLoading.value = false;
    }
}

</script>

<template>
<div class="c-nft-transfer__form-container">
    <q-form class="c-nft-transfer__form">
        <div class="row q-mb-lg">
            <div class="col">
                <div class="c-nft-transfer__transfer-text">
                    {{ $t('nft.transfer') }} <span class="c-nft-transfer__transfer-text--bold"> {{ nft?.contractPrettyName || nft?.contractAddress }} #{{ nft?.id }} </span>
                </div>
                <div class="c-nft-transfer__transfer-from c-nft-transfer__transfer-text--small">
                    {{ $t('nft.transfer_from') }}
                    &nbsp;
                    <UserInfo
                        class="c-nft-transfer__transfer-text--small c-nft-transfer__transfer-text--bold"
                        :displayFullAddress="false"
                        :showAddress="true"
                        :showCopyBtn="false"
                        :lightweight="true"
                        :account="loggedAccount"
                    />
                    &nbsp;
                    {{ $t('nft.transfer_on_telos') }}
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col">
                <AddressInput
                    v-model="address"
                    name="nft-transfer-address-input"
                    :label="$t('evm_wallet.receiving_account')"
                    @update:isValid="addressIsValid = $event"
                />
            </div>
        </div>

        <div v-if="isErc1155" class="row q-mb-lg">
            <div class="col">
                <IntegerInput
                    v-model="quantityToTransfer"
                    :max="nftAsErc1155.owners[loggedAccount.account]"
                    :min="1"
                    :label="$t('global.quantity')"
                    name="nft-transfer-form-quantity-input"
                    required="required"
                />
            </div>
        </div>

        <div class="row q-mb-lg">
            <div class="col">
                <div class="justify-end row">
                    <q-btn
                        color="primary"
                        class="wallet-btn"
                        :label="$t('nft.transfer_collectible')"
                        :loading="transferLoading"
                        :disable="!(addressIsValid && quantityToTransferIsValid)"
                        @click="startTransfer"
                    />
                </div>
            </div>
        </div>
    </q-form>
</div>
</template>

<style lang="scss">
.c-nft-transfer {
    &__form-container {
        animation: #{$anim-slide-in-left};
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
    }

    &__form {
        width: 100%;
        max-width: 530px;
    }

    &__row {
        gap: 16px;
        &--1 {
            margin-bottom: 24px;
        }

        &--2 {
            margin-bottom: 24px;
        }

        &--3 {
            margin-bottom: 24px;
        }
    }

    &__transfer-from {
        display: flex;
    }

    &__transfer-text {
        font-size: 24px;
        font-style: normal;
        font-weight: 400;

        &--small{
            font-size: 16px;
            // override UserInfo component styling
            .o-text--header-4 {
                font-size: 16px !important;
            }
        }

        &--bold {
            font-weight: 600;
        }
    }
}
</style>
