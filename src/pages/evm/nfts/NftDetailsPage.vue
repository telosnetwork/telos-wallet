<script setup lang="ts">
import {
    computed,
    onBeforeMount,
    onMounted,
    onUnmounted,
    ref,
    watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

import {
    CURRENT_CONTEXT,
    useAccountStore,
    useChainStore,
} from 'src/antelope';
import {
    Collectible,
    Erc1155Nft,
    ERC721_TYPE,
    Erc721Nft,
} from 'src/antelope/types';
import { useNftsStore } from 'src/antelope/stores/nfts';

import { isValidAddressFormat } from 'src/antelope/stores/utils';
import { abbreviateNumber } from 'src/antelope/stores/utils/text-utils';
import { EvmAccountModel } from 'src/antelope/stores/account';

import AppPage from 'components/evm/AppPage.vue';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import ExternalLink from 'components/ExternalLink.vue';
import NftDetailsCard from 'pages/evm/nfts/NftDetailsCard.vue';
import NftViewer from 'pages/evm/nfts/NftViewer.vue';
import NumberedList from 'components/NumberedList.vue';
import ToolTip from 'components/ToolTip.vue';
import NftOwnersTable from 'pages/evm/nfts/NftOwnersTable.vue';
import NftTransferForm from 'pages/evm/nfts/NftTransferForm.vue';

const route = useRoute();
const router = useRouter();
const { t: $t } = useI18n();

const nftStore = useNftsStore();
const chainStore = useChainStore();
const accountStore = useAccountStore();

const explorerUrl = (chainStore.currentChain.settings as EVMChainSettings).getExplorerUrl();
const contractAddress = route.query.contract as string;
const nftId = route.query.id as string;
const ATTRIBUTES = 'attributes';
const TRANSFER = 'transfer';
const OWNERS = 'owners'; // for 1155 only


// data
const nft = ref<Collectible | null>(null);
const loading = ref(true);
const tabs = ref<string[]>([ATTRIBUTES, TRANSFER, OWNERS]);


// computed
const loggedAccount = computed(() =>
    accountStore.loggedEvmAccount,
);
const userAddress = computed(() => loggedAccount.value.address);
const isErc721 = computed(() => nft.value instanceof Erc721Nft);
const isErc1155 = computed(() => nft.value instanceof Erc1155Nft);
const nftAsErc721 = computed(() => nft.value as Erc721Nft);
const nftAsErc1155 = computed(() => nft.value as Erc1155Nft);

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
    if (!nft.value || isErc1155.value) {
        return '';
    }

    return `${explorerUrl}/address/${(nft.value as Erc721Nft).owner}`;
});
const filteredAttributes = computed(() =>
    nft.value?.attributes.filter(attr => !!attr.label && !!attr.text),
);
const nftOwnersText = computed(() => {
    if (!nft.value || isErc721.value) {
        return '';
    }

    const owners = Object.keys((nft.value as Erc1155Nft).owners).length;
    if (owners.toString().length > 6) {
        return abbreviateNumber(navigator.language, owners);
    }

    return owners.toLocaleString();
});
const nftQuantityText = computed(() => {
    if (!nft.value || isErc721.value) {
        return '';
    }

    const quantity = (nft.value as Erc1155Nft).owners[userAddress.value] ?? 0;
    if (quantity.toString().length > 6) {
        return abbreviateNumber(navigator.language, quantity);
    }

    return quantity.toLocaleString();
});
const nftSupplyText = computed(() => {
    if (!nft.value || isErc721.value) {
        return '';
    }
    return (nft.value as Erc1155Nft).supply.toLocaleString();
});
const nftSupplyTextAbbreviated = computed(() => {
    if (!nft.value || isErc721.value) {
        return '';
    }
    const supply = (nft.value as Erc1155Nft).supply;
    if (supply.toString().length > 6) {
        return abbreviateNumber(navigator.language, supply);
    }

    return supply.toLocaleString();
});


// methods
onBeforeMount(async () => {
    if (contractAddress && nftId) {
        nft.value = await nftStore.fetchNftDetails(CURRENT_CONTEXT, contractAddress, nftId, ERC721_TYPE);

        if (nft.value instanceof Erc721Nft) {
            removeTab(OWNERS);
        }
    }
    loading.value = false;
});

