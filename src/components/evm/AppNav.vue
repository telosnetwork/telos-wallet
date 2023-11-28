<script lang="ts">
import { defineComponent } from 'vue';
import InlineSvg from 'vue-inline-svg';

import UserInfo from 'components/evm/UserInfo.vue';
import { getAntelope, useChainStore } from 'src/antelope';
import EVMLoginButtons from 'pages/home/EVMLoginButtons.vue';
import { getShortenedHash } from 'src/antelope/stores/utils';

const ant = getAntelope();
const accountStore = ant.stores.account;
const chainStore = useChainStore();

export default defineComponent({
    name: 'AppNav',
    components: {
        EVMLoginButtons,
        UserInfo,
        InlineSvg,
    },
    data: () => ({
        menuIsOpen: false,
        showShadow: false,
        showWalletOptions: false,
        notifyOnSuccessfulLogin: false,
    }),
    computed: {
        isLoadingApy() {
            return this.prettyPrintApy === '';
        },
        prettyPrintApy() {
            const apy = chainStore.currentEvmChain?.apy;
            if (apy) {
                return apy + '%';
            } else {
                return '';
            }
        },
        showMenuIcon() {
            return this.$q.screen.lt.md && !this.showBackButton;
        },
        showBackButton() {
            return !!this.$route.meta.parent;
        },
        showUserInfo() {
            return !this.showBackButton && this.loggedAccount;
        },
        loggedAccount() {
            return accountStore.loggedAccount;
        },
        menuItemTabIndex() {
            if (this.$q.screen.lt.md && !this.menuIsOpen) {
                return '-1';
            }

            return '0';
        },
        isProduction() {
            // only enable demo route for staging & development
            return window.location.origin.includes('telos.net');
        },
        accountActionText() {
            if (this.loggedAccount) {
                return this.$t('nav.logout');
            } else {
                return this.$t('nav.login');
            }
        },
    },
    watch: {
        '$q.screen.lt.md'(newValue, oldValue) {
            if (newValue !== oldValue) {
                this.menuIsOpen = false;
            }
        },
        loggedAccount(newVal) {
            if (!!newVal) {
                this.showWalletOptions = false;

                if (this.notifyOnSuccessfulLogin) {
                    this.notifyOnSuccessfulLogin = false;
                    const shortenedAddress = getShortenedHash(this.loggedAccount.account);

                    (this as any).$notifySuccessMessage(
                        this.$t('home.logged_as', { account: shortenedAddress }),
                    );
                }
            }
        },
    },
    methods: {
        openMenu() {
            this.menuIsOpen = true;

            this.$nextTick(() => {
                (this.$refs['logo-image'] as HTMLElement)?.focus();
            });
        },
        closeLoginMenu() {
            this.showWalletOptions = false;
        },
        closeMenu() {
            this.menuIsOpen = false;
        },
        scrollHandler(info: { position: { top: number }}) {
            this.showShadow = info.position.top !== 0;
        },
        handleUserAuthAction() {
            this.menuIsOpen = false;

            if (accountStore.loggedAccount) {
                accountStore.logout();
            } else {
                this.showWalletOptions = true;
                this.notifyOnSuccessfulLogin = true;
            }
        },
        goTo(routeName: string) {
            this.$router.push({ name: routeName });
            this.menuIsOpen = false;
        },
        goBack() {
            // if the user has navigated from within the app, pressing back should preserve query params, thus we should go back in history
            // if the user has come from an external source, pressing back should go to the parent route
            const navigatedFromApp = sessionStorage.getItem('navigatedFromApp');

            if (navigatedFromApp) {
                this.$router.go(-1);
            } else {
                const parent = this.$route.meta.parent as string;

                this.$router.push({ name: parent });
            }
        },
        cycleFocus(event: Event, toFocus: 'first' | 'last') {
            if (this.$q.screen.lt.md) {
                event.preventDefault();

                if (toFocus === 'first') {
                    (this.$refs['logo-image'] as HTMLElement)?.focus();
                } else {
                    (this.$refs['last-link'] as HTMLElement)?.focus();
                }
            }
        },
        gotoEcosystem() {
            const network = this.loggedAccount.network;
            window.open(chainStore.getEcosystemUrl(network), '_blank');
        },
    },
});
</script>

<template>
<nav
    class="c-app-nav"
    role="menu"
    aria-label="Nav menu container"
    aria-orientation="vertical"
