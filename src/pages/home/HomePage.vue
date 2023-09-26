<script lang="ts">
import { defineComponent } from 'vue';
import { mapGetters } from 'vuex';

import NativeLoginButton from 'pages/home/NativeLoginButton.vue';
import EVMLoginButtons from 'pages/home/EVMLoginButtons.vue';
import { getAntelope, useEVMStore, usePlatformStore } from 'src/antelope';
import { Menu } from 'src/pages/home/MenuType';

export default defineComponent({
    name: 'HomePage',
    components: {
        EVMLoginButtons,
        NativeLoginButton,
    },
    data: (): {
        tab: 'left' | 'right',
        currentMenu: Menu,
    } => ({
        tab: 'left',
        currentMenu: Menu.MAIN,
    }),

    computed: {
        ...mapGetters('account', ['isAuthenticated']),
        showLeftRightBtns(): boolean {
            return this.currentMenu === Menu.MAIN;
        },
    },

    methods: {
        goBack(): void {
            this.currentMenu = Menu.MAIN;
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
                <div class="c-home__button-container">
                    <div v-if="showLeftRightBtns" class="c-home__network-toggle-container" role="tablist">
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

                    <NativeLoginButton v-if="tab === 'right'" />

                    <EVMLoginButtons
                        v-else-if="tab === 'left'"
                        v-model="currentMenu"
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
                        <a
                            href="https://docs.telos.net/evm/cloud-wallet/"
                            target="_blank"
                            class="c-home__footer-developer-link"
                        >
                            <div class="c-home__footer-developer-title">
                                <span class="c-home__footer-developer-title-text">{{ $t('home.developers_banner_title') }}</span>
                            </div>
                            <div class="c-home__footer-developer-text">{{ $t('home.developers_banner_text') }}</div>
                            <q-icon class="c-home__footer-developer-icon" size="16px" name="arrow_forward" />
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
        align-self: center;
        flex-grow: 1;

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

        &--small {
            min-height: 38px;
        }
    }

    &__footer-developer {
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

            &--small {
                grid-template: 'a c' / auto auto;
            }
        }
        &-title {
            grid-area: a;
            text-align: center;
            &-text {
                @include text--small-bold;
                @include gradient_text;
                text-transform: uppercase;
                vertical-align: top;
            }
        }
        &-text {
            @include text--small;
            grid-area: b;
            color: white;
            text-align: left;
            &--small {
                display: none;
            }
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
