<script setup lang="ts">
import AppPage from 'components/evm/AppPage.vue';
import { useNftsStore } from 'src/antelope/stores/nfts';
import { useRoute, useRouter } from 'vue-router';
import { ERC1155_TYPE, ERC721_TYPE, ShapedNFT } from 'src/antelope/types';
import { computed, onBeforeMount, ref } from 'vue';
import NftViewer from 'pages/evm/nfts/NftViewer.vue';
import NftDetailsCard from 'pages/evm/nfts/NftDetailsCard.vue';
import ExternalLink from 'components/ExternalLink.vue';
import AddressInput from 'components/evm/inputs/AddressInput.vue';
import UserInfo from 'components/evm/UserInfo.vue';
import { CURRENT_CONTEXT, useChainStore, useAccountStore, getAntelope } from 'src/antelope';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import NumberedList from 'components/NumberedList.vue';
import { isValidAddressFormat } from 'src/antelope/stores/utils';
import { useI18n } from 'vue-i18n';

const route = useRoute();
const router = useRouter();
const { t: $t } = useI18n();

const ant = getAntelope();
const nftStore = useNftsStore();
const chainStore = useChainStore();
const accountStore = useAccountStore();

const explorerUrl = (chainStore.currentChain.settings as EVMChainSettings).getExplorerUrl();
let addressIsValid = false;

const tabs = ref<String[]>(['attributes', 'transfer']);
const nft = ref<ShapedNFT | null>(null);
const loading = ref(true);
const address = ref('');

const contractAddress = route.query.contract as string;
const nftId = route.query.id as string;
let nftType: ERC1155_TYPE | ERC721_TYPE | null = null;

onBeforeMount(async () => {
    if (contractAddress && nftId) {
        const erc721Details = await nftStore.fetchNftDetails(CURRENT_CONTEXT, contractAddress, nftId, ERC721_TYPE);
        const erc1155Details = await nftStore.fetchNftDetails(CURRENT_CONTEXT, contractAddress, nftId, ERC1155_TYPE);

        if (erc721Details) {
            nft.value = erc721Details;
            nftType = ERC721_TYPE;
        } else if (erc1155Details) {
            nft.value = erc1155Details;
            nftType = ERC1155_TYPE;
        }
        loading.value = false;
    }
});

const contractAddressIsValid = computed(
    () => isValidAddressFormat(contractAddress),
);

const contractLink = computed(() => {
    if (!contractAddressIsValid.value) {
        return '';
    }

    return `${explorerUrl}/address/${contractAddress}`;
});

const ownerLink = computed(() => {
    if (!nft.value) {
        return '';
    }

    return `${explorerUrl}/address/${nft.value.ownerAddress}`;
});

const filteredAttributes = computed(() =>
    nft.value?.attributes.filter(attr => !!attr.label && !!attr.text),
);

const loggedAccount = computed(() =>
    accountStore.loggedEvmAccount,
);

async function startTransfer(){

    const nameString = `${nft.value.contractPrettyName || nft.value.contractAddress} #${nft.value.id}`;
    const dismiss = ant.config.notifyNeutralMessageHandler(
        $t('notification.neutral_message_sending', { quantity: nameString, address: address.value }),
    );
    try{
        const trx = await nftStore.transferNft(CURRENT_CONTEXT, contractAddress, nftId, nftType, loggedAccount.value.address, address.value);
        dismiss();
        ant.config.notifySuccessfulTrxHandler(
            `${explorerUrl}/tx/${trx.hash}`,
        );
        router.push({ query: { tab: 'attributes' } });
    }catch(e){
        console.error(e); // tx error notification handled in store
    }
}

</script>

