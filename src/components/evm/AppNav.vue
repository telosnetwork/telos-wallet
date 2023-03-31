<script lang="ts">
import { defineComponent } from 'vue';
import InlineSvg from 'vue-inline-svg';

import UserInfo from 'components/evm/UserInfo.vue';

export default defineComponent({
    name: 'AppNav',
    components: {
        UserInfo,
        InlineSvg,
    },
    data: () => ({
        menuIsOpen: false,
    }),
    watch: {
        '$q.screen.lt.lg'(newValue, oldValue) {
            if (newValue !== oldValue) {
                this.menuIsOpen = false;
            }
        },
    },
    methods: {
        logout() {
            console.log('logged out');
        },
    },
});
</script>

<template>
<nav class="c-app-nav">
    <div class="c-app-nav__toolbar">
        <q-btn
            v-if="$q.screen.lt.lg"
            flat
            round
            dense
            icon="menu"
            color="black"
            @click="menuIsOpen = !menuIsOpen"
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
                @click="$router.push({ name: 'home' })"
            >
            <q-btn
                v-if="$q.screen.lt.lg"
                flat
                round
                dense
                icon="menu_open"
                class="q-ma-md self-start"
                @click="menuIsOpen = !menuIsOpen"
            />
        </div>

        <ul class="c-app-nav__menu-items" role="menu">
            <li
                class="c-app-nav__menu-item"
                role="menuitem"
                tabindex="0"
                @click="$router.push({ name: 'evm-wallet' })"
                @keydown.space.enter="$router.push({ name: 'evm-wallet' })"
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
                tabindex="0"
                @click="$router.push({ name: 'evm-staking' })"
                @keydown.space.enter="$router.push({ name: 'evm-staking' })"
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
                tabindex="0"
                @click="$router.push({ name: 'evm-wrap' })"
                @keydown.space.enter="$router.push({ name: 'evm-wrap' })"
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
                tabindex="0"
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
        display: flex;
        justify-content: space-between;
        color: black;
        padding: 16px 24px;
        background-color: $page-header;

        @media only screen and (min-width: $breakpoint-lg-min) {
            justify-content: flex-end;
        }
    }

    &__logo {
        height: 56px;
        margin-top: 24px;
        margin-left: 12px;
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
