<script lang="ts">
import { defineComponent } from 'vue';
import { mapGetters } from 'vuex';

import NativeLoginButton from 'pages/home/NativeLoginButton.vue';
import EVMLoginButtons from 'pages/home/EVMLoginButtons.vue';
import ConnectWalletOptions from 'pages/home/ConnectWalletOptions.vue';

export default defineComponent({
    name: 'HomePage',
    components: {
        EVMLoginButtons,
        NativeLoginButton,
        ConnectWalletOptions,
    },
    data: (): {
        tab: 'left' | 'right'
        showWalletOptions: boolean,
        toggleWalletConnect: boolean,
    } => ({
        tab: 'left',
        showWalletOptions: false,
        toggleWalletConnect: false,
    }),

    computed: {
        ...mapGetters('account', ['isAuthenticated']),
    },
});
</script>

<template>
<q-layout>
    <q-page-container class="c-home__page-container">
        <div class="c-home">
            <div class="c-home__container">
                <img
                    src="~assets/logo--telos-wallet.svg"
                    :alt="$t('home.wallet_logo_alt')"
                    class="c-home__logo"
                >
                <div v-if="!showWalletOptions" class="c-home__button-container">
                    <div class="c-home__network-toggle-container" role="tablist">
                        <button
                            :class="{
                                'c-home__network-toggle-button': true,
                                'c-home__network-toggle-button--activated': tab === 'left',
                            }"
                            role="tab"
                            :aria-selected="tab === 'left'"
                            @keydown.enter="tab = 'left'"
                            @click="tab = 'left'"
                        >

                            {{ $t('global.telos_evm') }}
                        </button>
                        <button
                            :class="{
                                'c-home__network-toggle-button': true,
                                'c-home__network-toggle-button--activated': tab === 'right',
                            }"
                            role="tab"
                            :aria-selected="tab === 'right'"
                            @keydown.enter.space="tab = 'right'"
                            @click="tab = 'right'"
                        >

                            {{ $t('global.native') }}
                        </button>
                    </div>

                    <NativeLoginButton v-if="tab === 'right'" />

                    <EVMLoginButtons
                        v-else-if="tab === 'left'"
                        @toggle-wallet-connect="toggleWalletConnect = true"
                        @show-wallet-options="showWalletOptions = true"
                    />
                </div>
                <div class="c-home__connect-wallet">
                    <ConnectWalletOptions
                        v-show="showWalletOptions"
                        :toggleWalletConnect="toggleWalletConnect"
                        @toggle-wallet-connect="toggleWalletConnect = false"
                        @close-wallet-options="showWalletOptions = false"
                    />
                </div>
                <div v-if="tab === 'left'" class="c-home__external-link">
                    <a
                        href="https://docs.telos.net/overview/getting-started/wallet-introduction"
                        target="_blank"
                        class="c-home__external-link-text"
                    >
                        {{$t('home.wallet_introduction')}}
                    </a>
                    <q-icon size="16px" name="launch" />
                </div>
                <q-footer bordered class="c-home__footer">
                    <q-toolbar class="bg-dark flex-center">
                        <a
                            href="https://www.telos.net/terms-of-service"
                            target="_blank"
                            class="text-white"
                        >
                            {{$t('home.terms')}}
                        </a>
                        &nbsp;&nbsp;|&nbsp;&nbsp;
                        <a
                            href="https://www.telos.net/privacy-policy"
                            target="_blank"
                            class="text-white"
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
    background: $site-gradient;
    min-height: 100vh;

    &__page-container {
        // override inline style of unknown origin
        padding-bottom: 0 !important;
    }

    &__container {
        display: flex;
        flex-direction: column;
        padding: 32px 24px 0;
        min-height: 40rem;
    }

    &__logo {
        width: 240px;
        margin: 0 auto;

        @include sm-and-up {
            margin: 128px auto 88px;
        }

        @include mobile-landscape {
            margin: 60px auto 88px;
        }

    }

    &__button-container {
        border-radius: 4px;
        padding: 24px;
        background-color: rgba(white, 0.1);
        max-width: 320px;
        margin: auto;
        @include mobile-landscape {
            // footer height + margin
            margin: auto auto 90px;
        }
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

    &__external-link {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 4px;

        margin-top: 24px;
        color: white
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
        z-index: $z-index--footer;
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
