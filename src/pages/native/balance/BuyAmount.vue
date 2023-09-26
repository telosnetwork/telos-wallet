<script>
import { mapGetters } from 'vuex';
import { setInterval } from 'timers';

export default {
    props: ['showBuyAmountDlg', 'showHistoryDlg', 'selectedCoin', 'coins'],
    data() {
        return {
            keyboard: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '←'],
            buyAmount: '0',
            exchangeRate: 0,
            getAmount: 0,
            coinInput: false,
            inputWidth: 50,
            calculating: 0,
        };
    },
    computed: {
        ...mapGetters('account', ['isAuthenticated', 'accountName']),
        showDlg: {
            get() {
                return this.showBuyAmountDlg;
            },
            set(value) {
                this.$emit('update:showBuyAmountDlg', value);
            },
        },
        cardHeight() {
            return window.innerHeight - 70;
        },
        amountFontSize() {
            return Math.min(50, window.innerWidth / (this.buyAmount.length + 1));
        },
        buyAmountValue() {
            return Number(this.buyAmount);
        },
        availbleCoins() {
            return this.coins.filter(
                coin =>
                    coin.amount > 0 ||
          this.suggestTokens.map(t => t.sym).includes(coin.symbol.toLowerCase()),
            );
        },
    },
    methods: {
        selectCoin(coin) {
            // eslint-disable-next-line vue/no-mutating-props
            this.selectedCoin = coin;
            this.$emit('update:selectedCoin', coin);
            this.$emit('update:showHistoryDlg', true);
        },
        buttonClicked(key) {
            if (key === '.') {
                if (!this.buyAmount.includes('.')) {
                    this.buyAmount += '.';
                }
            } else if (key === '←') {
                if (this.buyAmount.length > 1) {
                    this.buyAmount = this.buyAmount.slice(0, -1);
                } else {
                    this.buyAmount = '0';
                }
            } else {
                if (this.buyAmount === '0') {
                    this.buyAmount = key;
                } else {
                    this.buyAmount += key;
                }
            }

            if (this.coinInput && this.buyAmountValue > this.selectedCoin.amount) {
                this.buyAmount = this.selectedCoin.amount.toString();
            }
        },
        async buyPressed() {
            if (!this.inputCoin) {
                if (this.buyAmountValue < 20) {
                    this.$successNotification(this.$t('components.minimum_amount'));
                } else {
                    this.goToMoonpayPage();
                }
            }
        },
        async goToMoonpayPage() {
            const urlToSign = `https://buy.moonpay.io?apiKey=pk_live_bLNjJYoA2bwYMs7ir72Tgb5jLyHrK&currencyCode=eos&walletAddress=tradefortlos&baseCurrencyCode=usd&walletAddressTag=${this.accountName}&baseCurrencyAmount=${this.buyAmountValue}`;
            var signatureRequest = new XMLHttpRequest();
            signatureRequest.open(
                'POST',
                'https://api.telos.net/v1/trading/getMoonpaySwapUrl',
            );

            signatureRequest.setRequestHeader(
                'Content-type',
                'application/json;charset=UTF-8',
            );
            var requestBody = JSON.stringify({ urlToSign: urlToSign });

            signatureRequest.send(requestBody);

            signatureRequest.onload = function() {
                if (
                    +signatureRequest.readyState === 4 && +signatureRequest.status === 200
                ) {
                    window.open(signatureRequest.responseText);
                } else {
                    console.error(signatureRequest.responseText);
                }
            };
        },
        async getMoonpayQuote() {
            await fetch(
                `https://api.moonpay.io/v3/currencies/eos/buy_quote/?apiKey=pk_live_bLNjJYoA2bwYMs7ir72Tgb5jLyHrK&baseCurrencyAmount=${this.buyAmountValue}&extraFeePercentage=0&baseCurrencyCode=usd&enabledPaymentMethods=credit_debit_card,sepa_bank_transfer,gbp_bank_transfer,apple_pay`,
            )
                .then(res => res.json())
                .then((data) => {
                    this.getNewdexQuote(parseFloat(data.quoteCurrencyAmount));
                });
        },
        async getNewdexQuote(eosAmount) {
            await fetch('https://api.newdex.io/v1/depth?symbol=eosio.token-tlos-eos')
                .then(res => res.json())
                .then((data) => {
                    var asks = data.data.asks;
                    asks.sort((a, b) => {
                        if (a[0] < b[0]) {
                            return -1;
                        }

                        return 1;
                    });
                    var tlosTotal = 0;
                    var eosLeft = eosAmount;
                    for (var i = 0; i < asks.length; i++) {
                        var eosPrice = asks[i][0];
                        var tlosAmount = asks[i][1];
                        var eosSpendable = eosPrice * tlosAmount;
                        var toSpend = eosLeft < eosSpendable ? eosLeft : eosSpendable;
                        tlosTotal += toSpend / eosPrice;
                        eosLeft -= toSpend;
                        if (eosLeft < 0) {
                            throw new Error('Overspend!!!');
                        }

                        if (eosLeft === 0) {
                            break;
                        }
                    }
                    this.getAmount = tlosTotal.toFixed(4);
                    this.exchangeRate = (
                        parseFloat(this.buyAmountValue) / tlosTotal
                    ).toFixed(4);
                    this.calculating -= 1;
                });
        },
    },
    watch: {
        showBuyAmountDlg: function(val, oldVal) {
            if (val) {
                this.coinInput = false;
                this.buyAmount = '0';
            } else if (!this.showHistoryDlg) {
                this.$emit('update:selectedCoin', null);
            }
        },
        buyAmount: function(val, oldVal) {
            setInterval(() => {
                const widthElement = this.$refs.widthElement;
                this.inputWidth = widthElement ? widthElement.clientWidth + 5 : 50;
            }, 1);

            if (this.buyAmount !== oldVal) {
                if (this.coinInput && this.buyAmountValue > this.selectedCoin.amount) {
                    this.buyAmount = this.selectedCoin.amount.toString();
                } else if (val.charAt(val.length - 1) !== '.') {
                    const cleanStr = val.replace(/\s/g, '');
                    const num = parseFloat(cleanStr) || 0;
                    const maxValue = Math.max(0, num);
                    if (this.buyAmountValue !== maxValue) {
                        this.buyAmount = Math.max(0, num).toString();
                    }
                }

                if (!this.coinInput) {
                    if (this.buyAmountValue >= 20) {
                        this.calculating += 1;
                        this.getMoonpayQuote();
                    } else {
                        this.exchangeRate = 0;
                        this.getAmount = 0;
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

    <!-- Body -->
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
                        {{ $t('components.buy') }}  {{ selectedCoin.symbol }}
                    </div>
                    <div ></div>
                </div>

                <!-- Body Information -->
                <div class="text-center">
                    <q-avatar size="5rem" class="">
                        <img :src="selectedCoin.icon" >
                    </q-avatar>
                    <div class="column text-center q-pt-sm ">
                        <div class="full-width column ">
                            <label
                                ref="widthElement"
                                :style="
                                    `display: fit-content; visibility: hidden; position: absolute; font-size: ${amountFontSize}px;`
                                "
                            >
                                {{ buyAmount }}
                            </label>
                            <div class="desktop-only flex flex-center">
                                <label
                                    class="text-weight-small "
                                    :style="`font-size: 1.4rem; color: white;`"
                                >
                                    {{ coinInput ? `` : "$ " }}
                                </label>
                                <input
                                    v-model="buyAmount"
                                    type="text"
                                    :class="
                                        `text-weight-regular ${
                                            coinInput ? 'text-right' : 'text-left'
                                        } no-border no-outline transparent`
                                    "
                                    :style="
                                        `font-size: 3rem; color: white; z-index: 1; width: ${inputWidth}px;`
                                    "
                                    @focus="buyAmount = buyAmount === '0' ? '' : buyAmount"
                                    @blur="
                                        buyAmount = Number(
                                            buyAmount === '' ? '0' : buyAmount
                                        ).toString()
                                    "
                                >
                                <label
                                    class="text-weight-regular q-ml-sm"
                                    :style="
                                        `font-size: ${amountFontSize}px;`
                                    "
                                >
                                    {{ coinInput ? selectedCoin.symbol : "" }}
                                </label>
                            </div>
                            <label
                                class="text-weight-regular full-width mobile-only"
                                :style="
                                    `font-size: ${amountFontSize}px;`
                                "
                            >
                                {{
                                    coinInput
                                        ? `${buyAmount} ${selectedCoin.symbol}`
                                        : `$${buyAmount}`
                                }}
                            </label>
                            <div v-if="calculating > 0" class="q-pt-md">
                                <q-spinner color="primary" size="3em" :thickness="5" />
                            </div>
                            <div v-else>
                                <label class="text-subtitle1 text-weight-medium text-white">
                                    {{$t('components.rate')}}:
                                    {{
                                        coinInput
                                            ? `$ ${getFixed(
                                                buyAmountValue * selectedCoin.price,
                                                8
                                            )}`
                                            : `$${getFixed(exchangeRate, 4)} USD/${
                                                selectedCoin.symbol
                                            }`
                                    }} </label><br >
                                <label class="text-subtitle1 text-weight-medium text-white">
                                    {{$t('components.total')}}:
                                    {{
                                        coinInput
                                            ? `$ ${getFixed(
                                                buyAmountValue * selectedCoin.price,
                                                8
                                            )}`
                                            : `${getFixed(getAmount, selectedCoin.precision)} ${
                                                selectedCoin.symbol
                                            }`
                                    }}
                                </label>
                            </div>
                        </div>

                        <!-- Keyboard -->
                        <div class="self-center keypad  q-py-md mobile-only">
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

                        <!-- Information -->
                        <div class="row justify-center text-left q-my-md">
                            <q-expansion-item
                                class="infoBox "
                                label="Buy with Card"
                                icon="fas fa-info-circle"
                            >
                                <div class="col text-justify q-pa-md ">
                                    {{$t('components.to_moonpay_text')}}
                                </div>
                            </q-expansion-item>
                        </div>
                        <q-btn
                            class="self-center  purpleGradient text-white text-subtitle2 nextBtn flex-center"
                            flat
                            no-caps
                            label="Next"
                            :disable="buyAmountValue === 0"
                            @click="buyPressed()"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</q-dialog>
</template>

<style scoped>

.infoBox {
  background-color: #0000002a;
  flex: 0 1 300px;
}

</style>
