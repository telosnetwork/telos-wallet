
<script>
import { useChainStore } from 'src/antelope';
import { defineComponent } from 'vue';
import { mapGetters, mapActions, mapMutations } from 'vuex';

export default defineComponent({
    name: 'NativeLoginButton',
    data() {
        return {
            showLogin: false,
            showAuth: false,
            authType: 'signin',
            error: null,
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
            chainStore.setChain('current', network);
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
            const error = await this.login({ idx, justViewer });
            if (!error) {
                this.showLogin = false;
                await this.$router.push({ path: '/native/balance' });
            } else {
                this.error = error;
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
            if (!accountName) {
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
    <div v-if="!isAuthenticated" class="q-px-md flex justify-center">
        <div class="q-mt-md q-mb-sm">
            <q-btn
                :label="$t('home.connect_with_wallet')"
                class="purpleGradient q-px-md q-py-sm"
                @click="showLogin = true"
            />
        </div>

        <!-- View any account -->
        <div class="q-mt-md">
            <q-btn
                text-color="white"
                outline
                :label="$t('home.view_any_account')"
                class="q-px-md q-py-sm"
                @click="loginAsJustViewer()"
            />
        </div>

        <!-- Signup Button -->
        <div class="q-mt-md">
            <q-btn
                text-color="white"
                outline
                :label="$t('home.create_new_account')"
                class="q-px-md q-py-sm"
                @click="signUp"
            />
        </div>
    </div>

    <div v-else class="q-px-md flex justify-center column">
        <p class="q-mb-lg"> {{ $t( 'home.logged_as', {account: accountName}) }}</p>

        <q-btn
            text-color="white"
            outline
            :label="$t('home.view_wallet')"
            class="q-px-md q-py-sm q-mb-lg"
            @click="$router.push('/native/balance')"
        />

        <q-btn
            text-color="white"
            outline
            :label="$t('home.logout')"
            class="q-px-md q-py-sm"
            @click="logout"
        />
    </div>

    <!-- Show Login -->
    <q-dialog v-model="showLogin">
        <div class="column showLoginPopup q-pa-lg popupCard">
            <div class="text-subtitle1">{{$t('login.connect_wallet')}}</div>
            <q-list class="" dark separator>
                <q-item
                    v-for="(wallet, idx) in $ual.authenticators"
                    :key="wallet.getStyle().text"
                    v-ripple
                    class="q-my-sm"
                >
                    <q-item-section class="cursor-pointer" avatar @click="onLogin(idx)">
                        <img :src="wallet.getStyle().icon" width="30" >
                    </q-item-section>
                    <q-item-section class="cursor-pointer" @click="onLogin(idx)">
                        {{ wallet.getStyle().text }}
                    </q-item-section>
                    <q-item-section class="flex" avatar>
                        <q-spinner
                            v-if="loading === wallet.getStyle().text"
                            :color="wallet.getStyle().textColor"
                            size="2em"
                        />
                        <q-btn
                            v-else
                            :color="wallet.getStyle().textColor"
                            icon="get_app"
                            target="_blank"
                            dense
                            flat
                            size="12px"
                            @click="openUrl(wallet.getOnboardingLink())"
                        >
                            <q-tooltip>
                                {{$t('login.get_app')}}
                            </q-tooltip>
                        </q-btn>
                    </q-item-section>
                </q-item>
            </q-list>

            <!-- Close Button -->
            <q-btn
                v-close-popup
                size="md"
                no-caps
                rounded
                flat
                class="self-center flex-center"
                label="Close"
                :style="`display:flex;`"
                @click="close"
            />
            <q-item
                v-if="error"
                :active="!!error"
                active-class="bg-red-1 text-grey-8"
            >
                <q-item-section>
                    {{ error }}
                </q-item-section>
            </q-item>
        </div>
    </q-dialog>

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

<style lang="scss" scoped>

.showLoginPopup {
    width: 30rem;
    height: auto;
    margin-bottom: 5rem;
}


</style>
