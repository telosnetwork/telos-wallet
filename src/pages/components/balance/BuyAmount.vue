<template>
  <q-dialog
    v-model="showDlg"
    persistent
    :maximized="true"
    transition-show="slide-up"
    transition-hide="slide-down"
  >
<!-- Body -->
    <q-card v-if="selectedCoin" class="full-height" style="max-width: auto; margin: auto; background: linear-gradient(to bottom, #130C3F, #8946DF 200%)">
      <q-layout
        view="hhh Lpr fFf"
        container
        class="shadow-4 coinview"
      >
<!-- Header-->
        <q-header class="text-white q-pa-sm" style="background: #180F46">
          <q-toolbar class="no-padding">
            <q-toolbar-title class="absolute full-width no-padding text-center">
              <div class="display-grid">
                <label class="text-subtitle1 text-weight-medium h-25">Buy {{selectedCoin.symbol}}</label>
              </div>
            </q-toolbar-title>
            <q-btn round flat dense v-close-popup class="text-white closebBtn" icon="close"/>
          </q-toolbar>
        </q-header>

<!-- Body Information -->
        <q-page-container class="flex-center">
          
          <div class="absolute" style=" left: 50%; margin-left:-3rem;">
            <q-item-section avatar class="cryptoImg">
              <q-avatar size="6rem">
                <img :src="selectedCoin.icon">
                <!-- <img :src="coin.icon"> -->
              </q-avatar>
            </q-item-section>
            <img class="avatarBackground" src="~assets/avatarBackground.svg">
          </div>
            
            <!-- <div style="position: relative; left: 0; top: 0; align-content: center;" >
              <q-item-section avatar class="cryptoImg">
                <q-avatar size="45px" class="q-my-sm">
                  <img src="coin.icon"> -->
                  <!-- <img :src="coin.icon"> -->
                <!-- </q-avatar>
              </q-item-section>
              <img class="cryptoImg" src="~assets/avatarBackground.svg">
              <img class="cryptoImg" src="~assets/avatarBackground.svg">
            </div> -->
          <div class="column text-center" :style="`height: ${cardHeight}px; display: grid;`">
            <div class="full-width items-center amount-div">
              <div class="full-width column">
                <label class="amount">Amount</label>
                <label ref="widthElement" :style="`display: fit-content; visibility: hidden; position: absolute; font-size: ${amountFontSize}px;`">
                  {{ buyAmount }}
                </label>
                <div class="desktop-only flex flex-center">
                  <label class="text-weight-small q-mr-sm" :style="`font-size: 1.4rem; color: white;`">
                    {{coinInput ? `` : '$ '}} </label>
                  <input type="text" :class="`text-weight-regular ${coinInput ? 'text-right' : 'text-left'} no-border no-outline transparent`"
                    :style="`font-size: 3rem; color: white; z-index: 1; width: ${inputWidth}px;`"
                    v-model="buyAmount"
                    @focus="buyAmount = (buyAmount === '0' ? '' : buyAmount)"
                    @blur="buyAmount = Number(buyAmount === '' ? '0' : buyAmount).toString()"
                  />
                  <label class="text-weight-regular q-ml-sm" :style="`font-size: ${amountFontSize}px; color: ${themeColor}`">
                    {{coinInput ? selectedCoin.symbol : ''}} </label>
                </div>
                <br>
                <label class="text-weight-regular full-width mobile-only" :style="`font-size: ${amountFontSize}px; color: ${themeColor}`">
                  {{coinInput ? `${buyAmount} ${selectedCoin.symbol}` : `$${buyAmount}`}}
                </label>
                <div v-if="calculating > 0" class="q-pt-md">
                  <q-spinner color="primary" size="3em" :thickness="5" />
                </div>
                <div v-else>
                  <label class="text-subtitle1 text-weight-medium text-white">
                    Rate: {{coinInput ? `$ ${getFixed(buyAmountValue * selectedCoin.price, 8)}` : `$${getFixed(exchangeRate, 4)} USD/${selectedCoin.symbol}`}}
                  </label><br/>
                  <label class="text-subtitle1 text-weight-medium text-white">
                    Total: {{coinInput ? `$ ${getFixed(buyAmountValue * selectedCoin.price, 8)}` : `${getFixed(getAmount, selectedCoin.precision)} ${selectedCoin.symbol}`}}
                  </label>
                </div>
              </div>
            </div>

<!-- Information -->
          <div>
            <div class="q-mx-lg text-white position: absolute; eosNextInf" style="left: 50%; margin-left:-8rem;">
              <img class="infoIcon" src="~assets/c-info 1.svg">
              By Clicking 'Next' you will be  using Moonpay to purchase 'EOS' which will be sent to a cross chain contract for exchange to TLOS on the Telos Network at the estimated rate. Do not alter the 'TO' or 'MEMO' field or risk losing your funds.
              <!-- <img class="infoTextBlock" src="~assets/Subtract.svg"> -->
            </div>
            <img class="infoTextBlock" style="left: 50%; margin-left:-11rem; margin-top: -10rem" src="~assets/Subtract.svg" >

<!-- Keyboard -->
            <div class="q-pa-sm full-width mobile-only">
              <div class="q-gutter-x-xs q-gutter-y-lg">
                <q-btn v-for="key in keyboard"
                  :key="key"
                  class="bg-white text-grey-8 q-mx-auto q-my-auto text-h5"
                  style="width: 30%; height: auto;"
                  flat
                  :label="key"
                  @click="buttonClicked(key)"
                />
              </div>
            </div>
           </div> 
