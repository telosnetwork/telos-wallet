<script lang="ts">
import { defineComponent } from 'vue';
import { mapGetters } from 'vuex';

import NativeLoginButton from 'pages/home/NativeLoginButton.vue';
import EVMLoginButtons from 'pages/home/EVMLoginButtons.vue';

export default defineComponent({
    name: 'HomePage',
    components: {
        EVMLoginButtons,
        NativeLoginButton,
    },
    data: (): {
        tab: 'left' | 'right'
    } => ({
        tab: 'left',
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

                <div class="c-home__button-container">


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

                    <EVMLoginButtons v-else-if="tab === 'left'" />
                </div>

                <q-footer bordered>
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
    background: linear-gradient(0.4turn, #071033, #6039A4);
    height: 100vh;

    &__page-container {
        // override inline style of unknown origin
        padding-bottom: 0 !important;
    }

    &__container {
        display: flex;
        flex-direction: column;
        padding: 32px 24px 0;
    }

    &__logo {
        width: 240px;
        margin: 0 auto 88px;

        @media only screen and (min-width: $breakpoint-md-min) {
            margin: 128px auto 88px;
        }
    }

    &__button-container {
        border-radius: 4px;
        padding: 24px;
        background-color: rgba(white, 0.1);
        max-width: 320px;
        margin: auto;
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
            color: $link-blue;
        }
    }
}
</style>