<template>
<AppPage :tabs="tabs">
    <template v-slot:header>
        <div
            :class="{
                'c-nft-details__header-container': true,
                'c-nft-details__header-container--grid': nft !== null || loading,
            }"
        >
            <template v-if="loading">
                <div
                    v-for="index in 5"
                    :key="`nft-details-page-${index}`"
                    class="c-nft-details__header-card c-nft-details__header-card--placeholder"
                >
                    <q-skeleton type="rect" class="c-nft-details__header-skeleton" />
                </div>
            </template>

            <template v-else-if="nft === null">
                <h1 class="u-text--center q-mb-md u-text--high-contrast">
                    {{ $t('nft.collectible_not_found_header') }}
                </h1>
                <p class="q-mb-xl">
                    {{ $t('nft.collectible_not_found_subheader') }}
                </p>
            </template>

            <template v-else>
                <NftViewer
                    :nft="nft"
                    :previewMode="false"
                    :tileMode="true"
                    class="c-nft-details__viewer"
                />
                <NftDetailsCard title="Collection" class="c-nft-details__header-card">
                    <ExternalLink :text="nft.contractPrettyName || nft.contractAddress" :url="contractLink" />
                </NftDetailsCard>

                <NftDetailsCard title="ID" class="c-nft-details__header-card">
                    {{ nft.id }}
                </NftDetailsCard>

                <NftDetailsCard title="Owner" class="c-nft-details__header-card">
                    <ExternalLink :text="nft.ownerAddress" :url="ownerLink" />
                </NftDetailsCard>

                <NftDetailsCard v-if="nft.description" title="Description" class="c-nft-details__header-card">
                    {{ nft.description }}
                </NftDetailsCard>
            </template>

        </div>
    </template>

    <template v-slot:attributes>
        <div class="c-nft-details__body-container">
            <q-skeleton v-if="loading" type="text" class="c-nft-details__body-header-skeleton"/>
            <h4
                v-else
                :class="{
                    'q-mb-lg': true,
                    'u-text--center': nft === null,
                }"
            >
                <template v-if="nft === null">
                    {{ $t('nft.collectible_not_found_recommendation') }}
                </template>
                <template v-else>
                    {{ $t('global.attributes') }}
                </template>
            </h4>

            <div
                :class="{
                    'c-nft-details__attributes-container': true,
                    'c-nft-details__attributes-container--not-found': nft === null && !loading,
                }"
            >
                <template v-if="loading">
                    <q-skeleton
                        v-for="index in 9"
                        :key="`nft-detail-body-skeleton-${index}`"
                        class="c-nft-details__attribute-skeleton"
                    />
                </template>

                <template v-else-if="nft === null">
                    <NumberedList>
                        <template v-slot:1>
                            <p>
                                {{ $t('nft.collectible_not_found_contract_part_1') }}
                                <span class="o-text--paragraph-bold">
                                    {{ $t('nft.collectible_not_found_contract_part_2_bold') }}
                                </span>
                                {{ $t('nft.collectible_not_found_contract_part_3') }}

                                <template v-if="contractAddressIsValid">
                                    {{ $t('nft.collectible_not_found_contract_part_4') }}
                                    <br>
                                    <ExternalLink :text="contractAddress" :url="contractLink" />
                                </template>

                                <template v-else>
                                    {{ $t('nft.collectible_not_found_contract_invalid') }}
                                </template>
                            </p>
                        </template>

                        <template v-slot:2>
                            <p>
                                {{ $t('nft.collectible_not_found_nft_id_part_1') }}
                                <span class="o-text--paragraph-bold">
                                    {{ $t('global.id') }}
                                </span>
                                {{ $t('nft.collectible_not_found_nft_id_part_3') }}
                            </p>
                        </template>
                    </NumberedList>
                </template>

                <template v-else>
                    <p v-if="!nft.attributes?.length">
                        {{ $t('nft.no_attributes') }}
                    </p>

                    <NftDetailsCard
                        v-for="(attribute, index) in filteredAttributes"
                        :key="`nft-attr-${index}`"
                        :title="attribute.label"
                        class="q-mb-sm"
                    >
                        {{ attribute.text }}
                    </NftDetailsCard>
                </template>
            </div>
        </div>
    </template>
    <template v-slot:transfer>
        <div class="c-nft-transfer__form-container">

            <q-form
                class="c-nft-transfer__form"
            >

                <div class="c-nft-transfer__row c-nft-transfer__row--1 row">
                    <div class="col">
                        <div class="c-nft-transfer__transfer-text">
                            {{ $t('nft.transfer') }} <span class="c-nft-transfer__transfer-text--bold"> {{ nft.contractPrettyName || nft.contractAddress }} #{{ nft.id }} </span>
                        </div>
                        <div class="c-nft-transfer__transfer-from c-nft-transfer__transfer-text--small">
                            {{ $t('nft.transfer_from') }}
                            &nbsp;
                            <UserInfo
                                class="c-nft-transfer__transfer-text--small c-nft-transfer__transfer-text--bold"
                                :displayFullAddress="false"
                                :showAddress="true"
                                :showCopyBtn="false"
                                :showUserMenu="false"
                                :lightweight="true"
                                :account="loggedAccount"
                            />
                            &nbsp;
                            {{ $t('nft.transfer_on_telos') }}
                        </div>
                    </div>
                </div>

                <div class="c-nft-transfer__row c-nft-transfer__row--2 row">
                    <div class="col">
                        <AddressInput
                            v-model="address"
                            name="nft-transfer-address-input"
                            :label="$t('evm_wallet.receiving_account')"
                            @update:isValid="addressIsValid = $event"
                        />
                    </div>
                </div>

                <div class="c-nft-transfer__row c-nft-transfer__row--3 row">
                    <div class="col">
                        <div class="justify-end row">
                            <q-btn
                                color="primary"
                                class="wallet-btn"
                                :label="$t('nft.transfer_collectible')"
                                :loading="false"
                                :disable="!addressIsValid"
                                @click="startTransfer"
                            />
                        </div>
                    </div>
                </div>
            </q-form>
        </div>
    </template>
