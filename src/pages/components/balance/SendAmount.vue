<template>
  <q-dialog
    v-model="showDlg"
    persistent
    :maximized="true"
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card v-if="selectedCoin" class="bg-white full-height" style="max-width: 800px; margin: auto;">
      <q-layout
        view="hhh Lpr fFf"
        container
        class="shadow-4 coinview"
      >
        <q-header class="bg-white text-grey-8 q-pa-sm">
          <q-toolbar class="no-padding">
            <q-toolbar-title class="absolute full-width no-padding text-center">
              <div class="display-grid">
                <label class="text-subtitle1 text-weight-medium h-20">Send</label>
                <label class="text-subtitle2 text-grey-4">{{`${getFixed(selectedCoin.amount, selectedCoin.precision)} ${selectedCoin.symbol} Available`}}</label>
              </div>
            </q-toolbar-title>
            <q-btn round flat dense v-close-popup class="text-grey-6" icon="close"/>
          </q-toolbar>
        </q-header>
        <q-page-container>
          <div class="column text-center" :style="`height: ${cardHeight}px;`">
            <q-space/>
            <div class="full-width items-center amount-div">
              <div class="full-width column">
                <label ref="widthElement" :style="`display: fit-content; visibility: hidden; position: absolute; font-size: ${amountFontSize}px;`">
                  {{ sendAmount }}
                </label>
                <div class="desktop-only flex flex-center">
                  <label class="text-weight-regular q-mr-sm" :style="`font-size: ${amountFontSize}px; color: ${themeColor}`">
                    {{coinInput ? `` : '$ '}}
                  </label>
                  <input 
                    type="text"
                    :class="`text-weight-regular ${coinInput ? 'text-right' : 'text-left'} no-border no-outline transparent`"
                    :style="`font-size: ${amountFontSize}px; color: ${themeColor}; z-index: 1; width: ${inputWidth}px;`"
                    v-model="sendAmount"
                    @focus="sendAmount = (sendAmount === '0' ? '' : sendAmount)"
                    @blur="sendAmount = Number(sendAmount === '' ? '0' : sendAmount).toString()"
                  />
                  <label class="text-weight-regular q-ml-sm" :style="`font-size: ${amountFontSize}px; color: ${themeColor}`">
                    {{coinInput ? selectedCoin.symbol : ''}}
                  </label>
                </div>
                <label class="text-weight-regular full-width mobile-only" :style="`font-size: ${amountFontSize}px; color: ${themeColor}`">
                  {{coinInput ? `${sendAmount} ${selectedCoin.symbol}` : `$${sendAmount}`}}
                </label>
                <label class="text-subtitle1 text-weight-medium text-grey-8">
                  {{coinInput ? `$ ${getFixed(sendAmountValue * selectedCoin.price, 8)}` : `${getFixed(sendAmountValue / selectedCoin.price, selectedCoin.precision)} ${selectedCoin.symbol}`}}
                </label>
              </div>
              <div class="full-width text-right absolute">
                <q-btn round flat icon="fas fa-sync" size="12px" class="text-grey-4 q-mr-sm" @click="changeCoinInput()"/>
              </div>
            </div>
            <q-space/>
            <q-space/>
            <div class="q-pa-sm full-width mobile-only">
              <div class="q-gutter-x-xs q-gutter-y-lg">
                <q-btn v-for="key in keyboard"
                  :key="key"
                  class="bg-white text-grey-8 q-mx-auto q-my-auto text-h5"
                  style="width: 30%; height: 60px;"
                  flat
                  :label="key"
                  @click="buttonClicked(key)"
                />
              </div>
            </div>
            <q-btn class="text-grey-5 text-subtitle2 q-mx-md"
              :style="`height: 50px; background: ${themeColor}`"
              flat
              no-caps
              label="Next"
              :disable="sendAmountValue === 0"
              @click="nextPressed()"
            />
          </div>
        </q-page-container>
      </q-layout>
    </q-card>
    <SendToAddress :showSendToAddressDlg.sync="showSendToAddressDlg" :selectedCoin="selectedCoin" :sendAmount="sendCoinAmount"/>
  </q-dialog>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import moment from 'moment';
import SendToAddress from './SendToAddress';
import { setInterval } from 'timers';
import { isNumber } from 'util';

export default {
  props: ['showSendAmountDlg', 'showHistoryDlg', 'selectedCoin'],
  data() {
    return {
      keyboard: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '←'],
      sendAmount: '0',
      coinInput: true,
      showSendToAddressDlg: false,
      inputWidth: 50,
    }
  },
  components: {
    SendToAddress,
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
    sendAmountValue() {
      return Number(this.sendAmount.replace(',', ''));
    },
    sendCoinAmount() {
      if (!this.selectedCoin) {
        return 0;
      }
      if (this.coinInput) {
        return this.sendAmountValue;
      }
      return this.getFixed(this.sendAmountValue / this.selectedCoin.price, this.selectedCoin.precision).replace(',', '');
    },
  },
  methods: {
    selectCoin(coin) {
      this.showShareAddressDlg = true;
      this.selectedCoin = coin;
    },
    changeCoinInput() {
      if (this.coinInput) {
        this.sendAmount = this.getFixed(this.sendAmountValue * this.selectedCoin.price, 8).replace(',', '');
      } else {
        this.sendAmount = this.getFixed(this.sendAmountValue / this.selectedCoin.price, this.selectedCoin.precision).replace(',', '');
      }
      
      this.coinInput = !this.coinInput;
      this.inputValue = `${!this.coinInput ? '$ ' : ''}${this.sendAmount}${this.coinInput ? ' ' + this.selectedCoin.symbol : ''}`;
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
      } else if (!this.coinInput && this.sendAmountValue > this.selectedCoin.amount * this.selectedCoin.price) {
        this.sendAmount = (this.selectedCoin.amount * this.selectedCoin.price).toString();
      }
    },
    nextPressed() {
      this.showSendToAddressDlg = true;
    },
  },
  mounted() {
    this.$root.$on('successfully_sent', (sendAmount, toAddress) => {
      this.showSendToAddressDlg = false;
    });
  },
  watch: {
    showSendAmountDlg: function(val, oldVal) {
      if (val) {
        this.coinInput = true;
        this.sendAmount = '0';
      } else if (!this.showHistoryDlg) {
        this.$emit('update:selectedCoin', null);
      }
    },
    sendAmount: function(val, oldVal) {
      setInterval(() => {
        const widthElement = this.$refs.widthElement;
        this.inputWidth = widthElement ? widthElement.clientWidth + 5 : 50;
      }, 1);

      if (this.sendAmount != oldVal) {
        if (this.coinInput && this.sendAmountValue > this.selectedCoin.amount) {
          this.sendAmount = this.selectedCoin.amount.toString();
        } else if (!this.coinInput && this.sendAmountValue > this.selectedCoin.amount * this.selectedCoin.price) {
          this.sendAmount = (this.selectedCoin.amount * this.selectedCoin.price).toString();
        } else if (val.charAt(val.length-1) !== '.') {
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

<style scoped>
.toolbar-title {
  position: absolute;
  text-align: center;
}
.amount-div {
  display: inline-flex;
  justify-content: space-between;
}
.list-item {
  border: 1px solid #fafafa;
  border-left: none;
  border-right: none;
}
.display-grid {
  display: grid;
}
.h-20 {
  height: 20px;
}
</style>