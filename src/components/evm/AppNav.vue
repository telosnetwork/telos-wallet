<script lang="ts">
import { defineComponent } from 'vue';
import InlineSvg from 'vue-inline-svg';

import UserInfo from 'components/evm/UserInfo.vue';
import { getAntelope, useChainStore } from 'src/antelope';
import { useAppNavStore } from 'src/stores';

const ant = getAntelope();
const accountStore = ant.stores.account;
const chainStore = useChainStore();

const appnav = useAppNavStore();

export default defineComponent({
    name: 'AppNav',
    components: {
        UserInfo,
        InlineSvg,
    },
    data: () => ({
        menuIsOpen: false,
        showShadow: false,
    }),
    computed: {
        showMenuIcon() {
            return this.$q.screen.lt.md && !this.showBackButton;
        },
        showBackButton() {
            return appnav.showBackBtn;
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
            return process.env.CHAIN_NAME === 'telos';
        },
    },
    watch: {
        '$q.screen.lt.md'(newValue, oldValue) {
            if (newValue !== oldValue) {
                this.menuIsOpen = false;
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
        closeMenu() {
            this.menuIsOpen = false;
        },
        scrollHandler(info: { position: { top: number }}) {
            this.showShadow = info.position.top !== 0;
        },
        logout() {
            this.menuIsOpen = false;
            accountStore.logout();
        },
        goTo(routeName: string) {
            this.$router.push({ name: routeName });
            this.menuIsOpen = false;
            appnav.setShowBackBtn(false);
        },
        goBack() {
            this.$router.back();
            appnav.setShowBackBtn(false);
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
                src="~assets/logo--telos-wallet.svg"
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
                v-if="false"
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
            </li>

            <li
                v-if="false"
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
                @click="logout"
                @keypress.space.enter="logout"
                @keyup.tab.stop.prevent="() => {}"
                @keydown.tab.exact="cycleFocus($event, 'first')"
            >
                <InlineSvg
                    :src="require('src/assets/icon--logout.svg')"
                    class="c-app-nav__icon"
                    height="24"
                    width="24"
                    aria-hidden="true"
                />
                {{ $t('global.sign_out') }}
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
</template>

<style lang="scss">

.c-app-nav {
    color: white;
    $this: &;

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
        background: $site-gradient;
        z-index: $z-index--menu;

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
        background-color: var(--header-bg-color);
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
