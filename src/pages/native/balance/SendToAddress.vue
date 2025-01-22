<script>
import { mapGetters, mapActions } from 'vuex';
import SendConfirm from '~/pages/native/balance/SendConfirm';
import tokenAvatar from 'components/native/TokenAvatar.vue';

export default {
    props: ['showSendToAddressDlg', 'selectedCoin', 'sendAmount'],
    data() {
        return {
            toAddress: '',
            notes: '',
            showSendConfirmDlg: false,
            networkType: 'telos',
            checking: false,
        };
    },
    components: {
        SendConfirm,
        TokenAvatar: tokenAvatar,
    },
    computed: {
        ...mapGetters('account', ['isAuthenticated', 'accountName', 'evmAddress']),
        ...mapGetters('global', ['pTokens', 'pTokenNetworks']),
        showDlg: {
            get() {
                return this.showSendToAddressDlg;
            },
            set(value) {
                this.$emit('update:showSendToAddressDlg', value);
            },
        },
        tSymbol() {
            return this.selectedCoin.symbol.toLowerCase();
        },
        isPToken() {
            if (!this.selectedCoin) {
                return false;
            }
            if (!this.pTokens.includes(this.tSymbol)) {
                return false;
            }
            if (this.selectedCoin.network) {
                return true;
            }
            return Object.keys(this.coinpTokenNetworks).length > 1;
        },
        toPlaceHolder() {
            if (this.networkType === 'telos') {
                return 'Username or Telos address';
            }
            return `${this.pTokenNetworks[this.tSymbol][this.networkType]} address`;
        },
        coinpTokenNetworks() {
            if (this.selectedCoin.network) {
                return {
                    [this.selectedCoin.network]: this.pTokenNetworks[this.tSymbol][this.selectedCoin.network],
                };
            }
            const networks = {};
            for (const key in this.pTokenNetworks[this.tSymbol]) {
                networks[key] = this.pTokenNetworks[this.tSymbol][key];
            }

            return networks;
        },
    },
    methods: {
        ...mapActions('account', ['accountExists']),
        async nextPressed() {
            if (this.toAddress.length === 0) {
                this.$errorNotification(this.$t('components.please_fill_the_field', {
                    field: this.toPlaceHolder,
                }));
                return;
            }

            this.checking = true;
            if (this.networkType === 'telos') {
                if (!(await this.accountExists(this.toAddress))) {
                    this.$errorNotification(this.$t('components.account_not_valid', {
                        account: this.toAddress,
                    }));
                    this.checking = false;
                    return;
                }
            } else if (
                this.networkType === 'tevm' ||
        this.networkType === 'ethereum'
            ) {
                if (this.toAddress.length !== 42 || !this.toAddress.startsWith('0x')) {
                    this.$errorNotification(this.$t('components.address_not_valid', {
                        address: this.toAddress,
                    }));
                    this.checking = false;
                    return;
                }
            } else if (this.networkType === 'ptoken') {
                if (this.selectedCoin.name === 'pTokens ETH') {
                    if (
                        this.toAddress.length !== 42 ||
            !this.toAddress.startsWith('0x')
                    ) {
                        this.$errorNotification(this.$t('components.address_not_valid', {
                            address: this.toAddress,
                        }));
                        this.checking = false;
                        return;
                    }
                } else if (this.selectedCoin.name === 'pTokens BTC') {
                    const data = await fetch(
                        `https://api.smartbit.com.au/v1/blockchain/address/${this.toAddress}`,
                    ).then(resp => resp.json());
                    if (!data.success) {
                        this.$errorNotification(this.$t('components.address_not_valid', {
                            address: this.toAddress,
                        }));
                        this.checking = false;
                        return;
                    }
                }
            }

            this.checking = false;
            this.showSendConfirmDlg = true;
        },
        showQRScanner() {
            this.$emitter.emit('show_qrscanner');
        },
    },
    mounted() {
        this.$emitter.on('successfully_sent', (sendAmount, toAddress) => {
            this.showSendConfirmDlg = false;
        });
        this.$emitter.on(
            'qrcode_scanned',
            ({ accountName, coinName, networkType }) => {
                if (this.showSendToAddressDlg) {
                    if (this.selectedCoin && coinName !== this.selectedCoin.name) {
                        this.$errorNotification(this.$t('components.scan_correct_token'));
                    } else {
                        this.toAddress = accountName;
                        this.networkType = networkType;
                    }
                }
            },
        );
    },
    watch: {
        showSendToAddressDlg: async function (val, oldVal) {
            if (val) {
                this.toAddress = this.$root.qrcode_accountName || '';
                this.networkType = this.$root.qrcode_networkType || 'telos';
                if (this.selectedCoin && this.selectedCoin.network) {
                    this.networkType = this.selectedCoin.network;
                }
                this.$root.qrcode_accountName = '';
                this.notes = '';
                this.checking = false;
            }
        },
        toAddress: function (val, oldVal) {
            if (this.networkType === 'telos') {
                this.toAddress = this.toAddress.toLowerCase();
            }
        },
        networkType: function (val, oldVal) {
            if (val === 'telos') {
                this.toAddress = this.toAddress.toLowerCase();
            } else if (val === 'tevm') {
                if (!this.evmAddress) {
                    this.$errorNotification(this.$t('components.generate_your_address'));
                }
            }
        },
    },
};
</script>

