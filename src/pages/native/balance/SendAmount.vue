<script>
import { mapGetters, mapActions } from 'vuex';
import SendToAddress from '~/pages/native/balance/SendToAddress';
import { setInterval } from 'timers';
import BigNumber from 'bignumber.js';
import tokenAvatar from 'components/native/TokenAvatar.vue';

export default {
    props: ['showSendAmountDlg', 'showHistoryDlg', 'selectedCoin'],
    data() {
        return {
            keyboard: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '←'],
            sendAmount: '0',
            sendPercentage: 0,
            coinInput: true,
            showSendToAddressDlg: false,
            inputWidth: 50,
            gasPrice: new BigNumber(0),
        };
    },
    components: {
        SendToAddress,
        TokenAvatar: tokenAvatar,
    },
    computed: {
        ...mapGetters('account', ['isAuthenticated', 'accountName']),
        showDlg: {
            get() {
                return this.showSendAmountDlg;
            },
            set(value) {
                this.$emit('update:showSendAmountDlg', value);
            },
        },
        cardHeight() {
            return window.innerHeight - 100;
        },
        amountFontSize() {
            return Math.min(50, window.innerWidth / (this.sendAmount.length + 1));
        },
        amountFontSizeMobile() {
            return Math.min(40, window.innerWidth / (this.sendAmount.length + 1));
        },
        sendAmountValue() {
            return Number(this.sendAmount.replace(',', ''));
        },
        gasFee() {
            return this.gasPrice.times(21000).div(1e18).toFixed(4);
        },
        sendCoinAmount() {
            if (!this.selectedCoin) {
                return 0;
            }
            if (this.coinInput) {
                return this.sendAmountValue;
            }

            return this.getFixed(
                this.sendAmountValue / this.selectedCoin.price,
                this.selectedCoin.precision,
            ).replace(',', '');
        },
    },
    methods: {
        ...mapActions('evm', ['getGasPrice']),
        selectCoin(coin) {
            this.showShareAddressDlg = true;
            // eslint-disable-next-line vue/no-mutating-props
            this.selectedCoin = coin;
        },
        changeCoinInput() {
            if (this.coinInput) {
                this.sendAmount = this.getFixed(
                    this.sendAmountValue * this.selectedCoin.price,
                    8,
                ).replace(',', '');
            } else {
                this.sendAmount = this.getFixed(
                    this.sendAmountValue / this.selectedCoin.price,
                    this.selectedCoin.precision,
                ).replace(',', '');
            }

            this.coinInput = !this.coinInput;
            this.inputValue = `${!this.coinInput ? '$ ' : ''}${this.sendAmount}${
                this.coinInput ? ' ' + this.selectedCoin.symbol : ''
            }`;
        },
        clickedPercent(percent) {
            this.sendAmount = Number(
                this.sendPercentage === 0
                    ? ''
                    : (this.selectedCoin.amount * percent) / 100,
            )
                .toFixed(this.selectedCoin.precision)
                .toString();
            if (this.selectedCoin.name === 'Telos EVM' && this.sendAmount > 0) {
                this.sendAmount =
          Number(this.sendAmount).toFixed(4) - this.gasFee - 0.0001;
                this.sendAmount = Number(this.sendAmount.toFixed(4)).toString();
            }
        },
        buttonClicked(key) {
            if (key === '.') {
                if (!this.sendAmount.includes('.')) {
                    this.sendAmount += '.';
                }
            } else if (key === '←') {
                if (this.sendAmount.length > 1) {
                    this.sendAmount = this.sendAmount.slice(0, -1);
                } else {
                    this.sendAmount = '0';
                }
            } else {
                if (this.sendAmount === '0') {
                    this.sendAmount = key;
                } else {
                    this.sendAmount += key;
                }
            }

            if (this.coinInput && this.sendAmountValue > this.selectedCoin.amount) {
                this.sendAmount = this.selectedCoin.amount.toString();
            } else if (
                !this.coinInput &&
        this.sendAmountValue >
          this.selectedCoin.amount * this.selectedCoin.price
            ) {
                this.sendAmount = (
                    this.selectedCoin.amount * this.selectedCoin.price
                ).toString();
            }
        },
        nextPressed() {
            this.showSendToAddressDlg = true;
        },
    },
    async mounted() {
        this.$emitter.on('successfully_sent', (sendAmount, toAddress) => {
            this.showSendToAddressDlg = false;
        });
        this.gasPrice = new BigNumber('0x' + (await this.getGasPrice()));
    },
    watch: {
        showSendAmountDlg: function (val, oldVal) {
            if (val) {
                this.coinInput = true;
                this.sendAmount = '0';
            } else if (!this.showHistoryDlg) {
                this.$emit('update:selectedCoin', null);
            }
        },
        sendAmount: function (val, oldVal) {
            setInterval(() => {
                const widthElement = this.$refs.widthElement;
                this.inputWidth = widthElement ? widthElement.clientWidth + 5 : 50;
            }, 1);

            if (this.sendAmount !== oldVal) {
                if (this.coinInput && this.sendAmountValue > this.selectedCoin.amount) {
                    this.sendAmount = this.selectedCoin.amount.toString();
                } else if (
                    !this.coinInput &&
          this.sendAmountValue >
            this.selectedCoin.amount * this.selectedCoin.price
                ) {
                    this.sendAmount = (
                        this.selectedCoin.amount * this.selectedCoin.price
                    ).toString();
                } else if (val.charAt(val.length - 1) !== '.') {
                    const cleanStr = val.replace(/\s/g, '');
                    const num = parseFloat(cleanStr) || 0;
                    const maxValue = Math.max(0, num);
                    if (this.sendAmountValue !== maxValue) {
                        this.sendAmount = Math.max(0, num).toString();
                    }
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
    transition-show="slide-up"
    transition-hide="slide-down"
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
                        {{$t('components.send_amount')}}
                    </div>
                    <div ></div>
                </div>
                <div class="inputContainer">
                    <q-avatar class="coinAvatar" size="5rem">
                        <div
                            v-if="selectedCoin.name == 'Telos EVM'"
                            class="flex absolute full-width full-height"
                        >
                            <img
                                class="flex q-ml-auto"
                                alt="tEVM"
                                src='/branding/telos-scan.png'
                            >
                        </div>
                        <div
                            v-else-if="selectedCoin.name == 'Telos'"
                            class="flex absolute full-width full-height"
                        >
                            <img
                                class="flex q-ml-auto"
                                alt="tEVM"
                                src='/branding/telos.png'
                            >
                        </div>
                        <TokenAvatar v-else :token="selectedCoin.icon" :avatarSize="80" />
                    </q-avatar>
                    <div class="desktop-only flex flex-center">
                        <label
                            class="text-weight-regular q-mr-sm"
                            :style="`font-size: ${amountFontSize}px;`"
                        >
                            {{ coinInput ? `` : "$ " }}
                        </label>
                        <input
                            v-model="sendAmount"
                            type="text"
                            :class="`text-weight-regular ${
                                coinInput ? 'text-right' : 'text-left'
                            } no-border no-outline transparent`"
                            :style="`font-size: ${amountFontSize}px; color: white; z-index: 1; width: 300px; margin-left: -200px`"
                            @focus="sendAmount = sendAmount === '0' ? '' : sendAmount"
                            @blur="
                                sendAmount = Number(
                                    sendAmount === '' ? '0' : sendAmount
                                ).toString()
                            "
                            @change="sendPercentage = 0"
                        >
                        <label
                            class="text-weight-regular q-ml-sm"
                            :style="`font-size: ${amountFontSize}px; color: white`"
                        >
                            {{ coinInput ? selectedCoin.symbol : "" }}
                        </label>
                    </div>
                    <div class="mobileAmountContainer full-width mobile-only">
                        <label
                            class="text-weight-regular"
                            :style="`font-size: ${amountFontSizeMobile}px;`"
                        >
                            {{
                                coinInput
                                    ? `${sendAmount} ${selectedCoin.symbol}`
                                    : `$${sendAmount}`
                            }}
                        </label>
                    </div>
                    <label class="text-subtitle1 text-weight-large text-white">
                        {{
                            coinInput
                                ? `$ ${getFixed(sendAmountValue * selectedCoin.price, 8)}`
                                : `${getFixed(
                                    sendAmountValue / selectedCoin.price,
                                    selectedCoin.precision
                                )} ${selectedCoin.symbol}`
                        }}
                    </label>

                    <!-- Exchange persentage -->
                    <q-btn-group
                        class="q-mt-sm"
                        push
                        unelevated
                        rounded
                    >
                        <q-btn
                            push
                            no-caps
                            label="25%"
                            :style="`background: ${
                                sendPercentage === 25 ? '#FFFFFF55' : '#FFFFFF22'
                            };
                      color: ${sendPercentage === 25 ? 'white' : 'grey'};`"
                            @click="
                                sendPercentage === 25
                                    ? (sendPercentage = 0)
                                    : (sendPercentage = 25);
                                clickedPercent(25);
                            "
                        />
                        <q-btn
                            push
                            no-caps
                            label="50%"
                            :style="`background: ${
                                sendPercentage === 50 ? '#FFFFFF55' : '#FFFFFF22'
                            };
                      color: ${sendPercentage === 50 ? 'white' : 'grey'};`"
                            @click="
                                sendPercentage === 50
                                    ? (sendPercentage = 0)
                                    : (sendPercentage = 50);
                                clickedPercent(50);
                            "
                        />
                        <q-btn
                            push
                            no-caps
                            label="75%"
                            :style="`background: ${
                                sendPercentage === 75 ? '#FFFFFF55' : '#FFFFFF22'
                            };
                      color: ${sendPercentage === 75 ? 'white' : 'grey'};`"
                            @click="
                                sendPercentage === 75
                                    ? (sendPercentage = 0)
                                    : (sendPercentage = 75);
                                clickedPercent(75);
                            "
                        />
                        <q-btn
                            push
                            no-caps
                            label="100%"
                            :style="`background: ${
                                sendPercentage === 100 ? '#FFFFFF55' : '#FFFFFF22'
                            };
                      color: ${sendPercentage === 100 ? 'white' : 'grey'};`"
                            @click="
                                sendPercentage === 100
                                    ? (sendPercentage = 0)
                                    : (sendPercentage = 100);
                                clickedPercent(100);
                            "
                        />
                    </q-btn-group>

                    <!-- Crypto Available -->
                    <div class="text-center q-pt-xs q-pb-l">
                        <label class="text-subtitle2 text-white">{{
                            `${getFixed(selectedCoin.amount, selectedCoin.precision)} ${
                                selectedCoin.symbol
                            } Available`
                        }}</label>
                    </div>
                    <div class="keypad q-py-md mobile-only">
                        <div
                            v-for="key in keyboard"
                            :key="key"
                            class="keypadKey text-h5"
                            :label="key"
                            @click="buttonClicked(key)"
                        >
                            <div>{{ key }}</div>
                        </div>
                    </div>

                    <!-- Next Button -->
                    <q-btn
                        class="purpleGradient text-white text-subtitle2 nextBtn flex-center"
                        flat
                        no-caps
                        label="Next"
                        :disable="sendAmountValue === 0"
                        @click="nextPressed()"
                    />
                </div>
            </div>
        </div>
    </div>
    <SendToAddress
        v-model:showSendToAddressDlg="showSendToAddressDlg"
        :selectedCoin="selectedCoin"
        :sendAmount="sendCoinAmount"
    />
</q-dialog>
</template>

<style lang="scss" scoped>
.inputContainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  height: 400px;
  @media only screen and (max-height: 900px) {
    height: 90%;
  }
}
.mobileAmountContainer {
  height: 8rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.evm-logo {
    width: 50%;
    height: 50%;
    margin-right: -10%;
    margin-top: 60%;
}
</style>