>
    <q-scroll-observer debounce="100" @scroll="scrollHandler" />

    <div
        :class="{
            'c-app-nav__toolbar': true,
            'shadow-3': showShadow,
        }"
    >
        <q-btn
            v-if="showMenuIcon"
            flat
            round
            dense
            icon="menu"
            color="black"
            aria-haspopup="menu"
            :aria-label="$t('nav.open_menu')"
            :tabindex="menuIsOpen ? '-1' : '0'"
            @click="openMenu"
            @keypress.space.enter="openMenu"
        />

        <q-btn
            v-if="showBackButton"
            class="c-app-nav__back-button"
            flat
            dense
            label="Back"
            icon="arrow_back_ios"
            @click="goBack"
        />

        <q-space />

        <UserInfo
            v-if="showUserInfo"
            :account="loggedAccount"
        />
    </div>

    <div
        :class="{
            'c-app-nav__menu-container': true,
            'c-app-nav__menu-container--open': menuIsOpen && $q.screen.lt.md,
        }"
    >
        <div class="flex justify-between">
            <img
                ref="logo-image"
                src="/branding/telos-wallet.svg"
                :alt="$t('home.wallet_logo_alt')"
                tabindex="0"
                role="link"
                :aria-label="$t('nav.go_home')"
                class="c-app-nav__logo"
                @click="goTo('home')"
                @keypress.space.enter="goTo('home')"
                @keydown.shift.tab="cycleFocus($event, 'last')"
            >
            <q-btn
                v-if="$q.screen.lt.md"
                flat
                round
                dense
                icon="menu_open"
                class="self-start q-ma-md"
                aria-haspopup="menu"
                :aria-label="$t('nav.close_menu')"
                :tabindex="menuItemTabIndex"
                @click="closeMenu"
                @keypress.space.enter="closeMenu"
            />
        </div>

        <ul class="c-app-nav__menu-items">
            <li
                class="c-app-nav__menu-item"
                role="menuitem"
                :tabindex="menuItemTabIndex"
                @click="goTo('evm-wallet')"
                @keypress.space.enter="goTo('evm-wallet')"
            >
                <InlineSvg
                    :src="require('src/assets/icon--wallet.svg')"
                    :class="{
                        'c-app-nav__icon': true,
                        'c-app-nav__icon--current-route': $route.name === 'evm-wallet',
                    }"
                    height="24"
                    width="24"
                    aria-hidden="true"
                />
                {{ $t('nav.wallet') }}
            </li>
            <li
                class="c-app-nav__menu-item"
                role="menuitem"
                :tabindex="menuItemTabIndex"
                @click="goTo('evm-nft-inventory')"
                @keypress.space.enter="goTo('evm-nft-inventory')"
            >
                <InlineSvg
                    :src="require('src/assets/icon--nft.svg')"
                    :class="{
                        'c-app-nav__icon': true,
                        'c-app-nav__icon--current-route': $route.name === 'evm-nft-inventory',
                    }"
                    height="24"
                    width="24"
                    aria-hidden="true"
                />
                {{ $t('nav.nfts') }}
            </li>

            <li
                class="c-app-nav__menu-item"
                role="menuitem"
                :tabindex="menuItemTabIndex"
                @click="goTo('evm-staking')"
                @keypress.space.enter="goTo('evm-staking')"
            >
                <InlineSvg
                    :src="require('src/assets/icon--acorn.svg')"
                    :class="{
                        'c-app-nav__icon': true,
                        'c-app-nav__icon--acorn': true,
                        'c-app-nav__icon--current-route': $route.name === 'evm-staking',
                    }"
                    height="24"
                    width="24"
                    aria-hidden="true"
                />
                {{ $t('nav.staking') }}
                <span class="c-app-nav__apy-box">  {{ $t('evm_stake.apy_card_label') }}
                    <q-spinner
                        v-if="isLoadingApy"
                        color="white"
                        class="c-app-nav__apy-spinner"
                    />
                    <b> {{ prettyPrintApy }}</b>
                </span>
            </li>

            <li
                class="c-app-nav__menu-item"
                role="menuitem"
                :tabindex="menuItemTabIndex"
                @click="goTo('evm-wrap')"
                @keypress.space.enter="goTo('evm-wrap')"
            >
                <InlineSvg
                    :src="require('src/assets/icon--wrap-tlos.svg')"
                    :class="{
                        'c-app-nav__icon': true,
                        'c-app-nav__icon--current-route': $route.name === 'evm-wrap',
                    }"
                    height="24"
                    width="24"
                    aria-hidden="true"
                />
                {{ $t('nav.wrap_tlos') }}
            </li>

            <li
                ref="last-link"
                class="c-app-nav__menu-item"
                role="menuitem"
                :tabindex="menuItemTabIndex"
                @click="handleUserAuthAction"
                @keypress.space.enter="handleUserAuthAction"
                @keyup.tab.stop.prevent="() => {}"
                @keydown.tab.exact="cycleFocus($event, 'first')"
            >
                <InlineSvg
                    :src="require(`src/assets/icon--log${loggedAccount ? 'out' : 'in'}.svg`)"
                    class="c-app-nav__icon"
                    height="24"
                    width="24"
                    aria-hidden="true"
                />
                {{ accountActionText }}
            </li>
        </ul>

        <ul class="c-app-nav__menu-links">
            <li
                class="c-app-nav__menu-link"
                role="menuitem"
                :tabindex="menuItemTabIndex"
                @click="gotoEcosystem()"
                @keypress.space.enter="gotoEcosystem()"
            >
                {{ $t('nav.ecosystem') }}
                <q-icon size="16px" name="launch" />
            </li>
        </ul>

        <div v-if="!isProduction" class="c-app-nav__demos-link">
            <router-link :to="{ name: 'demos' }" class="text-white">
                Component Demos
            </router-link>
        </div>
    </div>
