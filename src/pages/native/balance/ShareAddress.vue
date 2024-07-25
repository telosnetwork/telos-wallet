<script>
import { mapGetters, mapMutations } from 'vuex';
import { QRCanvas } from 'qrcanvas-vue';
import pTokens from 'ptokens';
import { copyToClipboard } from 'quasar';
import BigNumber from 'bignumber.js';
import { useChainStore } from 'src/antelope';

export default {
    props: ['showShareAddressDlg', 'selectedCoin'],
    data() {
        return {
            searchCoinName: '',
            networkType: 'telos',
            depositAddress: '',
            metaData: {},
            awaiting: false,
            username: '',
            notes: '',
            selectedDestCoin: '',
            sendAmountValue: 0,
            coinInput: '',
            sendAmount: 0,
            amountFontSize: '',
        };
    },
    components: {
        QRCanvas,
    },
    computed: {
        ...mapGetters('account', ['isAuthenticated', 'accountName', 'evmAddress']),
        ...mapGetters('global', ['pTokens', 'pTokenNetworks']),
        searchCoins() {
            return this.coins.filter(coin => (
                coin.name.toLowerCase().includes(this.searchCoinName.toLowerCase()) ||
          coin.symbol.toLowerCase().includes(this.searchCoinName.toLowerCase())
            ));
        },
        cardHeight() {
            return window.innerHeight - 150;
        },
        showDlg: {
            get() {
                return this.showShareAddressDlg;
            },
            set(value) {
                this.$emit('update:showShareAddressDlg', value);
            },
        },
        qrcodeData() {
            if (this.networkType === 'telos') {
                return `${this.accountName}`;
            } else if (this.networkType === 'tevm') {
                return `${this.evmAddress}`;
            } else if (this.networkType === 'ethereum') {
                return `${this.accountName}`;
            } else if (this.networkType === 'ptoken') {
                return `${this.depositAddress}`;
            }
            return '';
        },
        displayAccountName() {
            if (this.networkType === 'telos') {
                return this.accountName;
            } else if (this.networkType === 'ethereum') {
                return this.accountName;
            } else if (this.networkType === 'tevm') {
                if (this.evmAddress) {
                    return this.evmAddress;
                } else {
                    return 'Please Generate New Address';
                }
            } else if (this.networkType === 'ptoken') {
                if (this.depositAddress.length > 0) {
                    return this.depositAddress;
                } else {
                    return this.$t('components.generate_new_address');
                }
            }
            return '';
        },
        isAddressAvailable() {
            if (this.networkType === 'tevm' && this.evmAddress) {
                return true;
            }
            if (this.networkType === 'ptoken' && this.depositAddress.length > 0) {
                return true;
            }
            return false;
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
        chainName() {
            return useChainStore().currentChain.settings.getNetwork();
        },
        coinpTokenNetworks() {
            if (this.selectedCoin.network) {
                return {
                    [this.selectedCoin.network]:
            this.pTokenNetworks[this.tSymbol][this.selectedCoin.network],
                };
            }
            const networks = {};
            for (const key in this.pTokenNetworks[this.tSymbol]) {
                if (key !== 'ethereum' || (this.chainName !== 'telos' && this.chainName !== 'telos-testnet')) {
                    networks[key] = this.pTokenNetworks[this.tSymbol][key];
                }
            }
            return networks;
        },
    },
    methods: {
        ...mapMutations('account', [
            'setEvmAddress',
            'setEvmBalance',
        ]),
        async generateEVMAddress() {
            let actions = [];
            actions.push({
                account: process.env.EVM_CONTRACT,
                name: 'create',
                data: {
                    account: this.accountName,
                    data: 'data',
                },
            });
            try {
                const transaction = await this.$store.$api.signTransaction(
                    actions,
                    'Create a new EVM address',
                );
                this.$successNotification(this.$t('components.new_address_created'));
                const evmAccount =
          await this.$evmApi.telos.getEthAccountByTelosAccount(
              this.accountName,
          );
                this.networkType = 'tevm';
                if (evmAccount && evmAccount.address){
                    this.setEvmAddress(evmAccount.address);
                    this.setEvmBalance(BigNumber(evmAccount.balance.toString())
                        .div(1e18)
                        .toFixed(4));
                }
            } catch (error) {
                this.$errorNotification(error);
            }
        },
        getImgUrl() {
            return require('assets/evm/ethereumLogo.svg');
        },
        async generateDepositAddress() {
            this.awaiting = false;
            let ptoken = new pTokens({
                pbtc: {
                    blockchain: 'Telos',
                    network: 'mainnet',
                },
                perc20: {
                    blockchain: 'Telos',
                    network: 'mainnet',
                    pToken: 'pETH',
                },
            });

            let newAddress = null;
            if (this.selectedCoin.symbol.toLowerCase() === 'pbtc') {
                newAddress = await ptoken.pbtc.getDepositAddress(this.accountName);
            } else if (this.selectedCoin.symbol.toLowerCase() === 'tlos') {
                newAddress = await ptoken.peth.issue(10, this.accountName);
            }

            if (newAddress.value) {
                this.awaiting = true;
                this.depositAddress = newAddress.value;
                this.metaData[this.selectedCoin.symbol] = this.depositAddress;
                window.localStorage.setItem('metaData', JSON.stringify(this.metaData));
                this.$successNotification(this.$t('components.address_is_generated'));

                newAddress
                    .waitForDeposit()
                    .once('nativeTxBroadcasted', (tx) => {})
                    .once('nativeTxConfirmed', (tx) => {})
                    .once('nodeReceivedTx', (tx) => {})
                    .once('nodeBroadcastedTx', (tx) => {})
                    .once('hostTxConfirmed', (tx) => {})
                    .then((res) => {
                        this.$successNotification(this.$t('components.deposit_confirmed'));
                        this.awaiting = false;
                    });
            }
        },
        copyToClipboard(str) {
            copyToClipboard(str).then(() => {
                this.$successNotification(this.$t('settings.copied_ok'));
            });
        },
    },
    watch: {
        showShareAddressDlg: async function (val, oldVal) {
            if (val) {
                this.networkType = 'telos';
                if (this.selectedCoin && this.selectedCoin.network) {
                    this.networkType = this.selectedCoin.network;
                }
                this.metaData =
          JSON.parse(window.localStorage.getItem('metaData')) || {};
                this.depositAddress = this.metaData[this.selectedCoin.symbol] || '';
            }
        },
    },
    mounted() {},
};
</script>

<template>
<q-dialog
    v-if="selectedCoin"
    v-model="showDlg"
    persistent
    maximized
    transition-show="slide-left"
    transition-hide="slide-right"
>
    <div class="main-background native-font-color">
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
                        {{ `Receive ${selectedCoin.symbol}` }}
                    </div>
                    <div ></div>
                </div>
                <div>
                    <!-- <q-card
              class="column qr-card text-center q-mx-auto q-my-md q-pa-sm no-shadow bg-transparent q-gutter-md"
            > -->
                    <q-card class="bg-transparent no-shadow text-center">
                        <!-- <div v-if="isPToken" class="list-item q-pb-sm"> -->
                        <div v-if="isPToken" class="q-py-md">
                            <label
                                class="text-center full-width text-white"
                            > {{$t('components.from_network')}}</label>
                        </div>
                        <div v-if="isPToken" class="">
                            <q-btn-group
                                class="full-width justify-center q-pb-md"
                                push
                                unelevated
                                rounded
                            >
                                <q-btn
                                    v-for="(pTokenNetwork, key) of coinpTokenNetworks"
                                    :key="pTokenNetwork"
                                    class="q-px-md"
                                    push
                                    no-caps
                                    :label="pTokenNetwork"
                                    :style="`background: ${
                                        networkType === key ? '#FFFFFF55' : '#FFFFFF22'
                                    };
                        color: ${networkType === key ? 'white' : 'grey'};`"
                                    @click="networkType = key"
                                />
                            </q-btn-group>
                            <q-btn
                                v-if="
                                    networkType === 'ptoken' ||
                                        (networkType === 'tevm' && !evmAddress)
                                "
                                class="purpleGradient q-mt-lg text-weight-medium text-caption"
                                push
                                no-caps
                                :label="
                                    networkType === 'ptoken'
                                        ? 'Generate New Deposit Address'
                                        : 'Generate New Address'
                                "
                                :style="`visibility: ${
                                    networkType === 'telos' ? 'hidden' : ''
                                }`"
                                @click="
                                    networkType === 'ptoken'
                                        ? generateDepositAddress()
                                        : generateEVMAddress()
                                "
                            />
                        </div>
                        <q-space />
                        <div
                            v-if="
                                networkType === 'telos' ||
                                    networkType === 'ethereum' ||
                                    isAddressAvailable
                            "
                            class="cursor-pointer"
                            @click="copyToClipboard(qrcodeData)"
                        >
                            <QRCanvas
                                :options="{ data: qrcodeData, cellSize: 10 }"
                                class="qrCanvas q-pa-lg bg-white"
                            />
                        </div>
                        <div
                            :class="
                                networkType === 'telos' ||
                                    networkType === 'ethereum' ||
                                    !isAddressAvailable
                                    ? 'text-h6'
                                    : 'text-caption'
                            "
                            class="text-white account-name"
                        >
                            {{ displayAccountName }}
                        </div>
                        <div class="text-white">({{ selectedCoin.name }} address)</div>
                        <div v-if="networkType === 'ptoken' && awaiting" class="q-pt-md">
                            <q-spinner color="primary" size="2em" :thickness="5" />
                            {{$t('components.awaiting_deposits')}}
                        </div>
                        <q-space />
                        <div v-if="networkType === 'tevm'" class="text-caption text-red">
                            {{$t('components.telos_evm_only')}}
                        </div>
                        <div
                            v-else-if="networkType === 'ptoken'"
                            class="text-caption text-grey-8"
                        >

                            {{ $t('components.telos_evm_only', {
                                sym: selectedCoin.symbol.slice(1),
                                account: accountName
                            }) }}

                        </div>
                    </q-card>
                </div>
            </div>
        </div>
    </div>
</q-dialog>
</template>

<style lang="scss" scoped>
.account-name {
    word-break: break-word;
}

input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}

@media only screen and (min-width: 1000px) {
}

.qrCanvas {
  width: 15rem;
  border-radius: 2rem;
}
</style>
