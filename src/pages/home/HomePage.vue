<script setup lang="ts">
import { computed,  onMounted,  ref } from 'vue';

import NativeLoginButton from 'pages/home/NativeLoginButton.vue';
import EVMLoginButtons from 'pages/home/EVMLoginButtons.vue';
import { Menu } from 'src/pages/home/MenuType';
import { LocationQueryValue, useRoute, useRouter } from 'vue-router';

type TabReference = 'evm' | 'zero';

const route = useRoute();
const router = useRouter();

const tab = ref<TabReference>('evm');
const currentMenu = ref<Menu>(Menu.MAIN);

const showLoginBtns = computed((): boolean => currentMenu.value === Menu.MAIN);
const walletOption = computed(() => route.query.login as LocationQueryValue);

function goBack(): void {
    currentMenu.value = Menu.MAIN;
}

function setTab(login: TabReference): void {
    if (route.path !== login){
        router.replace({ path: route.path, query:{ login } });
        tab.value = login;
    }
}

onMounted(() => {
    if (walletOption.value){
        tab.value = walletOption.value as TabReference;
    }
});

</script>

<template>
<q-layout>
    <q-page-container class="c-home__page-container">
        <div class="c-home">
            <div class="c-home__container">
                <img
                    src="branding/telos-wallet-light.png"
                    :alt="$t('home.wallet_logo_alt')"
                    class="c-home__logo"
                >
                <div class="c-home__button-container">
                    <div v-if="showLoginBtns" class="c-home__network-toggle-container" role="tablist">
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
                    <div v-else>
                        <q-btn
                            class="c-home__menu-back-button"
                            flat
                            dense
                            icon="arrow_back_ios"
                            @click="goBack"
                        >

                            {{ $t('global.back') }}
                        </q-btn>
                    </div>

                    <NativeLoginButton v-if="tab === 'zero'" />

                    <EVMLoginButtons
                        v-else-if="tab === 'evm'"
                        v-model="currentMenu"
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
                            href="https://www.telos.net/terms-of-service"
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
    min-height: 100vh;
    display: flex;

    &__page-container {
        // override inline style of unknown origin (do not delete)
        padding-bottom: 0 !important;
    }

    &__container {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        padding-top: 32px;
        align-items: stretch;
        justify-content: space-between;
    }

    &__logo {
        width: 240px;
        // align-self: center;
        // flex-grow: 1;
        align-self: center;
        margin-top: 10rem;
        margin-bottom: 10rem;
    }

    &__button-container {
        align-self: center;
        border-radius: 4px;
        padding: 24px;
        background-color: rgba(white, 0.1);
        max-width: 320px;
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

        margin-top: 24px;
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

    // guarantees wallet connect on top of footer
    &__footer {
        position: relative;
    }
    &__connect-wallet {
        z-index: $z-index--connect-wallet-popup;
    }

    @media only screen and (max-height: 800px) {
        .c-home {
            &__container{
                min-height: unset;
            }
            &__logo{
                margin-top: unset;
                margin-bottom: unset;
            }
            &__button-container{
                margin-top: 2rem;
            }
        }
    }
}
</style>