<template>
<q-dialog
    v-model="showDlg"
    persistent
    maximized
    transition-show="slide-left"
    transition-hide="slide-right"
>
    <div v-if="selectedCoin" class="main-background native-font-color">
        <div class="dialogPage">
            <div class="dialogPageContent">
                <div class="dialogPageHeading">
                    <div>
                        <q-btn
                            v-close-popup
                            round
                            flat
                            dense
                            class="closebBtn"
                            icon="west"
                        />
                    </div>
                    <div class="text-subtitle1 text-weight-medium text-center">
                        {{$t('components.send')}}
                    </div>
                    <div ></div>
                </div>
                <div class="">
                    <q-item v-if="isPToken" class="list-item q-pt-lg q-pb-none">
                        <label
                            class="text-center full-width text-white"
                        >{{$t('components.to_network')}}</label>
                    </q-item>
                    <div class="row q-gutter-x-md items-center justify-center q-pt-md">
                        <q-avatar size="6rem">
                            <TokenAvatar :token="selectedCoin.icon" :avatarSize="95" />
                            <div
                                v-if="
                                    networkType === 'tevm' && selectedCoin.name === 'Telos EVM'
                                "
                                class="flex absolute full-width full-height"
                            >
                                <img
                                    class="flex q-ml-auto q-mt-auto evm-logo"
                                    alt="tEVM"
                                    src='/branding/telos-scan.png'
                                >
                            </div>
                        </q-avatar>
                        <div><img src="~assets/icons/networkArrows.svg" ></div>
                        <q-avatar size="6rem">
                            <TokenAvatar
                                v-if="networkType === 'telos' || networkType === 'tevm'"
                                :token="selectedCoin.icon"
                                :avatarSize="95"
                            />
                            <div
                                v-if="networkType === 'tevm'"
                                class="flex absolute full-width full-height"
                            >
                                <img
                                    class="flex q-ml-auto q-mt-auto evm-logo"
                                    alt="tEVM"
                                    src='/branding/telos-scan.png'
                                >
                            </div>
                            <img
                                v-if="networkType === 'ethereum'"
                                src='/branding/telos.png'
                            >
                            <div
                                v-if="networkType === 'ethereum'"
                                class="flex absolute full-width full-height"
                            >
                                <img
                                    class="flex q-ml-auto q-mt-auto eth-logo"
                                    alt="tEVM"
                                    src="~assets/evm/ETH.svg"
                                >
                            </div>
                        </q-avatar>
                    </div>
                    <div class="text-subtitle1 text-weight-medium text-center q-py-md">
                        {{
                            `${getFixed(sendAmount, selectedCoin.precision)} ${
                                selectedCoin.symbol
                            }`
                        }}
                    </div>
                </div>

                <!-- Crypto Buttons -->
                <q-item v-if="isPToken" class="list-item">
                    <q-btn-group
                        class="full-width justify-center"
                        push
                        unelevated
                        rounded
                    >
                        <q-btn
                            v-for="(pTokenNetwork, key) of coinpTokenNetworks"
                            :key="pTokenNetwork"
                            push
                            no-caps
                            :label="pTokenNetwork"
                            :class="{
                                'crypto-button': true,
                                'crypto-button--key-type': networkType === 'key',
                            }"
                            @click="networkType = key"
                        />
                    </q-btn-group>
                </q-item>

                <!-- To network -->
                <div class="row justify-center">
                    <q-list class="q-pt-md">
                        <q-item class="list-item">
                            <q-item-section side class="to-label"> To: </q-item-section>
                            <q-item-section>
                                <q-input
                                    v-model="toAddress"
                                    :value="toAddress.toLowerCase()"
                                    dense
                                    standout="bg-transparent text-white"
                                    label-color="white"
                                    color="white"
                                    input-class="text-white"
                                    class="round-sm full-width"
                                    :label="toPlaceHolder"
                                />
                            </q-item-section>
                            <q-item-section side>
                                <div class="qrBtn" @click="showQRScanner()">
                                    <img src="~assets/icons/qr_scan.svg" >
                                </div>
                            </q-item-section>
                        </q-item>
                        <q-item
                            v-if="networkType === 'telos'"
                            class="list-item listItemNotes"
                        >
                            <q-item-section
                                text-white
                                side
                                class="col-1 memo"
                            >{{$t('components.memo')}}:</q-item-section>
                            <q-item-section>
                                <q-input
                                    v-model="notes"
                                    :disable="
                                        networkType === 'ptoken' || networkType === 'ethereum'
                                    "
                                    dense
                                    standout="bg-transparent text-white"
                                    label-color="white"
                                    color="white"
                                    input-class="text-white"
                                    class="round-sm full-width"
                                    label="Notes"
                                />
                            </q-item-section>
                        </q-item>
                        <q-item
                            v-if="
                                networkType === 'ethereum' &&
                                    sendAmount * selectedCoin.price < 100
                            "
                            class="list-item items-center text-center text-red-5 text-weight-bold"
                        >
                            <div>
                                {{$t('components.minimun_to_transfer')}}
                            </div>
                        </q-item>
                        <q-item>
                            <div v-if="checking" class="q-pt-md text-center full-width">
                                <q-spinner
                                    class="q-my-md"
                                    color="primary"
                                    size="2em"
                                    :thickness="5"
                                /><br >
                                {{$t('components.checking')}} {{ networkType === "telos" ? "Account" : "Address" }}
                            </div>
                        </q-item>
                        <q-item
                            v-if="networkType === 'tevm'"
                            class="list-item items-center text-center text-red-5 text-weight-bold"
                        >
                            <div>
                                {{$t('components.dont_send_to_exchanges')}}
                            </div>
                        </q-item>
                    </q-list>
                </div>
                <div class="text-center">
                    <q-btn
                        flat
                        dense
                        class="purpleGradient text-white text-subtitle2 nextBtn"
                        label="Next"
                        :disable="
                            networkType === 'ethereum' &&
                                sendAmount * selectedCoin.price < 100
                        "
                        @click="
                            networkType === 'ethereum' &&
                                sendAmount * selectedCoin.price < 100
                                ? null
                                : nextPressed()
                        "
                    />
                </div>
            </div>
        </div>
    </div>
    <SendConfirm
        v-model:showSendConfirmDlg="showSendConfirmDlg"
        :selectedCoin="selectedCoin"
        :sendAmount="sendAmount"
        :toAddress="toAddress"
        :notes="notes"
        :networkType="networkType"
    />
</q-dialog>
</template>

<style lang="scss" scoped>
/* .list-item {
  border-left: none;
  border-right: none;
} */
.evm-logo {
    width: 50%;
    height: 50%;
    margin-right: -10%;
    margin-bottom: -5%;
}

.eth-logo {
    width: 50%;
    height: 35%;
    margin-right: 0%;
    margin-bottom: -5%;
}

.crypto-button {
    background: #FFFFFF22;
    color: white;

    &--key-type {
        background: #FFFFFF55;
        color: gray;
    }
}

.to-label {
    color: white;
}

.memo {
    width: 50px;
    color: white
}
</style>
