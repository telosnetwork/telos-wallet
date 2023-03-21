<script lang="ts">
import { mapGetters } from 'vuex';

import NativeLoginButton from 'src/pages/components/home/NativeLoginButton.vue';
import EVMLoginButtons from 'src/pages/components/home/EVMLoginButtons.vue';

export default {
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
};
</script>

<template>
<q-page class="c-home">
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
            <q-toolbar class="bg-dark">
                <div class="fit column wrap justify-center items-center content-center">
                    <div>
                        <a
                            href="https://www.telos.net/terms-of-service"
                            target="_blank"
                            class="text-white"
                        >
                            {{$t('home.terms')}}
                        </a>
                    </div>
                    <div>
                        <a
                            href="https://www.telos.net/privacy-policy"
                            target="_blank"
                            class="text-white"
                        >
                            {{$t('home.privacy')}}
                        </a>
                    </div>
                </div>
            </q-toolbar>
        </q-footer>
    </div>

</q-page>
</template>

<style lang="scss">
.c-home {
    position: relative;
    background: linear-gradient(0.4turn, #071033, #6039A4);

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
