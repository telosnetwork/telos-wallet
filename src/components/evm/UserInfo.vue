<script lang="ts">
import { defineComponent } from 'vue';
import { useAccountStore, getAntelope } from 'src/antelope';
import InlineSvg from 'vue-inline-svg';

const accountStore = useAccountStore();
const ant = getAntelope();

export default defineComponent({
    name: 'UserInfo',
    components: {
        InlineSvg,
    },
    methods: {
        copyAddress() {
            if (!accountStore.loggedAccount.isNative && accountStore.isAuthenticated) {
                const address = accountStore.loggedEvmAccount.account;
                navigator.clipboard.writeText(address);
                ant.config.notifySuccessHandler(this.$t('settings.copied_ok'));
            }
        },
        logout() {
            accountStore.logout();
        },
        toggleDarkMode() {
            this.$q.dark.toggle();
        },
        gotoTeloscan() {
            const explorerUrl = ant.stores.chain.loggedEvmChain?.settings.getExplorerUrl();
            if (explorerUrl) {
                window.open(explorerUrl + '/address/' + accountStore.loggedEvmAccount.account, '_blank');
                return;
            } else {
                ant.config.notifyErrorHandler(this.$t('settings.no_explorer', { network: accountStore.loggedAccount.network }));
            }
        },
    },
    computed: {
        address() {
            if (accountStore.isAuthenticated) {
                return accountStore.loggedEvmAccount.displayAddress;
            }
            return '';
        },
        isDarkMode() {
            return this.$q.dark.isActive;
        },
    },
});
</script>

<template>
<div class="c-user-info">
    <div class="c-user-info__address">{{ address }}</div>
    <q-btn
        flat
        dense
        icon="content_copy"
        color="purple"
        class="q-mr-sm c-user-info__copy-btn"
        :aria-label="$t('nav.copy_address')"
        @click="copyAddress"
    />
    <q-btn-dropdown
        flat
        dense
        no-icon-animation
        dropdown-icon="more_vert"
        class="c-user-info__dropdown"
        :aria-label="$t('nav.overflow_menu')"
    >
        <ul class="c-user-info__dropdown-items" role="menu">
            <li
                class="c-user-info__dropdown-item"
                role="menuitem"
                tabindex="0"
                @click="gotoTeloscan()"
                @keydown.space.enter="$router.push({ name: 'evm-staking' })"
            >
                <InlineSvg
                    :src="require('src/assets/icon--acorn.svg')"
                    :class="{
                        'c-user-info__icon': true,
                        'c-user-info__icon--acorn': true,
                    }"
                    height="24"
                    width="24"
                    aria-hidden="true"
                />
                <span class="c-user-info__dropdown-item-text">{{ $t('nav.teloscan') }}</span>
                <q-icon size="xs" name="launch" class="c-user-info__dropdown-item-min-icon" />
            </li>

            <li
                class="c-user-info__dropdown-item"
                role="menuitem"
                tabindex="1"
                @click="logout"
                @keydown.space.enter="logout"
            >
                <InlineSvg
                    :src="require('src/assets/icon--logout.svg')"
                    class="c-user-info__icon"
                    height="24"
                    width="24"
                    aria-hidden="true"
                />
                <span class="c-user-info__dropdown-item-text">{{ $t('global.sign_out') }}</span>
            </li>

            <li
                class="c-user-info__dropdown-item"
                role="menuitem"
                tabindex="2"
                @click="toggleDarkMode"
            >
                <span class="c-user-info__dropdown-item-text">{{ isDarkMode ? $t('global.light_mode') : $t('global.dark_mode') }}</span>
            </li>

        </ul>
    </q-btn-dropdown>
</div>
</template>

<style lang="scss">
.c-user-info {
    $this: &;
    display: flex;
    align-items: center;

    &__address {
        font-weight: 500;

        font-size: 20px;
        line-height: 24px;
        margin-right: 16px;

        @media only screen and (min-width: $breakpoint-lg-min) {
            font-weight: 600;
        }
    }

    &__dropdown-items {
        padding: 5px 0px;
        margin: 3px 0px;
        list-style: none;
        text-transform: uppercase;
        font-weight: bold;
        display: flex;
        flex-direction: column;
    }

    &__dropdown-item {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: left;
        padding: 10px 18px;
        cursor: pointer;
        color: var(--text-color);
        transition: background-color 0.1s ease-in-out;
        transition-property: background-color, color;

        &:hover {
            background-color: var(--bg-color-hover);
            color: var(--text-color-hover);

            #{$this}__icon {
                &:not(#{$this}__icon--acorn) path {
                    fill: var(--text-color-hover);
                }

                &#{$this}__icon--acorn path {
                    stroke: var(--text-color-hover);
                }
            }
        }
    }

    &__dropdown-item-text {
        margin-left: 8px;
        font-size: 15px;
        font-weight: 600;
    }

    &__icon {
        &:not(#{$this}__icon--acorn) path {
            fill: var(--text-color);
        }

        &#{$this}__icon--acorn path {
            stroke: var(--text-color);
        }
    }

    &__dropdown-item-min-icon {
        margin-left: auto;
        transform: scale(0.67);
        margin-left: 5px;
    }
}
</style>

