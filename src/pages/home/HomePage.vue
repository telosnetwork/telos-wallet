<script setup lang="ts">
import { computed,  onMounted,  ref } from 'vue';

import LoginButtons from 'pages/home/LoginButtons.vue';
import { Menu } from 'src/pages/home/MenuType';
import { LocationQueryValue, useRoute, useRouter } from 'vue-router';
import { CURRENT_CONTEXT, useChainStore } from 'src/antelope';

type TabReference = 'evm' | 'zero' | 'unset';

const route = useRoute();
const router = useRouter();
const chainStore = useChainStore();

const tab = ref<TabReference>('unset');
const walletOption = computed(() => route.query.login as LocationQueryValue);

function setChainForTab(tab: TabReference): void {
    // set chain
    if (!process.env.CHAIN_NAME) {
        console.error('No chain name specified in environment config; the application will not run correctly');
    } else {
        const chainNetworkNames: Record<string, string> = (tab === 'zero') ? {
            'telos': 'telos',
            'telos-testnet': 'telos-testnet',
        } : {
            'telos': 'telos-evm',
            'telos-testnet': 'telos-evm-testnet',
        };
        const network: string = chainNetworkNames[process.env.CHAIN_NAME];
        chainStore.setChain(CURRENT_CONTEXT, network);
    }
}

function setTab(login: TabReference): void {
    if (route.path !== login){
        router.replace({ path: route.path, query:{ login } });
        tab.value = login;
        setChainForTab(login);
    }
}

onMounted(() => {
    // -- Redirect --
    // If we receive a redirect parameter in the URL, we redirect to the corresponding page after the user has completed the login process
    // The first thing we do is to check if the URL has a redirect parameter to set a local variable
    const redirect = new URLSearchParams(window.location.search).get('redirect');
    // if the redirect parameter is present, need to force the Google One Tap button to be shown on Zero tab
    // -- iFrame --
    // We can also receive an iframe parameter in the URL, which will be used to determine if the page is being loaded inside an iframe
    // if so, we will perform exactly the same steps as in the redirect case
    // except that we will not redirect the user to the corresponding page
    // instead we send the credentials (accountname, email) to the parent window
    const iframe = new URLSearchParams(window.location.search).get('iframe');
    if (redirect || iframe) {
        setTab('zero');
    } else if (walletOption.value && walletOption.value !== 'unset') {
        setTab(walletOption.value as TabReference);
    } else {
        // set evm as default
        setTab('evm');
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
                    <div class="c-home__network-toggle-container" role="tablist">
                        <button
                            :class="{
                                'c-home__network-toggle-button': true,
                                'c-home__network-toggle-button--activated': tab === 'evm',
                            }"
                            role="tab"
                            :aria-selected="tab === 'evm'"
                            @keydown.enter="setTab('evm')"
                            @click="setTab('evm')"
                        >

                            {{ $t('global.telos_evm') }}
                        </button>
                        <button
                            :class="{
                                'c-home__network-toggle-button': true,
                                'c-home__network-toggle-button--activated': tab === 'zero',
                            }"
                            role="tab"
                            :aria-selected="tab === 'zero'"
                            @keydown.enter.space="setTab('zero')"
                            @click="setTab('zero')"
                        >

                            {{ $t('global.native') }}
                        </button>
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
    background: var(--site-gradient);
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

    &__network-toggle-container {
        display: flex;
        justify-content: center;
        margin-bottom: 48px;
    }

    &__network-toggle-button {
        text-transform: uppercase;
        text-align: center;
        padding: 8px 24px;
        background-color: rgba(white, 0.2);
        border: unset;
        color: white;
        cursor: pointer;

        &:first-of-type {
            border-radius: 4px 0 0 4px;
        }

        &:last-of-type {
            border-radius: 0 4px 4px 0;
        }

        &--activated {
            background-color: white;
            color: var(--link-color);
        }
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
