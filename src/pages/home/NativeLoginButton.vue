
<script>
import { CURRENT_CONTEXT, useChainStore } from 'src/antelope';
import { defineComponent } from 'vue';
import { mapGetters, mapActions, mapMutations } from 'vuex';
import { OreIdAuthenticator } from 'ual-oreid';
import { QSpinnerFacebook } from 'quasar';


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
        };
    },
    computed: {
        ...mapGetters('account', [
            'isAuthenticated',
            'accountName',
            'loading',
            'isAutoLoading',
        ]),
    },
    mounted() {
        this.setDefaultNativeChain();
    },
    methods: {
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
        async loginAsJustViewer() {
            let idx = this.$ual.authenticators.map(a => a.getName()).indexOf('cleos');
            this.onLogin(idx, true);
        },
        async signUp() {
            this.openUrl('https://app.telos.net/accounts/add');
        },
        async onLogin(idx, justViewer = false) {
            try {
                await this.login({ idx, justViewer });
                const account = localStorage.getItem('account');
                if (account) {
                    this.$router.push({ path: '/zero/balance' });
                }
            } catch (e) {
                this.$errorNotification(e);
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
            if (wallet instanceof OreIdAuthenticator) {
                return telosLogo;
            }

            return wallet.getStyle().icon;
        },
        getWalletName(wallet) {
            if (wallet instanceof OreIdAuthenticator) {
                return this.$t('home.login_with_social_media');
            }

            return wallet.getStyle().text;
        },
    },
    watch: {
        async isAuthenticated() {
            if (this.isAuthenticated) {
                await this.createEvmApi();
                await this.checkResources();
            }
        },
    },
});
</script>

<template>
<div>
    <!-- Login Button -->
    <div v-if="!isAuthenticated" class="c-native-login__buttons-container">
        <div
            v-for="(wallet, idx) in $ual.authenticators"
            :key="wallet.getStyle().text"
            class="c-native-login__button"
            tabindex="0"
            aria-role="button"
            @keyup.enter="onLogin(idx)"
            @click="onLogin(idx)"
        >
            <div v-if="loading === wallet.getStyle().text" class="c-native-login__loading">
                <QSpinnerFacebook />
            </div>
            <template v-else>
                <img :src="getWalletIcon(wallet)" width="24" >
                {{ getWalletName(wallet) }}
            </template>
        </div>

        <hr class="c-native-login__hr">

        <div
            class="c-native-login__button c-native-login__button--centered"
            tabindex="0"
            aria-role="button"
            @keyup.enter="loginAsJustViewer"
            @click="loginAsJustViewer"
        >
            {{ $t('home.view_any_account') }}
        </div>

        <div
            class="c-native-login__button c-native-login__button--centered"
            tabindex="0"
            aria-role="button"
            @keyup.enter="signUp"
            @click="signUp"
        >
            {{ $t('home.create_new_account') }}
        </div>
    </div>

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

    <!-- RAM low dialog -->
    <q-dialog v-model="resLow" persistent>
        <q-card class="popupCard">
            <div class="popupHeading">
                <div>
                    <q-btn
                        v-close-popup
                        round
                        flat
                        dense
                        class="text-grey-6"
                        icon="close"
                    />
                </div>
                <div class="text-subtitle1 text-weight-medium text-center ">
                    {{$t('login.resources_low')}}
                </div>
                <div ></div>
            </div>
            <div class="text-center">
                <div class="q-pb-md">
                    {{$t('login.recommend_bying')}}
                </div>
                <div class="">{{$t('login.proceed_q')}}</div>
                <div class="text-center q-gutter-x-sm q-pt-sm">
                    <q-btn
                        v-close-popup
                        no-caps
                        rounded
                        class="purpleGradient"
                        label="Deny"
                    />
                    <q-btn
                        no-caps
                        rounded
                        label="Approve"
                        class="purpleGradient"
                        @click="buyResources()"
                    />
                </div>
            </div>
        </q-card>
    </q-dialog>
</div>
</template>

<style lang="scss">

.c-native-login {
    &__buttons-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 14px;
    }

    &__loading {
        width: 100%;
        text-align: center;
    }

    &__button {
        display: flex;
        align-items: center;
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

        &:hover,
        &:focus {
            outline-color: $white;
            outline-width: 2px;
        }

        &--centered {
            justify-content: center;
        }
    }

    &__hr {
        width: 224px;
    }
}

.logged-in{
    color: white;
    font-size: 16px !important;
    margin-bottom: 2rem;
}


</style>