let timer: ReturnType<typeof setInterval> | undefined;
const minuteMilliseconds = 60 * 1000;
onMounted(() => {
    const indexer = (chainStore.currentChain.settings as EVMChainSettings).getIndexer();

    // update owner info once per minute
    timer = setInterval(async () => {
        nft.value?.updateOwnerData(indexer);
    }, minuteMilliseconds);
});

onUnmounted(() => {
    if (timer) {
        clearInterval(timer);
    }
});


// if user switches account, disable transfer
watch(loggedAccount, (newAccount: EvmAccountModel) => {
    const shouldDisableTransfer = !nft.value ||
        (isErc721.value && nftAsErc721.value.owner !== newAccount.address) ||
        (isErc1155.value && !nftAsErc1155.value.owners[newAccount.address]);

    if (shouldDisableTransfer) {
        disableTransfer();
    } else if (!tabs.value.includes(TRANSFER)) {
        // if user switches to owner of nft, restore transfer functionality
        tabs.value.push(TRANSFER);
    }
});

// if details refresh with new owner (on transfer), disable transfer functionality
watch(nft, () => {
    const shouldDisableTransfer = !nft.value ||
        (isErc721.value && nftAsErc721.value.owner !== loggedAccount.value.address) ||
        (isErc1155.value && !nftAsErc1155.value.owners[loggedAccount.value.address]);

    if (shouldDisableTransfer) {
        disableTransfer();
    } else if (!tabs.value.includes(TRANSFER)) {
        tabs.value.push(TRANSFER);
    }
}, { deep: true });


function disableTransfer(){
    router.push({ query: { ...route.query, tab: 'attributes' } });
    removeTab(TRANSFER);
}

function removeTab(tab: string){
    if (tabs.value.includes(tab)){
        tabs.value.splice(tabs.value.findIndex(item => item === tab), 1);
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
                <NftDetailsCard :title="$t('global.collection')" class="c-nft-details__header-card">
                    <ExternalLink :text="nft.contractPrettyName || nft.contractAddress" :url="contractLink" />
                </NftDetailsCard>

                <NftDetailsCard :title="$t('global.id')" class="c-nft-details__header-card">
                    {{ nft.id }}
                </NftDetailsCard>

                <NftDetailsCard
                    v-if="isErc721"
                    :title="$t('global.owner')"
                    class="c-nft-details__header-card"
                >
                    <ExternalLink :text="nftAsErc721.owner" :url="ownerLink" />
                </NftDetailsCard>

                <NftDetailsCard
                    v-else
                    :title="$t('global.owners')"
                    class="c-nft-details__header-card"
                >
                    <ToolTip
                        :text="Object.keys(nftAsErc1155.owners).length.toLocaleString()"
                        :hideIcon="true"
                    >
                        {{ nftOwnersText }}
                    </ToolTip>
                </NftDetailsCard>

                <NftDetailsCard
                    v-if="nft.description"
                    :title="$t('global.description')"
                    class="c-nft-details__header-card"
                >
                    {{ nft.description }}
                </NftDetailsCard>

                <template v-if="isErc1155 && userAddress">
                    <NftDetailsCard
                        :title="$t('global.owned_by_you')"
                        class="c-nft-details__header-card"
                    >
                        <ToolTip
                            :text="(nftAsErc1155.owners[userAddress] ?? 0).toLocaleString()"
                            :hideIcon="true"
                        >
                            {{ nftQuantityText }}
                        </ToolTip>
                    </NftDetailsCard>

                    <NftDetailsCard
                        :title="$t('global.total')"
                        class="c-nft-details__header-card"
                    >
                        <ToolTip
                            :text="nftSupplyText"
                            :hideIcon="true"
                        >
                            {{ nftSupplyTextAbbreviated }}
                        </ToolTip>
                    </NftDetailsCard>
                </template>
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
        <NftTransferForm :nft="nft" />
    </template>

    <template v-slot:owners>
        <NftOwnersTable :owners="nftAsErc1155.owners" />
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
</style>
