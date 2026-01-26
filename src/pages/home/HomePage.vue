<script setup lang="ts">
import { computed,  onMounted,  ref, watch } from 'vue';

import LoginButtons from 'pages/home/LoginButtons.vue';
import { LocationQueryValue, useRoute, useRouter } from 'vue-router';
import { CURRENT_CONTEXT, getAntelope, useChainStore } from 'src/antelope';
import { useI18n } from 'vue-i18n';
import { ChainSettings } from 'src/antelope/types';
import { settings } from 'src/antelope/stores/chain';

type TabReference = 'evm' | 'zero' | 'unset';

const { t: $t } = useI18n();
const route = useRoute();
const router = useRouter();
const chainStore = useChainStore();

const tab = ref<TabReference>('unset');
const walletOption = computed(() => route.query.login as LocationQueryValue);

interface Network {
    value: string;
    tab: string;
    chain: ChainSettings;
}

const networks = [
    {
        value: 'telos-evm',
        tab: 'evm',
        chain: settings['telos-evm'],
    },
    {
        value: 'telos',
        tab: 'zero',
        chain: settings['telos'],
    },
    {
        value: 'telos-evm-testnet',
        tab: 'evm',
        chain: settings['telos-evm-testnet'],
    },
    {
        value: 'telos-testnet',
        tab: 'zero',
        chain: settings['telos-testnet'],
    },
] as Network[];

const selectedNetwork = ref<Network | undefined>(undefined);

function setTab(login: TabReference): void {
    if (route.path !== login){
        router.replace({ path: route.path, query:{ login } });
        tab.value = login;
    }
}

onMounted(() => {
    // we check if the url has the network parameter and if so, we connect to that network
    // Otherwise we just let the store decide which network to connect to
    const network = new URLSearchParams(window.location.search).get('network');
    if (network) {
        // only if the network is in the list of networks we set it as the selected network
        selectedNetwork.value = networks.find(n => n.value === network);
    }

    if (!selectedNetwork.value) {
        // set the default network
        selectedNetwork.value = networks.find(n => n.value === 'telos-evm');
    }
});

watch(selectedNetwork, () => {
    if (selectedNetwork.value) {
        chainStore.setChain(CURRENT_CONTEXT, selectedNetwork.value.value);
        const login = selectedNetwork.value.tab;
        const network = selectedNetwork.value.value;
        router.replace({ query:{ ...route.query, login, network } });
        tab.value = login as TabReference;
    }
});



</script>

<template>
<q-layout>
    <q-page-container class="c-home__page-container">
        <div class="c-home">
            <div class="c-home__container">
                <div class="c-home__logo-container"><img
                    src="branding/telos-wallet-light.png"
                    :alt="$t('home.wallet_logo_alt')"
                    class="c-home__logo"
                ></div>
                <div class="c-home__button-container">
                    <div class="c-home__network-selector-container" role="tablist">

                        <q-select
                            v-model="selectedNetwork"
                            outlined
                            :label="$t('global.network')"
                            :options="networks"
                            class="c-home__network-selector"
                            :showPopup="true"
                            color="accent"
                            label-color="grey"
                        >
                            <template v-slot:selected>
                                <span>{{ selectedNetwork?.chain.getDisplay() }}</span>
                            </template>

                            <template v-slot:option="scope">
                                <q-item class="c-home__network-selector-op" v-bind="scope.itemProps">
                                    <q-avatar :size="'32px'" :src="scope.opt.chain.getSmallLogoPath()" class="c-home__network-selector-op-icon">
                                        <img class="c-home__network-selector-op-icon" :src="scope.opt.chain.getSmallLogoPath()">
                                    </q-avatar>
                                    <q-item-label class="c-home__network-selector-op-name">{{ scope.opt.chain.getDisplay() }}</q-item-label>
                                </q-item>
                            </template>
                        </q-select>

                    </div>

                    <LoginButtons
                        :chain="tab"
                    />

                </div>
                <div class="c-home__external-link">
                    <a
                        href="https://docs.telos.net/evm/about/setup-a-wallet"
                        target="_blank"
                        class="c-home__external-link-text"
                    >
                        {{$t('home.wallet_introduction')}}
                    </a>
                    <q-icon size="16px" name="launch" />
                </div>
                <q-footer bordered class="c-home__footer">

                    <q-toolbar class="c-home__footer-second-line bg-dark flex-center">
                        <a
                            href="https://www.telos.net/terms-and-conditions"
                            target="_blank"
                            class="c-home__external-link-text"
                        >
                            {{$t('home.terms')}}
                        </a>
                        &nbsp;&nbsp;|&nbsp;&nbsp;
                        <a
                            href="https://www.telos.net/privacy-policy"
                            target="_blank"
                            class="c-home__external-link-text"
                        >
                            {{$t('home.privacy')}}
                        </a>
                    </q-toolbar>
                </q-footer>
            </div>

        </div>
    </q-page-container>
</q-layout>

</template>

<style lang="scss">
.c-home {
    position: relative;
    background: var(--sidebar-gradient);  // Use darker gradient for better text readability
    width: 100%;
    padding-top: 64px;

    &__page-container {
        // override inline style of unknown origin (do not delete)
        padding-bottom: 0 !important;
    }

    &__container {
        min-height: calc(100svh - 64px);
        position: relative;
        padding-bottom: 88px;
    }

    &__logo-container {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 48px;
    }

    &__logo-container {
        flex-grow: 1;
        align-self: center;
        display: flex;
        flex-direction: column;
        justify-content: space-evenly;
    }

    &__logo {
        width: 180px;
    }

    &__button-container {
        border-radius: 4px;
        padding: 24px;
        background-color: rgba(white, 0.1);
        max-width: 320px;
        margin: 0 auto 48px;
    }

    &__network-selector-container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        margin-bottom: 25px;
        padding: 7px;
    }

    &__network-selector {
        .q-field__native, .q-field__marginal {
            color: white;
        }

        &-op {
            display: flex;
            align-items: center;
            gap: 8px;
            &-name {
                margin-top: 2px;
            }
            &-avatar {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                overflow: hidden;
            }

            &-icon {
                width: 32px;
                height: 32px;
            }
        }
    }

    .q-field--outlined .q-field__control:before {
        border-color: white;
    }

    &__menu-back-button {
        color: white;
        margin-bottom: 24px;
    }

    &__external-link {
        flex-grow: 1;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 4px;

        color: white;
    }

    &__external-link-text {
        @include text--small;
        color: white;
        text-decoration: none;

        &:hover {
            text-decoration: underline;
        }
    }

    &__footer {
        position: absolute;
        bottom: 0;
    }

    &__connect-wallet {
        z-index: $z-index--connect-wallet-popup;
    }

    @include md-and-up {
        &__logo-container {
            margin-bottom: 128px;
        }
    }
}

</style>
