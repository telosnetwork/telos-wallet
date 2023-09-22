<script lang="ts">
import { defineComponent } from 'vue';
import { mapGetters } from 'vuex';

import NativeLoginButton from 'pages/home/NativeLoginButton.vue';
import EVMLoginButtons from 'pages/home/EVMLoginButtons.vue';
import { getAntelope, useEVMStore, usePlatformStore } from 'src/antelope';

export default defineComponent({
    name: 'HomePage',
    components: {
        EVMLoginButtons,
        NativeLoginButton,
    },
    data: (): {
        tab: 'left' | 'right'
        showWalletOptions: boolean,
        showOAuthOptions: boolean,
        showWalletConnect: boolean,
        useInjectedProvider: string,
    } => ({
        tab: 'left',
        showWalletOptions: false,
        showOAuthOptions: false,
        showWalletConnect: false,
        useInjectedProvider: '',
    }),

    computed: {
        ...mapGetters('account', ['isAuthenticated']),
    },

    methods: {
        onUseInjectedProvider() {
            // first check the integrity of the injected provider
            const evm = useEVMStore();
            const platform = usePlatformStore();
            console.assert(platform.isMobile, 'onUseInjectedProvider should only be called on mobile');
            console.assert(evm.injectedProviderNames.length === 1, 'only one injected provider is supported for mobile');
            const providerName = evm.injectedProviderNames[0];
            const authenticator = evm.injectedProvider(providerName);
            if (!authenticator) {
                console.error(`${providerName} authenticator not found`);
                getAntelope().config.notifyFailureMessage(
                    this.$t(
                        'home.no_injected_provider_found',
                        { providerName },
                    ),
                );
                return;
            }
            // Everything is fine, let's use the injected provider
            this.useInjectedProvider = providerName;
        },
        onShowWalletConnect() {
            this.showWalletConnect = true;
            // put this variable back to false for an eventual re-open
            setTimeout(() => {
                this.showWalletConnect = false;
            }, 200);
        },
        onShowWalletOptions(show: boolean) {
            this.showWalletOptions = show;
            if (!show) {
                this.showOAuthOptions = false;
            }
        },
        onShowOAuthOptions(show: boolean) {
            this.showOAuthOptions = show;
            this.showWalletOptions = show;
        },
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
                        @show-wallet-connect="onShowWalletConnect()"
                        @show-wallet-options="onShowWalletOptions(true)"
                        @use-injected-provider="onUseInjectedProvider()"
                        @show-oauth-options="onShowOAuthOptions(true)"
                    />
                </div>
                <div v-if="tab === 'left'" class="c-home__external-link">
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
                    <q-toolbar class="c-home__footer-first-line bg-dark flex-center">
                        <a class="c-home__footer-developr-link" href="https://docs.telos.net/evm/cloud-wallet/" target="_blank">
                            <!-- TODO: https://github.com/telosnetwork/telos-wallet/issues/614 -->
                            <!-- this DEVELOPER banner is an image as a work-arroun for texts with gradient -->
                            <!-- div class="c-home__footer-developr-title">{{ $t('home.developers_banner_title') }}</div -->
                            <img
                                src="~assets/developer-banner.svg"
                                class="c-home__footer-developr-title-svg"
                            >
                            <div class="c-home__footer-developr-text c-home__external-link-text">{{ $t('home.developers_banner_text') }}</div>
                            <q-icon class="c-home__footer-developr-icon" size="16px" name="arrow_forward" />
                        </a>
                    </q-toolbar>
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

    &__footer-first-line {
        // bottom border for first line
        &::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 1px;
            background-color: #392468;
        }
    }

    &__footer-developr {
        &-link {
            text-decoration: none;
            max-width: 320px;
            padding: 10px;
            display: grid;
            gap: 5px;
            grid-template:
                "a a"
                "b c";

            @include sm-and-up {
                padding: 0px;
                gap: 14px;
                grid-template: 'a b c' / auto auto max-content;
                max-width: none;
            }
        }
        &-title-svg {
            // TODO: https://github.com/telosnetwork/telos-wallet/issues/614
            margin-top: 3px;
            margin-bottom: 5px;
            place-self: center;
        }
        &-title {
            @include text--small-bold;
            // font-size: 14px;
            text-transform: uppercase;
            grid-area: a;
            color: $gradientPurple;
            text-align: center;
            // font-weight: 600;
        }
        &-text {
            font-size: 16px;
            grid-area: b;
            color: white;
            text-align: left;
        }
        &-icon {
            grid-area: c;
            color: white;
            text-align: right;
        }
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
