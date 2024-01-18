
<script>
import { CURRENT_CONTEXT, useChainStore } from 'src/antelope';
import { defineComponent } from 'vue';
import { QSpinnerFacebook } from 'quasar';
import { mapGetters, mapActions, mapMutations } from 'vuex';
import { Menu } from '~/pages/home/MenuType';
import { googleCtrl } from 'src/pages/home/GoogleOneTap';


const telosLogo = require('src/assets/logo--telos-cloud-wallet.svg');

export default defineComponent({
    name: 'NativeLoginButton',
    components: {
        QSpinnerFacebook,
    },
    data() {
        return {
            showAuth: false,
            authType: 'signin',
            authInterval: null,
            close: false,
            ramPrice: 0,
            ramAvail: 0,
            cpuAvail: 0,
            netAvail: 0,
            ramThres: 0.9,
            netThres: 0.9,
            cpuThres: 0.9,
            ramMinimum: 5000, //5 kB
            netMinimum: 10000,
            cpuMinimum: 50000,
            ramLow: false,
            netLow: false,
            cpuLow: false,
            resourcePoll: false,
            RAMtoBuy: 0,
            CPUtoBuy: 0,
            NETtoBuy: 0,
            buyAmount: 1, // 1 TLOS
            resLow: false,
            googleSubscription: null,
            showGoogleLoading: false,
            googleCtrl: googleCtrl,
        };
    },
    props: {
        modelValue: {
            type: String,
            default: 'main',
        },
    },
    computed: {
        ...mapGetters('account', [
            'isAuthenticated',
            'accountName',
            'loading',
            'isAutoLoading',
        ]),
        // menu navitgaion
        showMainMenu() {
            return this.modelValue === Menu.MAIN;
        },
        showTelosCloudMenu() {
            return this.modelValue === Menu.CLOUD;
        },
    },
    mounted() {
        this.showGoogleLoading = false;
        this.setDefaultNativeChain();

        this.googleSubscription = googleCtrl.onSuccessfulLogin.subscribe({
            next: (data) => {
                if (this.googleSubscription) {
                    if (data) {
                        this.showGoogleLoading = true;
                        this.loginWithMetaKeep(data);
                    }
                }
            },
        });
    },
    unmounted() {
        this.googleSubscription.unsubscribe();
        this.googleSubscription = null;
    },
    methods: {
        // menu navitgaion
        setCloudMenu() {
            this.$emit('update:modelValue', Menu.CLOUD);
        },
        // antelope methods
        setDefaultNativeChain() {
            const network = process.env.CHAIN_NAME || 'telos';
            const chainStore = useChainStore();
            chainStore.setChain(CURRENT_CONTEXT, network);
        },
        // end of antelope methods
        ...mapActions('account', [
            'login',
            'logout',
            'autoLogin',
            'getUserProfile',
            'setEvmState',
        ]),
        ...mapMutations('account', [
            'setAccountName',
            'getAccountProfile',
            'setLoadingWallet',
        ]),
        async loginWithMetaKeep(credentials) {
            const idx = this.$ual.authenticators.map(a => a.getName()).indexOf('metakeep.ual');
            const auth = this.$ual.authenticators[idx];
            auth.setUserCredentials(credentials);
            this.onLogin(idx);
        },
        async loginAsJustViewer() {
            let idx = this.$ual.authenticators.map(a => a.getName()).indexOf('cleos');
            this.onLogin(idx, true);
        },
        async signUp() {
            this.openUrl('https://app.telos.net/accounts/add');
        },
        async onLogin(idx, justViewer = false) {
            const network = useChainStore().currentChain.settings.getNetwork();
            try {
                await this.login({ idx, justViewer, network });
                const account = localStorage.getItem('account');
                if (account) {
                    this.$router.push({ path: '/zero/balance' });
                }
            } catch (e) {
                if (e.message !== 'User canceled request (Modal closed)') {
                    this.$errorNotification(e);
                }
            }
        },
        openUrl(url) {
            window.open(url);
        },
        goToAccountPage() {
            const accountPath = `/account/${this.accountName}`;
            if (this.$router.currentRoute.path !== accountPath) {
                this.$router.push({ path: accountPath });
            }
        },
        async createEvmApi() {
            try {
                await this.setEvmState();
            } catch (e) {
                console.error(e);
            }
        },

        async buyResources() {
            if (this.ramLow) {
                this.RAMtoBuy = this.buyAmount;
            }
            if (this.cpuLow) {
                this.CPUtoBuy = this.buyAmount;
            }
            if (this.netLow) {
                this.NETtoBuy = this.buyAmount;
            }

            let actions = [];
            if (this.ramLow) {
                actions.push({
                    account: 'eosio',
                    name: 'buyram',
                    data: {
                        payer: this.accountName.toLowerCase(),
                        receiver: this.accountName.toLowerCase(),
                        quant:
                String(parseFloat(this.RAMtoBuy).toFixed(4)) + String(' TLOS'),
                    },
                });
            }

            if (this.cpuLow || this.netLow) {
                actions.push({
                    account: 'eosio',
                    name: 'delegatebw',
                    data: {
                        from: this.accountName.toLowerCase(),
                        receiver: this.accountName.toLowerCase(),
                        stake_net_quantity:
                String(parseFloat(this.NETtoBuy).toFixed(4)) + String(' TLOS'),
                        stake_cpu_quantity:
                String(parseFloat(this.CPUtoBuy).toFixed(4)) + String(' TLOS'),
                        transfer: false,
                    },
                });
            }

            try {
                const transaction = await this.$store.$api.signTransaction(
                    actions,
                    this.$t('resources.buying_resources'),
                );
                this.$successNotification(this.$t('resources.resources_bought'));
                if (transaction) {
                    this.ramLow = false;
                }
                if (transaction) {
                    this.cpuLow = false;
                }
                if (transaction) {
                    this.netLow = false;
                }
                if (transaction) {
                    this.resLow = false;
                }
                this.$emitter.emit('resources_bought');
            } catch (error) {
                this.$errorNotification(error);
            }
        },

        async getRamPrice() {
            const res = await this.$store.$api.getTableRows({
                code: 'eosio',
                scope: 'eosio',
                table: 'rammarket',
                limit: 1,
                show_payer: false,
            });
            let ramInfo = res.rows[0];
            this.ramPrice =
          ramInfo.quote.balance.split(' ')[0] /
          ramInfo.base.balance.split(' ')[0];
        },

        async checkResources() {
            if (!this.accountName) {
                return;
            }
            await this.getRamPrice();
            let account = await this.$store.$api.getAccount(this.accountName);
            this.ramAvail = account.ram_quota - account.ram_usage;
            this.cpuAvail = account.cpu_limit.available;
            this.netAvail = account.net_limit.available;
            if (account.ram_usage / account.ram_quota > this.ramThres || this.ramAvail < this.ramMinimum) {
                this.ramLow = true;
            }
            if (1 - this.netAvail / account.net_limit.max > this.netThres || this.netAvail < this.netMinimum) {
                this.netLow = true;
            }
            if (1 - this.cpuAvail / account.cpu_limit.max > this.cpuThres || this.cpuAvail < this.cpuMinimum) {
                this.cpuLow = true;
            }
            this.resLow = this.ramLow || this.cpuLow || this.netLow;
        },
        getWalletIcon(wallet) {
            return wallet.getStyle().icon;
        },
        getWalletName(wallet) {
            return wallet.getStyle().text;
        },
        isLoading(wallet) {
            return this.loading === wallet;
        },
    },
    watch: {
        async isAuthenticated() {
            if (this.isAuthenticated) {
                await this.createEvmApi();
                await this.checkResources();
            }
        },
        showTelosCloudMenu(newValue) {
            if (newValue) {
                googleCtrl.renderButton('google_btn');
            }
        },
    },
});
</script>

