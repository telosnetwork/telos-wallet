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
import NftViewer from 'src/components/evm/nfts/NftViewer.vue';
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

const chainSettings = chainStore.currentChain.settings as EVMChainSettings;
const explorerUrl = chainSettings.getExplorerUrl();
const contractAddress = route.query.contract as string;
const nftId = route.query.id as string;

type Tab = 'attributes' | 'transfer' | 'owners';
const ATTRIBUTES = 'attributes';
const TRANSFER = 'transfer';
const OWNERS = 'owners'; // for 1155 only
const tabsOrder: Record<Tab, number> = { [ATTRIBUTES]: 1, [TRANSFER]: 2, [OWNERS]: 3 };


// data
const nft = ref<Collectible | null>(null);
const loading = ref(true);
const tabs = ref<Tab[]>([ATTRIBUTES]);


// computed
const loggedAccount = computed(() =>
    accountStore.loggedEvmAccount,
);
const userAddress = computed(() => loggedAccount.value?.address ?? '');
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
    // update owner info once per minute
    timer = setInterval(async () => {
        nft.value?.updateOwnerData();
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
        (isErc721.value && nftAsErc721.value.owner !== newAccount?.address) ||
        (isErc1155.value && !nftAsErc1155.value.owners[newAccount?.address]);

    if (shouldDisableTransfer) {
        disableTransfer();
    } else if (!tabs.value.includes(TRANSFER)) {
        // if user switches to owner of nft, restore transfer functionality
        enableTab(TRANSFER);
    }
});


const ownerFirstCheck = ref(false);
const indexer = chainSettings.getIndexer();
// if details refresh with new owner (on transfer), disable transfer functionality
watch(nft, () => {
    // Only if the indexer is down or behind, we want to update the owner data only once
    // just in case the current user is not the owner anymore
    if (nft.value && !chainSettings.isIndexerHealthy() && !ownerFirstCheck.value) {
        ownerFirstCheck.value = true;
        nft.value.updateOwnerData();
    }

    const shouldDisableTransfer = !nft.value ||
        (isErc721.value && nftAsErc721.value.owner !== loggedAccount.value?.address) ||
        (isErc1155.value && !nftAsErc1155.value.owners[loggedAccount.value?.address]);

    if (shouldDisableTransfer) {
        disableTransfer();
    } else if (!tabs.value.includes(TRANSFER)) {
        enableTab(TRANSFER);
    }

    if (isErc1155.value && !tabs.value.includes(OWNERS)) {
        enableTab(OWNERS);
    } else if (!isErc1155.value && tabs.value.includes(OWNERS)) {
        removeTab(OWNERS);
    }
}, { deep: true });


function disableTransfer(){
    router.replace({ query: { ...route.query, tab: ATTRIBUTES } });
    removeTab(TRANSFER);
}

function enableTab(tab: Tab) {
    const newTabs: Tab[] = [...tabs.value];
    if (!newTabs.includes(tab)) {
        newTabs.push(tab);
    }

    tabs.value = newTabs.sort((a, b) => tabsOrder[a] - tabsOrder[b]);
}

function removeTab(tab: Tab){
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
                'row': true,
            }"
        >
            <template v-if="loading">
                <div class="col-12">
                    <div class="row q-col-gutter-sm">
                        <div class="col-12 col-md-6">
                            <q-skeleton type="rect" class="c-nft-details__header-skeleton--large" />
                        </div>

                        <div class="col-12 col-md-6">
                            <div class="row q-col-gutter-sm">
                                <div class="col-12">
                                    <q-skeleton type="rect" class="c-nft-details__header-skeleton" />
                                </div>
                                <div class="col-6">
                                    <q-skeleton type="rect" class="c-nft-details__header-skeleton" />
                                </div>
                                <div class="col-6">
                                    <q-skeleton type="rect" class="c-nft-details__header-skeleton" />
                                </div>
                                <div class="col-12">
                                    <q-skeleton type="rect" class="c-nft-details__header-skeleton" />
                                </div>
                            </div>
                        </div>
                    </div>
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
                    class="col-12 col-md-6 q-mb-md q-pr-md"
                />

                <div class="col-12 col-md-6">
                    <div class="row q-col-gutter-sm">
                        <div class="col-12">
                            <NftDetailsCard :title="$t('global.collection')" class="c-nft-details__header-card">
                                <ExternalLink :text="nft.contractPrettyName || nft.contractAddress" :url="contractLink" />
                            </NftDetailsCard>
                        </div>

                        <div class="col-6">
                            <NftDetailsCard :title="$t('global.id')" class="c-nft-details__header-card col-6">
                                {{ nft.id }}
                            </NftDetailsCard>
                        </div>

                        <div class="col-6">
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
                        </div>

                        <div v-if="nft.description" class="col-12">
                            <NftDetailsCard
                                :title="$t('global.description')"
                                class="c-nft-details__header-card"
                            >
                                {{ nft.description }}
                            </NftDetailsCard>
                        </div>

                        <div v-if="isErc1155 && userAddress" class="col-6">
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
                        </div>

                        <div v-if="isErc1155" class="col-6">
                            <NftDetailsCard
                                :title="$t('global.total')"
                                class="c-nft-details__header-card col-6"
                            >
                                <ToolTip
                                    :text="nftSupplyText"
                                    :hideIcon="true"
                                >
                                    {{ nftSupplyTextAbbreviated }}
                                </ToolTip>
                            </NftDetailsCard>
                        </div>
                    </div>
                </div>
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
        flex-direction: column;

        &--grid {
            width: 100%;
            flex-direction: row;


            @include sm-and-up {
                max-width: 432px;
            }

            @include md-and-up {
                max-width: 1000px;
            }
        }
    }

    &__body-container {
        margin: auto;
        max-width: 1000px;
    }

    &__header-card {
        min-height: 88px;
    }

    &__header-skeleton {
        height: 88px;
        width: 100%;

        &--large {
            margin: auto;
            height: 270px;
            max-width: 270px;
        }
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