</nav>
<q-dialog v-model="showWalletOptions">
    <div class="c-app-nav__login-bg">
        <div class="c-app-nav__login-header">
            <span class="c-app-nav__login-header-text">
                {{ $t('home.sign_in_with') }}
            </span>
            <q-btn
                class="c-app-nav__login-close"
                icon="close"
                flat
                round
                dense
                @click="closeLoginMenu()"
            />
        </div>
        <EVMLoginButtons/>
    </div>
</q-dialog>

</template>

<style lang="scss">

.c-app-nav {
    color: $white;
    $this: &;

    &__login-bg {
        background: $dark;
        padding: 24px;
    }

    &__login-header {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
    }

    &__login-close {
        color: $white;
        padding: 0;
        min-height: 2.4em;
        min-width: 2.4em;
        margin-top: -8px;
        margin-right: -10px;
    }

    &__login-header-text {
        @include text--header-5;
        color: $white;
    }

    &__back-button {
        @include text--header-5;
        height: 32px;
        color: var(--text-default-contrast);
        i {
            font-size: 1.15em;
        }
    }

    &__menu-container {
        position: fixed;
        top: 0;
        bottom: 0;
        height: 100vh;
        width: 100vw;
        transform: translateX(-100%);
        transition: 0.2s transform ease;
        z-index: $z-index--menu;
        padding-bottom: 0 !important;
        background: url("/branding/background.png");
        // background-position: right; // blue/green to light
        // background-position: left;
        background-repeat: no-repeat;
        background-size: cover;

        &--open {
            transform: translateX(0);
        }

        @include md-and-up {
            left: 0;
            width: 300px;
            transform: unset;
        }
    }

    &__toolbar {
        position: fixed;
        top: 0;
        right: 0;
        left: 0;
        display: flex;
        justify-content: space-between;
        color: var(--header-text-color);
        padding: 16px 24px;
        background-color: var(--accent-color-5);
        z-index: $z-index--header-toolbar;

        @include md-and-up {
            left: 300px;
            justify-content: flex-end;
        }
    }

    &__logo {
        height: 56px;
        margin-top: 24px;
        margin-left: 32px;
        cursor: pointer;
    }

    &__menu-items {
        margin-top: 80px;
        list-style: none;
    }

    &__menu-item {
        @include text--paragraph-bold;

        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 32px;
        width: max-content;

        &:hover {
            color: var(--link-color);

            // svg color overrides
            #{$this}__icon:not(#{$this}__icon--acorn) path {
                fill: var(--link-color);
            }

            #{$this}__icon--acorn path {
                stroke: var(--link-color);
            }
        }
    }

    &__apy-box {
        @include text--small;
        background-color: rgba(255, 255, 255, 0.1);
        color: var(--bg-color);
        padding: 4px 8px;
        border-radius: 4px;
        display: inline-block;
    }

    &__apy-spinner {
        size: 16px;
        margin-top: -5px;
    }

    &__icon {
        // svg color overrides
        &--current-route:not(#{$this}__icon--acorn) path {
            fill: var(--link-color);
        }

        &--current-route#{$this}__icon--acorn path {
            stroke: var(--link-color);
        }
    }

    &__menu-links {
        margin-top: 80px;
        list-style: none;
    }

    &__menu-link {
        @include text--small-bold;

        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;

        text-transform: uppercase;
        margin-bottom: 16px;
        width: max-content;

        &:hover {
            text-decoration: underline;
        }
    }

    &__demos-link {
        position: absolute;
        bottom: 24px;
        left: 48px;
    }
}
</style>