<template>
<div class="c-zero-login-buttons">

    <!-- main menu -->
    <template v-if="showMainMenu">

        <!-- Login Button -->
        <template v-if="!isAuthenticated">

            <!-- Telos Cloud Button -->
            <div class="c-zero-login-buttons__option c-zero-login-buttons__option--telos-cloud" @click="setCloudMenu()">
                <div class="c-zero-login-buttons__cloud-btn-container">
                    <div class="c-zero-login-buttons__cloud-btn-line-title">
                        <img
                            width="24"
                            class="c-zero-login-buttons__icon c-zero-login-buttons__icon--cloud"
                            src="~assets/icon--telos-cloud.svg"
                        >
                        <span>{{ $t('home.telos_cloud_wallet') }}</span>
                    </div>
                    <div class="c-zero-login-buttons__cloud-btn-line-icons">
                        <img
                            width="12"
                            class="c-zero-login-buttons__icon c-zero-login-buttons__icon--social"
                            src="~assets/icon--google.svg"
                        >
                        <img
                            width="12"
                            class="c-zero-login-buttons__icon c-zero-login-buttons__icon--social"
                            src="~assets/icon--facebook.svg"
                        >
                        <img
                            width="12"
                            class="c-zero-login-buttons__icon c-zero-login-buttons__icon--social"
                            src="~assets/icon--twitter.svg"
                        >
                    </div>
                </div>
            </div>

            <!-- Authenticator buttons -->
            <template
                v-for="(wallet, idx) in $ual.authenticators"
                :key="idx"
            >
                <div
                    v-if="wallet.getName() !== 'metakeep.ual'"
                    class="c-zero-login-buttons__option"
                    @click="onLogin(idx)"
                >
                    <template v-if="isLoading(wallet.getStyle().text)">
                        <div class="c-zero-login-buttons__loading"><QSpinnerFacebook /></div>
                    </template>
                    <template v-else>
                        <img
                            :src="getWalletIcon(wallet)"
                            width="24"
                            class="c-zero-login-buttons__ual-logo"
                        >
                        {{ getWalletName(wallet) }} {{  wallet.getName()  }}
                    </template>
                </div>
            </template>

            <hr class="c-zero-login-buttons__hr">

            <div
                class="c-zero-login-buttons__option c-zero-login-buttons__option--centered"
                tabindex="0"
                aria-role="button"
                @keyup.enter="loginAsJustViewer"
                @click="loginAsJustViewer"
            >
                {{ $t('home.view_any_account') }}
            </div>

            <div
                class="c-zero-login-buttons__option c-zero-login-buttons__option--centered"
                tabindex="0"
                aria-role="button"
                @keyup.enter="signUp"
                @click="signUp"
            >
                {{ $t('home.create_new_account') }}
            </div>

        </template>

        <!-- if authenticated -->
        <div v-else class="q-px-md flex justify-center column">
            <p class="q-mb-lg logged-in"> {{ $t( 'home.logged_as', {account: accountName}) }}</p>

            <q-btn
                text-color="white"
                outline
                :label="$t('home.view_wallet')"
                class="q-px-md q-py-sm q-mb-lg"
                @click="$router.push('/zero/balance')"
            />

            <q-btn
                text-color="white"
                outline
                :label="$t('home.logout')"
                class="q-px-md q-py-sm"
                @click="logout"
            />
        </div>
    </template>

    <!-- telos cloud menu -->
    <template v-if="showTelosCloudMenu">

        <div class="c-zero-login-buttons__title q-mb-md">{{ $t('home.login_with_social_media') }}</div>

        <div v-if="showGoogleLoading">
            <div class="c-zero-login-buttons__loading"><QSpinnerFacebook /></div>
        </div>
        <div
            v-else
            id="google_btn"
            :data-client_id="googleCtrl.clientId"
        >
            <div class="c-zero-login-buttons__loading"><QSpinnerFacebook /></div>
        </div>

    </template>