</AppPage>
</template>

<style lang="scss">
.c-nft-details {
    $this: &;

    &__header-container {
        &--grid {
            display: grid;
            grid-template-areas:
                'a'
                'b'
                'c'
                'd'
                'e';
            gap: 8px;
            width: 100%;

            @include sm-and-up {
                grid-template-areas:
                'a a'
                'b b'
                'c d'
                'e e';
                max-width: 432px;
            }

            @include md-and-up {
                grid-template-areas:
                'a a a b b'
                'a a a c d'
                'a a a e e'
                'a a a . .';
                max-width: 1000px;
                width: max-content;
                grid-template-columns: repeat(5, 1fr);
            }
        }
    }

    &__body-container {
        margin: auto;
        max-width: 1000px;
    }

    &__viewer {
        grid-area: a;
    }

    &__header-card {
        &:nth-of-type(2) {
            grid-area: b;
        }

        &:nth-of-type(3) {
            grid-area: c;
        }

        &:nth-of-type(4) {
            grid-area: d;
        }

        &:nth-of-type(5) {
            grid-area: e;
        }

        &--placeholder {
            margin: auto;
            height: 80px;
            width: 100%;

            &:first-of-type {
                grid-area: a;
                width: 270px;
                height: 270px;

                @include md-and-up {
                    width: 432px;
                    height: 432px;
                }
            }
        }
    }

    &__header-skeleton {
        height: 100%;
        width: 100%;
    }

    &__attributes-container {
        display: grid;
        gap: 8px;
        grid-template-columns: 1fr;

        &:not(#{$this}__attributes-container--not-found) {
            @include sm-and-up {
                grid-template-columns: 1fr 1fr;
            }

            @include md-and-up {
                grid-template-columns: 1fr 1fr 1fr;
            }
        }

        &--not-found {
            max-width: 400px;
            margin: auto;
        }
    }

    &__body-header-skeleton {
        width: 100%;
        height: 50px;
        max-width: 250px;
        margin-bottom: 24px;
    }

    &__attribute-skeleton {
        height: 100px;
    }
}

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

    &__transfer-from{
        display: flex;
    }

    &__transfer-text{
        font-size: 24px;
        font-style: normal;
        font-weight: 400;

        &--small{
            font-size: 16px;
                // override UserInfo component styling
            .o-text--header-4{
                font-size: 16px !important;
            }
        }

        &--bold{
            font-weight: 600;
        }
    }
}

// refactor as global used in several places
.q-btn.wallet-btn {
    @include text--header-5;
    &+& {
        margin-left: 16px;
    }
}

</style>
