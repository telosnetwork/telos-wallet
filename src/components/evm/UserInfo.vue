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
    },
    computed: {
        address() {
            if (this.displayFullAddress) {
                return this.account?.address;
            } else {
                return this.account?.displayAddress;
            }
        },
        isDarkMode() {
            return this.$q.dark.isActive;
        },
    },
});
</script>

<template>
<div class="c-user-info">
    <div v-if="showAddress" class="c-user-info__address">{{ address }}</div>
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
        class="q-mr-sm c-user-info__menu-btn"
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
                    <div class="c-user-info__icon-wraper"><InlineSvg
                        :src="require('src/assets/icon--acorn.svg')"
                        :class="{
                            'c-user-info__icon': true,
                            'c-user-info__icon--acorn': true,
                        }"
                        height="24"
                        width="24"
                        aria-hidden="true"
                    /></div>
                    <span class="c-user-info__menu-item-text">{{ $t('nav.teloscan') }}</span>
                    <q-icon size="xs" name="launch" class="c-user-info__menu-item-min-icon" />
                </li>

                <li
                    class="c-user-info__menu-item"
                    role="menuitem"
                    tabindex="1"
                    @click="logout"
                    @keypress.space.enter="logout"
                >
                    <div class="c-user-info__icon-wraper"><InlineSvg
                        :src="require('src/assets/icon--logout.svg')"
                        class="c-user-info__icon"
                        height="24"
                        width="24"
                        aria-hidden="true"
                    /></div>
                    <span class="c-user-info__menu-item-text">{{ $t('global.sign_out') }}</span>
                </li>

                <!--li
                    class="c-user-info__menu-item"
                    role="menuitem"
                    tabindex="2"
                    @click="toggleDarkMode"
                >
                    <div class="c-user-info__icon-wraper"></div>
                    <span class="c-user-info__menu-item-text">{{ isDarkMode ? $t('global.light_mode') : $t('global.dark_mode') }}</span>
                </li-->

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

    &__address {
        font-weight: bold;

        font-size: 20px;
        line-height: 24px;
        margin-right: 16px;

        @media only screen and (min-width: $breakpoint-lg-min) {
            font-weight: 600;
        }
    }

    &__menu-items {
        padding: 0px 0px;
        margin: 0px 0px;
        list-style: none;
        text-transform: uppercase;
        font-weight: bold;
        display: flex;
        flex-direction: column;
    }

    &__menu-item {
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

    &__menu-item-text {
        margin-left: 8px;
        font-size: 15px;
        font-weight: 600;
    }

    &__menu-item-min-icon {
        margin-left: auto;
        transform: scale(0.67);
        margin-left: 5px;
    }

    &__icon {
        height: 24px;
        width: 24px;
        &:not(#{$this}__icon--acorn) path {
            fill: var(--text-color);
        }

        &#{$this}__icon--acorn path {
            stroke: var(--text-color);
        }
    }

    &__icon-wraper {
        display: inline-block;
        height: 24px;
        width: 24px;
    }

}
</style>

