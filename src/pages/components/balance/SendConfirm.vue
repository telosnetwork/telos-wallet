<template>
  <q-dialog
    v-model="showDlg"
    persistent
    :maximized="true"
    transition-show="slide-left"
    transition-hide="slide-right"
  >
    <q-card class="bg-white full-height" style="max-width: 800px; margin: auto;">
      <q-layout
        view="hhh Lpr fFf"
        container
        class="shadow-4 coinview"
      >
        <q-header class="bg-white text-grey-8 q-pa-sm">
          <q-toolbar class="no-padding">
            <q-toolbar-title class="absolute full-width no-padding text-center">
              <label class="text-subtitle1 text-weight-medium h-20">Confirm Send</label>
            </q-toolbar-title>
            <q-btn round flat dense v-close-popup class="text-grey-6" icon="west"/>
          </q-toolbar>
          <div class="column text-center" style="height: 100px;">
            <q-space/>
            <label class="text-h5" :style="`font-size: ${amountFontSize}px; color: ${themeColor}`">
              {{`${sendAmount} ${selectedCoin.symbol}`}}
            </label>
            <q-space/>
          </div>
        </q-header>
        <q-page-container>
          <div class="column" :style="`height: ${cardHeight}px;`">
            <div>
              <q-list>
                <q-item class="list-item">
                  <q-item-section side>To</q-item-section>
                  <q-item-section>{{toAddress}}</q-item-section>
                </q-item>
                <q-item class="list-item">
                  <q-item-section side>Coinbase fee</q-item-section>
                  <q-item-section></q-item-section>
                  <q-item-section side>$0.00</q-item-section>
                </q-item>
                <q-item class="list-item">
                  <q-item-section side>Network fee</q-item-section>
                  <q-item-section></q-item-section>
                  <q-item-section side>{{`0.00 ${selectedCoin.symbol}`}}</q-item-section>
                </q-item>
                <q-item class="list-item">
                  <q-item-section side class="text-weight-bold">Total</q-item-section>
                  <q-item-section></q-item-section>
                  <q-item-section side>{{`$ ${getFixed(sendAmount * selectedCoin.price, 8)}`}}</q-item-section>
                </q-item>
              </q-list>
            </div>
            <q-space/>
            <q-btn class="text-grey-5 text-subtitle2 q-mx-md"
              :style="`height: 50px; background: ${themeColor}`"
              flat
              no-caps
              label="Confirm send"
              @click="confirm()"
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

export default {
  props: ['showSendConfirmDlg', 'selectedCoin', 'sendAmount', 'toAddress', 'notes'],
  computed: {
    ...mapGetters('account', ['isAuthenticated', 'accountName']),
    showDlg: {
      get() {
        return this.showSendConfirmDlg;
      },
      set(value) {
        this.$emit('update:showSendConfirmDlg', value);
      },
    },
    cardHeight() {
       return window.innerHeight - 200;
    },
  },
  methods: {
    amountFontSize() {
      return Math.min(50, window.innerWidth / (this.sendAmount.length + 1));
    },
    async confirm() {
      const actions = [{
        account: this.selectedCoin.account,
        name: 'transfer',
        data: {
          from: this.accountName.toLowerCase(),
          to: this.toAddress,
          quantity: `${parseFloat(this.sendAmount).toFixed(this.selectedCoin.precision)} ${this.selectedCoin.symbol}`,
          memo: this.notes
        }
      }];
      const transaction = await this.$store.$api.signTransaction(actions);
      if (transaction) {
        this.showTransaction = true;
        this.$q.notify({
          type: 'primary',
          message: `${parseFloat(this.sendAmount).toFixed(this.selectedCoin.precision)} ${this.selectedCoin.symbol} is sent to ${this.toAddress}`,
        });
        this.$root.$emit('successfully_sent', this.sendAmount, this.toAddress);
      }
    }
  },
};
</script>

<style scoped>
.toolbar-title {
  position: absolute;
  text-align: center;
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