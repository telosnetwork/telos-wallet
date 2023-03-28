<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    name: 'AppNav',
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
});
</script>

<template>
<q-header>
    <q-toolbar class="bg-grey-2">
        <q-btn
            v-if="$q.screen.lt.lg"
            flat
            round
            dense
            icon="menu"
            class="q-mr-sm"
            color="black"
            @click="menuIsOpen = !menuIsOpen"
        />
    </q-toolbar>

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
    </div>
</q-header>
</template>

<style lang="scss">
.c-app-nav {
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

    &__logo {
        height: 56px;
        margin-top: 24px;
        margin-left: 12px;
    }
}
</style>
