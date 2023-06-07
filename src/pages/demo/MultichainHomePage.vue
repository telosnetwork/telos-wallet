<script lang="ts">
import { defineComponent } from 'vue';

import UserInfo from 'components/evm/UserInfo.vue';
import NativeLoginButton from 'pages/home/NativeLoginButton.vue';
import EVMLoginButtons from 'pages/home/EVMLoginButtons.vue';
import ConnectWalletOptions from 'pages/home/ConnectWalletOptions.vue';
import { getAntelope } from 'src/antelope';
import { AccountModel } from 'src/antelope/stores/account';

export default defineComponent({
    name: 'MultichainHomePage',
    components: {
        EVMLoginButtons,
        NativeLoginButton,
        ConnectWalletOptions,
        UserInfo,
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

    mounted() {
        getAntelope().events.onLoggedIn.subscribe((account) => {
            this.$router.push({ name: 'evm-wallet' });
        });

        getAntelope().events.onLoggedOut.subscribe((account) => {
            console.log('logged out ------------------> ');
            this.$router.push({ name: 'demos.multichain' });
        });
    },

    computed: {
        isAuthenticated(): boolean {
            return getAntelope().stores.account.isAuthenticated;
        },
        account(): AccountModel {
            return getAntelope().stores.account.loggedAccount;
        },
        network(): string {
            return 'binance';
        },
    },

    methods: {
        logout() {
            getAntelope().stores.account.logout();
        },
    },
});
</script>

<template>
<AppPage>
    <div class="c-multichain-home">
        <div class="c-multichain-home__container">
            <img
                src="~assets/logo--telos-wallet.svg"
                :alt="$t('home.wallet_logo_alt')"
                class="c-multichain-home__logo"
            >
            <div v-if="!showWalletOptions && !isAuthenticated" class="c-multichain-home__button-container">
                <div class="c-multichain-home__network-toggle-container" role="tablist">
                    <button
                        :class="{
                            'c-multichain-home__network-toggle-button': true,
                            'c-multichain-home__network-toggle-button--activated': tab === 'left',
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
                            'c-multichain-home__network-toggle-button': true,
                            'c-multichain-home__network-toggle-button--activated': tab === 'right',
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
                    :network="network"
                    @toggle-wallet-connect="toggleWalletConnect = true"
                    @show-wallet-options="showWalletOptions = true"
                />
            </div>
            <div v-if="isAuthenticated" class="c-multichain-home__account-container">
                <UserInfo
                    class="c-multichain-home__account-info"
                    :account="account"
                />
                <q-btn
                    class="c-multichain-home__logout-button"
                    color="primary"
                    :label="$t('global.sign_out')"
                    @click="logout"
                />
            </div>
            <div class="c-multichain-home__connect-wallet">
                <ConnectWalletOptions
                    v-show="showWalletOptions"
                    :toggleWalletConnect="toggleWalletConnect"
                    @toggle-wallet-connect="toggleWalletConnect = false"
                    @close-wallet-options="showWalletOptions = false"
                />
            </div>
        </div>

    </div>
</AppPage>

</template>

<style lang="scss">
.c-multichain-home {
    position: relative;
    background: $site-gradient;
    min-height: 700px;
    height: 30vh;

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

        @include sm-and-up {
            margin: 128px auto 88px;
        }

        @include mobile-landscape {
            margin: 60px auto 88px;
        }

    }

    &__button-container, &__account-container {
        border-radius: 4px;
        padding: 24px;
        background-color: rgba(white, 0.1);
        max-width: 320px;
        margin: auto;
        text-align-last: center;
        @include mobile-landscape {
            // footer height + margin
            margin: auto auto 90px;
        }
    }

    &__account-info {
        background-color: white;
        border-radius: 6px;
        padding: 10px;
    }

    &__logout-button {
        margin-top: 16px;
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

    // guarantees wallet connect on top of footer
    &__footer {
        z-index: $z-index--footer;
    }
    &__connect-wallet {
        z-index: $z-index--connect-wallet-popup;
    }
}
</style>
