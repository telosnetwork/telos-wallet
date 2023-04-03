<script lang="ts">
import { defineComponent } from 'vue';
import InlineSvg from 'vue-inline-svg';

import UserInfo from 'components/evm/UserInfo.vue';
import { getAntelope } from 'src/antelope';

const accountStore = getAntelope().stores.account;

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
        menuItemTabIndex() {
            return this.menuIsOpen ? '0' : '-1';
        },
    },
    watch: {
        '$q.screen.lt.lg'(newValue, oldValue) {
            if (newValue !== oldValue) {
                this.menuIsOpen = false;
            }
        },
    },
    methods: {
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
            v-if="$q.screen.lt.lg"
            flat
            round
            dense
            icon="menu"
            color="black"
            aria-haspopup="menu"
            :aria-label="$t('open_menu')"
            :tabindex="menuIsOpen ? '-1' : '0'"
            @click="menuIsOpen = !menuIsOpen"
            @keydown.space.enter="menuIsOpen = !menuIsOpen"
        />

        <UserInfo />
    </div>

    <div
        :class="{
            'c-app-nav__menu-container': true,
            'c-app-nav__menu-container--open': menuIsOpen && $q.screen.lt.lg,
            'c-app-nav__menu-container--desktop': $q.screen.gt.md,
        }"
    >
        <div class="flex justify-between">
            <img
                src="~assets/logo--telos-wallet.svg"
                :alt="$t('home.wallet_logo_alt')"
                tabindex="0"
                role="link"
                :aria-label="$t('nav.go_home')"
                class="c-app-nav__logo"
                @click="goTo('home')"
                @keydown.space.enter="goTo('home')"
            >
            <q-btn
                v-if="$q.screen.lt.lg"
                flat
                round
                dense
                icon="menu_open"
                class="q-ma-md self-start"
                aria-haspopup="menu"
                :aria-label="$t('close_menu')"
                :tabindex="menuItemTabIndex"
                @click="menuIsOpen = !menuIsOpen"
                @keydown.space.enter="menuIsOpen = !menuIsOpen"
            />
        </div>

        <ul class="c-app-nav__menu-items">
            <li
                class="c-app-nav__menu-item"
                role="menuitem"
                :tabindex="menuItemTabIndex"
                @click="goTo('evm-wallet')"
                @keydown.space.enter="goTo('evm-wallet')"
            >
                <InlineSvg
                    :src="require('src/assets/icon--wallet.svg')"
                    class=""
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
                @click="goTo('evm-staking')"
                @keydown.space.enter="goTo('evm-staking')"
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
                class="c-app-nav__menu-item"
                role="menuitem"
                :tabindex="menuItemTabIndex"
                @click="goTo('evm-wrap')"
                @keydown.space.enter="goTo('evm-wrap')"
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
                class="c-app-nav__menu-item"
                role="menuitem"
                :tabindex="menuItemTabIndex"
                @click="logout"
                @keydown.space.enter="logout"
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
    </div>
</nav>
</template>

<style lang="scss">
.c-app-nav {
    color: white;
    $this: &;

    &__menu-container {
        position: fixed;
        top: 0;
        bottom: 0;
        height: 100vh;
        width: 100vw;
        transform: translateX(-100%);
        transition: 0.2s transform ease;
        background: $site-gradient;
        z-index: 999;

        &--open {
            transform: translateX(0);
        }

        &--desktop {
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
        z-index: 999;

        @media only screen and (min-width: $breakpoint-lg-min) {
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
        font-size: 16px;
        line-height: 20px;
        font-weight: 600;

        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 32px;
        width: max-content;

        &:hover {
            color: $link-blue;

            // svg color overrides
            #{$this}__icon:not(#{$this}__icon--acorn) path {
                fill: $link-blue;
            }

            #{$this}__icon--acorn path {
                stroke: $link-blue;
            }
        }
    }

    &__icon {
        // svg color overrides
        &--current-route:not(#{$this}__icon--acorn) path {
            fill: $link-blue;
        }

        &--current-route#{$this}__icon--acorn path {
            stroke: $link-blue;
        }
    }
}
</style>
