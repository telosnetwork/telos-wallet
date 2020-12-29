<template>
  <q-dialog
    v-model="showDlg"
    persistent
    :maximized="true"
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="bg-white full-height">
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
                <label class="text-subtitle2 text-grey-4">{{`${selectedCoin.amount} ${selectedCoin.symbol} Available`}}</label>
              </div>
            </q-toolbar-title>
            <q-btn round flat dense v-close-popup icon="close"/>
          </q-toolbar>
        </q-header>
        <q-page-container>
          <div class="column text-center" :style="`height: ${cardHeight}px;`">
            <q-space/>
            <div class="full-width items-center amount-div">
              <div class="full-width column">
                <label class="text-weight-regular text-purple-10 full-width" :style="`font-size: ${amountFontSize}px`">
                  {{coinInput ? `${sendAmount} ${selectedCoin.symbol}` : `$${sendAmount}`}} </label>
                <label class="text-subtitle1 text-weight-medium text-grey-8">
                  {{coinInput ? `$ ${sendAmountValue * selectedCoin.price}` : `${sendAmountValue / selectedCoin.price} ${selectedCoin.symbol}`}}
                </label>
              </div>
              <div class="full-width text-right absolute">
                <q-btn round flat icon="fas fa-sync" size="12px" class="text-grey-4 q-mr-sm" @click="changeCoinInput()"/>
              </div>
            </div>
            <q-space/>
            <q-space/>
            <div class="q-pa-sm full-width">
              <div class="q-gutter-x-xs q-gutter-y-lg">
                <q-btn v-for="key in keyboard"
                  :key="key"
                  class="bg-white text-grey-8 q-mx-auto q-my-auto text-h5"
                  style="width: 30%; height: 60px;"
                  flat
                  :label="key"
                  @click="keyPressed(key)"
                />
              </div>
            </div>
            <q-btn class="bg-purple-10 text-grey-5 text-subtitle2 q-mx-md"
              style="height: 50px;"
              flat
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

export default {
  props: ['showSendCoinAmountDlg', 'selectedCoin'],
  data() {
    return {
      searchCoinName: '',
      keyboard: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '←'],
      sendAmount: '0',
      coinInput: true,
      showSendToAddressDlg: false,
    }
  },
  components: {
    SendToAddress,
  },
  computed: {
    ...mapGetters('account', ['isAuthenticated', 'accountName']),
    showDlg: {
      get() {
        return this.showSendCoinAmountDlg;
      },
      set(value) {
        this.$emit('update:showSendCoinAmountDlg', value);
      },
    },
    cardHeight() {
       return window.innerHeight - 100;
    },
    amountFontSize() {
      return Math.min(50, window.innerWidth / (this.sendAmount.length + 1) * 1);
    },
    sendAmountValue() {
      return Number(this.sendAmount);
    },
    sendCoinAmount() {
      if (this.coinInput) {
        return this.sendAmountValue;
      }
      return this.sendAmountVale / this.selectedCoin.price;
    },
  },
  methods: {
    selectCoin(coin) {
      this.showShareAddressDlg = true;
      this.selectedCoin = coin;
    },
    changeCoinInput() {
      if (this.coinInput) {
        this.sendAmount = (this.sendAmountValue * this.selectedCoin.price).toString();
      } else {
        this.sendAmount = (this.sendAmountValue / this.selectedCoin.price).toString();
      }
      this.coinInput = !this.coinInput;
    },
    keyPressed(key) {
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
      } else if (!this.coinInput && this.sendAmountValue > this.selectedCoin.amount * this.selectCoin.price) {
        this.sendAmount = (this.selectedCoin.amount * this.selectCoin.price).toString();
      }
    },
    nextPressed() {
      this.showSendToAddressDlg = true;
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