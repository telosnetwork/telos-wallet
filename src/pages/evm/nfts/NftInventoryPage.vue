<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import AppPage from 'components/evm/AppPage.vue';
import NftTile from 'pages/evm/nfts/NftTile.vue';
import ExternalLink from 'components/ExternalLink.vue';

import { useNftsStore } from 'src/antelope/stores/nfts';
import { NFTClass } from 'src/antelope/types';

const nftStore = useNftsStore();

// data
const loading = computed(() => nftStore.loggedInventoryLoading);
const showNftsAsTiles = ref(true);
const collectionFilter = ref('');
const collectionList = ref(['', 'Test', 'Test 2']);
const searchFilter = ref('');

const nfts = computed(() => nftStore.getInventory('logged')?.list || [] as NFTClass[]);

</script>

<template>
<AppPage>
    <template v-slot:header>
        <h1>{{ $t('evm_wallet.inventory') }}</h1>
    </template>

    <div v-if="loading" class="q-mt-xl flex flex-center">
        <q-spinner size="lg" />
    </div>

    <div v-else class="c-nft-page">
        <!--eztodo i18n-->
        <div class="c-nft-page__controls-container">
            <q-select
                v-model="collectionFilter"
                :options="collectionList"
                outlined
                label="Collection"
                class="c-nft-page__input"
            />

            <q-input
                v-model="searchFilter"
                outlined
                label="Search"
                class="c-nft-page__input"
            >
                <template v-slot:append>
                    <q-icon
                        v-if="searchFilter !== ''"
                        name="close"
                        class="cursor-pointer"
                        @click="searchFilter = ''"
                    />
                    <q-icon name="search" />
                </template>
            </q-input>
            <div class="c-nft-page__grid-toggles">
                <!--eztodo aria a11y-->
                <q-icon
                    size="sm"
                    name="format_list_bulleted"
                    :color="!showNftsAsTiles ? 'primary' : ''"
                    @click="showNftsAsTiles = false"
                />
                <q-icon
                    size="sm"
                    name="grid_view"
                    :color="showNftsAsTiles ? 'primary' : ''"
                    @click="showNftsAsTiles = true"
                />
            </div>
        </div>



        <div v-if="nfts.length === 0" class="c-nft-page__empty-inventory" >
            <h2 class="c-nft-page__empty-title">You don't have any digital collectibles yet</h2>
            <p class="c-nft-page__empty-text">Purchase your first collectible <ExternalLink :text="'here'" :url="'contractLink'" /></p>
        </div>

        <div v-if="showNftsAsTiles" class="c-nft-page__tiles-container">
            <NftTile
                v-for="nft in nfts"
                :key="nft.key"
                :nft="nft"
            />
        </div>

        <div v-else>
            nft table view placeholder
        </div>
    </div>
</AppPage>
</template>

<style lang="scss">
.c-nft-page {
    max-width: 1000px;
    margin: auto;

    &__controls-container {
        margin: 24px 0;
        display: flex;
        gap: 8px;
        flex-direction: column;
        align-items: center;

        @include md-and-up {
            flex-direction: row;
            margin: 16px 0 32px;
        }
    }

    &__empty-inventory {
        text-align: center;
        margin: auto;
        margin-top: 100px;
        margin-bottom: 100px;
    }

    &__empty-title {
    }

    &__empty-text {
        margin-top: 20px;
    }

    &__input {
        //min-width: 275px;
        //max-width: 375px;
        //width: 100%;
        width:  clamp(275px, 100%, 375px);

        @include md-and-up {
            flex-basis: 100%;
        }
    }

    &__grid-toggles {
        width: 100%;
        max-width: 375px;
        display: flex;
        gap: 8px;
        justify-content: center;
        margin-top: 16px;

        @include md-and-up {
            margin-top: unset;
            justify-content: flex-end;
        }
    }

    &__tiles-container {
        width: max-content;
        margin: auto;
        display: grid;
        gap: 16px;
        grid-template-columns: 1fr;

        @media only screen and (min-width: 700px) {
            grid-template-columns: 1fr 1fr;
        }

        @media only screen and (min-width: 1400px) {
            grid-template-columns: 1fr 1fr 1fr;
        }
    }
}
</style>