<!-- Next Button -->
            <q-btn class="text-white text-subtitle2 q-mx-md nextButton"
              :style="`height: 50px;`"
              flat
              no-caps
              label="Next"
              :disable="buyAmountValue === 0"
              @click="buyPressed()"
            />
          </div>
        </q-page-container>
      </q-layout>
    </q-card>
  </q-dialog>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import moment from 'moment';
import { setInterval } from 'timers';
import { isNumber } from 'util';

export default {
  props: ['showBuyAmountDlg', 'showHistoryDlg', 'selectedCoin', 'coins',],
  data() {
    return {
      keyboard: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '←'],
      buyAmount: '0',
      exchangeRate: 0,
      getAmount: 0,
      coinInput: false,
      inputWidth: 50,
      calculating: 0,
    }
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
      return this.coins.filter(coin => coin.amount > 0 || this.suggestTokens.includes(coin.symbol.toLowerCase()));
    },
  },
  methods: {
    selectCoin(coin) {
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
          this.$q.notify({
            type: 'primary',
            message: `Minimum amount is $20`,
            position: 'top',
          });
        } else {
          this.goToMoonpayPage();
        }
      }
    },
    async goToMoonpayPage() {
      const urlToSign = `https://buy.moonpay.io?apiKey=pk_live_bLNjJYoA2bwYMs7ir72Tgb5jLyHrK&currencyCode=eos&walletAddress=tradefortlos&baseCurrencyCode=usd&walletAddressTag=${this.accountName}&baseCurrencyAmount=${this.buyAmountValue}`;
      var signatureRequest = new XMLHttpRequest();
      signatureRequest.open("POST", "https://api.telos.net/v1/trading/getMoonpaySwapUrl");

      signatureRequest.setRequestHeader('Content-type', 'application/json;charset=UTF-8');
      var requestBody = JSON.stringify({ urlToSign: urlToSign });

      signatureRequest.send(requestBody);

      signatureRequest.onload = function() {
        if (signatureRequest.readyState == 4 && signatureRequest.status == 200) {
          window.open(signatureRequest.responseText);
        } else {
          console.error(signatureRequest.responseText);
        }
      }
    },
    async getMoonpayQuote() {
      await fetch(`https://api.moonpay.io/v3/currencies/eos/buy_quote/?apiKey=pk_live_bLNjJYoA2bwYMs7ir72Tgb5jLyHrK&baseCurrencyAmount=${this.buyAmountValue}&extraFeePercentage=0&baseCurrencyCode=usd&enabledPaymentMethods=credit_debit_card,sepa_bank_transfer,gbp_bank_transfer,apple_pay`)
        .then(res => res.json())
        .then((data) => {
          this.getNewdexQuote(parseFloat(data.quoteCurrencyAmount));
        });
    },
    async getNewdexQuote(eosAmount) {
      await fetch("https://api.newdex.io/v1/depth?symbol=eosio.token-tlos-eos")
        .then(res => res.json())
        .then((data) => {
          var asks = data.data.asks;
          asks.sort((a, b) => {
            if (a[0] < b[0])
              return -1;

            return 1;
          });
          var tlosTotal = 0;
          var eosLeft = eosAmount;
          for (var i = 0; i < asks.length; i++) {
            var eosPrice = asks[i][0];
            var tlosAmount = asks[i][1];
            var eosSpendable = eosPrice * tlosAmount;
            var toSpend = eosLeft < eosSpendable ? eosLeft : eosSpendable;
            tlosTotal += (toSpend / eosPrice);
            eosLeft -= toSpend;
            if (eosLeft < 0)
              throw new Error("Overspend!!!");

            if (eosLeft == 0)
              break;
          }
          this.getAmount = tlosTotal.toFixed(4);
          this.exchangeRate = (parseFloat(this.buyAmountValue) / tlosTotal).toFixed(4);
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

      if (this.buyAmount != oldVal) {
        if (this.coinInput && this.buyAmountValue > this.selectedCoin.amount) {
          this.buyAmount = this.selectedCoin.amount.toString();
        } else if (val.charAt(val.length-1) !== '.') {
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

<style scoped>
.toolbar-title {
  position: absolute;
  text-align: center;
}
.amount-div {
  display: flex;
  margin-top: 8rem;
  /* justify-content: space-between; */
}
.list-item {
  /* border: 1px solid #fafafa; */
  border-left: none;
  border-right: none;
}
.display-grid {
  display: grid;
}
.h-25 {
  height: 25px;
}

.nextButton{
  position:relative;
  left:0%;
  right:50%;
  bottom:5%;
  top:40%;
  background: linear-gradient(120deg, #1DD1FE, #8946DF);
  height: 3rem;
  text-align: center;
}
.cryptoImg{
  position: absolute;
  width: 6rem;
  height: 6rem;
  margin-top: 1.5rem;
}

.avatarBackground{
  display: flex;
  position: relative;
  left: 50%; 
  margin-left:-4rem;
  /* margin-bottom: -1rem; */
}

.eosNextInf{
  display: flex;
  position: relative;
  left: 4rem;
  right: 3rem;
  margin-top: 3rem;
  margin-left: 4rem;
  text-align: justify;
  width: 20rem;
  height: auto;
  
  /* font-family: 'Silka'; */
  /* margin-bottom: 6rem; */
}

.infoTextBlock{
  display: flex;
  position: absolute;
  width: 24rem;
  height: auto;
}

.infoIcon{
 margin-left: -2.5rem;
 margin-right: 1rem;
 margin-top: -5rem;
 transform: translate(-50%, 50);
}

.amount{
  text-align: center;
  font-size: 1.2rem;
  margin-top: 1rem;
  color: white
}
.closebBtn{
  border: 2px solid white;
}


</style>