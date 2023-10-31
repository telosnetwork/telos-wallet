<script setup lang="ts">
import AppPage from 'components/evm/AppPage.vue';
import { useNftsStore } from 'src/antelope/stores/nfts';
import { useRoute } from 'vue-router';
import { Collectible, Erc1155Nft, Erc721Nft, getErc1155Owners, getErc721Owner } from 'src/antelope/types';
import { computed, onBeforeMount, onMounted, onUnmounted, ref } from 'vue';
import NftViewer from 'pages/evm/nfts/NftViewer.vue';
import NftDetailsCard from 'pages/evm/nfts/NftDetailsCard.vue';
import ExternalLink from 'components/ExternalLink.vue';
import ToolTip from 'components/ToolTip.vue';
import {
    CURRENT_CONTEXT,
    useAccountStore,
    useChainStore,
    useContractStore,
} from 'src/antelope';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import NumberedList from 'components/NumberedList.vue';
import { isValidAddressFormat } from 'src/antelope/stores/utils';
import { useI18n } from 'vue-i18n';
import { abbreviateNumber } from 'src/antelope/stores/utils/text-utils';

const route = useRoute();
const { t: $t } = useI18n();

const nftStore = useNftsStore();
const chainStore = useChainStore();
const contractStore = useContractStore();
const explorerUrl = (chainStore.currentChain.settings as EVMChainSettings).getExplorerUrl();
const contractAddress = route.query.contract as string;
const nftId = route.query.id as string;

// data
const nft = ref<Collectible | null>(null);
const loading = ref(true);


// computed
// const userAddress = computed(() => useAccountStore().currentEvmAccount?.address); eztodo
const userAddress = computed(() => '0x13B745FC35b0BAC9bab9fD20B7C9f46668232607');
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
        nft.value = await nftStore.fetchNftDetails(CURRENT_CONTEXT, contractAddress, nftId);
        loading.value = false;
    }
});

let timer: ReturnType<typeof setInterval> | undefined;
const minuteMilliseconds = 60 * 1000;
onMounted(() => {
    // update owner info once per minute
    timer = setInterval(async () => {
        if (nft.value instanceof Erc721Nft) {
            const contract = await contractStore.getContract(CURRENT_CONTEXT, nft.value.contractAddress);
            const contractInstance = await contract?.getContractInstance();

            if (!contractInstance) {
                // eztodo make this antelopeerror
                throw new Error('Could not get contract instance');
            }

            const owner = await getErc721Owner(contractInstance, nft.value.id);
            nft.value.owner = owner;
        } else if (nft.value instanceof Erc1155Nft) {
            const indexer = (chainStore.currentChain.settings as EVMChainSettings).getIndexer();
            const owners = await getErc1155Owners(nft.value.contractAddress, nft.value.id, indexer);
            nft.value.owners = owners;
        }
    }, minuteMilliseconds);
});

onUnmounted(() => {
    if (timer) {
        clearInterval(timer);
    }
});
</script>

<template>
<AppPage>
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

                <NftDetailsCard
                    v-if="isErc1155 && userAddress"
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
                    v-if="isErc1155 && userAddress"
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

        </div>
    </template>

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