</div>
</template>

<style lang="scss">

.logged-in {
    color: white;
    font-size: 16px !important;
    margin-bottom: 2rem;
}

.c-zero-login-buttons {
    $self: &;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 14px;

    &__loading{
        width: 100%;
        text-align: center;
        color: $white;
    }

    &__header{
        display: inline-block;
        font-size: 16px;
        margin-bottom: 16px;
    }

    &__icon {
        margin-top: -1px;
        transition: all 0.3s;
        &--disabled {
            opacity: 0.5;
        }
    }

    &__cloud-btn-container {
        display: flex;
        width: 100%;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 8px;
    }

    &__cloud-btn-line-icons {
        display: flex;
        width: 100%;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        gap: 8px;
    }

    &__cloud-btn-line-title {
        display: flex;
        width: 100%;
        flex-direction: row;
        justify-content: flex-start;
        align-items: center;
        gap: 8px;
    }

    &__title {
        @include text--header-4;
        color: $white;
        text-align: center;
    }

    &__sub-title {
        color: $white;
    }

    &__ual-logo {
        opacity: 0.8;

        @include mobile-only {
            opacity: 1;
        }
    }

    &__option {
        display: flex;
        gap: 8px;

        width: 224px;
        height: 54px;
        color: $white;
        outline-color: $white;
        outline-width: 1px;
        outline-style: solid;
        border-radius: 4px;
        font-size: 16px;
        font-weight: 500;
        padding: 14px;
        cursor: pointer;

        &:hover:not(&--disabled),
        &:focus:not(&--disabled) {
            color: $white;
            outline-color: $white;
            outline-width: 2px;

            #{$self}__ual-logo {
                opacity: 1;
            }
        }

        &:not(:hover) #{$self}__icon {
            &--metamask, &--safepal, &--wallet-connect {
                opacity: 0.8;

                @include mobile-only {
                    opacity: 1;
                }
            }
        }

        &--telos-cloud {
            height: max-content;
            &:not(:hover) {
                outline-width: 0;
                @include gradient_border();
            }
        }

        &--disabled {
            color: #9289b1;
            outline-color: #9289b1;
            cursor: not-allowed;
        }
    }

    &__hr {
        width: 224px;
    }
}


</style>
