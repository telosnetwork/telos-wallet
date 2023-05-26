<script lang="ts">
import { defineComponent } from 'vue';
import { useAccountStore, getAntelope, useChainStore } from 'src/antelope';
import InlineSvg from 'vue-inline-svg';

const accountStore = useAccountStore();
const chainStore = useChainStore();
const ant = getAntelope();

export default defineComponent({
    name: 'UserInfo',
    props: {
        account: {
            // AccountModel
            type: Object,
            required: true,
        },
        displayFullAddress: {
            type: Boolean,
            default: false,
        },
        showAddress: {
            type: Boolean,
            default: true,
        },
        showCopyBtn: {
            type: Boolean,
            default: true,
        },
        showUserMenu: {
            type: Boolean,
            default: true,
        },
    },
    components: {
        InlineSvg,
    },
    methods: {
        copyAddress() {
            if (!this.account.isNative && accountStore.isAuthenticated) {
                const address = this.account.address;
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
            const network =  this.account.network;
            const explorerUrl =  chainStore.getExplorerUrl(network);
            if (explorerUrl) {
                window.open(explorerUrl + '/address/' + this.account?.account, '_blank');
                return;
            } else {
                ant.config.notifyErrorHandler(this.$t('settings.no_explorer', { network: this.account.network }));
            }
        },
        gotoEcosystem() {
            const network =  this.account.network;
            window.open(chainStore.getEcosystemUrl(network), '_blank');
        },
    },
    computed: {
        address() {
            if (this.displayFullAddress) {
                return this.account?.address;
            } else {
                return this.account?.displayAddress;
            }
        },
    },
});
</script>

<template>
<div class="c-user-info">
    <div
        v-if="showAddress"
        class="o-text--header-4 u-text--default-contrast"
    >{{ address }}</div>
    <q-btn
        v-if="showCopyBtn"
        flat
        dense
        icon="content_copy"
        color="primary"
        class="q-mr-sm c-user-info__copy-btn"
        :aria-label="$t('nav.copy_address')"
        @click="copyAddress"
    />
    <q-btn
        v-if="showUserMenu"
        flat
        dense
        icon="more_vert"
        class="c-user-info__menu-btn"
        :aria-label="$t('nav.overflow_menu')"
    >
        <q-menu anchor="bottom end" self="top right" :offset="[0, 16]">
            <ul class="c-user-info__menu-items" role="menu">
                <li
                    class="c-user-info__menu-item"
                    role="menuitem"
                    tabindex="0"
                    @click="gotoTeloscan()"
                    @keypress.space.enter="gotoTeloscan()"
                >
                    <div class="c-user-info__icon-wrapper"><InlineSvg
                        :src="require('src/assets/icon--acorn.svg')"
                        class="c-user-info__icon c-user-info__icon--acorn"
                        height="24"
                        width="24"
                        aria-hidden="true"
                    /></div>
                    <h5>{{ $t('nav.teloscan') }}</h5>
                    <q-icon size="xs" name="launch" class="c-user-info__menu-item-min-icon" />
                </li>

                <li
                    class="c-user-info__menu-item"
                    role="menuitem"
                    tabindex="0"
                    @click="gotoEcosystem()"
                    @keypress.space.enter="gotoEcosystem()"
                >
                    <div class="c-user-info__icon-wrapper">
                        <q-icon name="dashboard" size="sm" />
                    </div>
                    <h5 class="q-mt-xs">{{ $t('nav.ecosystem') }}</h5>
                    <q-icon size="xs" name="launch" class="c-user-info__menu-item-min-icon" />
                </li>

                <li
                    class="c-user-info__menu-item"
                    role="menuitem"
                    tabindex="1"
                    @click="logout"
                    @keypress.space.enter="logout"
                >
                    <div class="c-user-info__icon-wrapper"><InlineSvg
                        :src="require('src/assets/icon--logout.svg')"
                        class="c-user-info__icon"
                        height="24"
                        width="24"
                        aria-hidden="true"
                    /></div>
                    <h5>{{ $t('global.sign_out') }}</h5>
                </li>
            </ul>
        </q-menu>
    </q-btn>
</div>
</template>

<style lang="scss">


.c-user-info {
    $this: &;
    display: flex;
    align-items: center;
    gap: 8px;
    &__menu-btn {
        color: var(--text-default-contrast);
    }

    &__menu-items {
        @include text--header-5;

        padding: 0px 0px;
        margin: 0px 0px;
        list-style: none;
        display: flex;
        flex-direction: column;
    }

    &__menu-item {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: left;
        gap: 8px;
        padding: 10px 18px;
        cursor: pointer;
        color: var(--text-default-contrast);
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

    &__menu-item-min-icon {
        margin-left: auto;
        transform: scale(0.67);
    }

    &__icon {
        height: 24px;
        width: 24px;
        &:not(#{$this}__icon--acorn) path {
            fill: var(--text-default-contrast);
        }

        &#{$this}__icon--acorn path {
            stroke: var(--text-default-contrast);
        }
    }

    &__icon-wrapper {
        display: inline-block;
        height: 24px;
        width: 24px;
    }

}
</style>

