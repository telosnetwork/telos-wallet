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
              {{`${getFixed(sendAmount, selectedCoin.precision)} ${selectedCoin.symbol}`}}
            </label>
            <q-space/>
          </div>
        </q-header>
        <q-page-container>
          <div class="column" :style="`height: ${cardHeight}px;`">
            <q-list>
              <q-item class="list-item">
                <q-item-section side>To</q-item-section>
                <q-item-section class="to-address">{{toAddress}}</q-item-section>
              </q-item>
              <q-item v-if="networkType !== 'telos'"
                class="list-item">
                <q-item-section side class="text-weight-bold">Network Fee</q-item-section>
                <q-item-section></q-item-section>
                <q-item-section side>{{`$ 0.00`}}</q-item-section>
              </q-item>
              <q-item class="list-item">
                <q-item-section side class="text-weight-bold">Total</q-item-section>
                <q-item-section></q-item-section>
                <q-item-section side>{{`$ ${getFixed(sendAmount * selectedCoin.price, 8)}`}}</q-item-section>
              </q-item>
            </q-list>
            <div v-if="selectedCoin.symbol === 'TLOS' && networkType === 'ethereum'"
              class="text-caption text-grey-8 cursor-pointer text-center q-mt-xl"
              @click="copyToClipboard('0x7825e833D495F3d1c28872415a4aee339D26AC88')"
            >
              Ethereum Wallet users: to view TLOS balance in wallet, add TLOS with contract address: 0x7825e833D495F3d1c28872415a4aee339D26AC88
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
    <div v-if="sending"
      class="justify-center absolute flex"
      style="background: rgba(0, 0, 0, 0.4);"
    >
      <q-spinner-dots class="q-my-auto" color="primary" size="40px" />
    </div>
  </q-dialog>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import moment from 'moment';
import { networkInterfaces } from 'os';

export default {
  props: ['showSendConfirmDlg', 'selectedCoin', 'sendAmount', 'toAddress', 'notes', 'networkType'],
  data() {
    return {
      sending: false,
    };
  },
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
      this.sending = true;
      let actions = [];
      const quantityStr = `${parseFloat(this.sendAmount).toFixed(this.selectedCoin.precision)} ${this.selectedCoin.symbol}`;
      if (this.networkType === 'telos') {
        actions.push({
          account: this.selectedCoin.account,
          name: 'transfer',
          data: {
            from: this.accountName.toLowerCase(),
            to: this.toAddress,
            quantity: quantityStr,
            memo: this.notes
          }
        });
      } else if (this.networkType === 'tevm') {
        try {
          actions.push({
            account: this.selectedCoin.account,
            name: 'transfer',
            data: {
              from: this.accountName.toLowerCase(),
              to: process.env.EVM_CONTRACT,
              amount: parseFloat(parseFloat(this.sendAmount).toFixed(this.selectedCoin.precision)),
              quantity: quantityStr,
              symbol: this.selectedCoin.symbol,
              memo: this.notes
            }
          });
          const rawTrx = await this.$root.tEVMApi.transfer({
            account: this.accountName,
            sender: this.$root.tEVMAccount.address,
            to: this.toAddress,
            quantity: quantityStr,
            returnRaw: true,
          });
          actions.push({
            account: process.env.EVM_CONTRACT,
            name: 'raw',
            data: {
              ram_payer: this.accountName.toLowerCase(),
              tx: rawTrx,
              sender: this.$root.tEVMAccount.address.substring(2),
            }
          });
        } catch {
          this.$q.notify({
            type: 'negative',
            message: `Failed to send ${quantityStr} to ${this.toAddress}`,
          });
          this.sending = false;
          return;
        }
      } else if (this.networkType === 'ethereum') {
        actions.push({
          account: 'eosio.token',
          name: 'transfer',
          data: {
            from: this.accountName.toLowerCase(),
            to: 'xeth.ptokens',
            quantity: quantityStr,
            memo: this.toAddress
          }
        });
      } else if (this.networkType === 'ptoken') {
        actions.push({
          account: this.selectedCoin.account,
          name: 'redeem',
          data: {
            sender: this.accountName.toLowerCase(),
            memo: this.toAddress,
            quantity: quantityStr,
          }
        });
      }
      const transaction = await this.$store.$api.signTransaction(actions, `Send ${quantityStr} to ${this.toAddress}`);
      if (transaction) {
        if (transaction === 'needAuth') {
          this.$q.notify({
            type: 'negative',
            message: `Authentication is required`,
          });
        } else if (transaction !== 'cancelled') {
          this.$q.notify({
            type: 'primary',
            message: `${quantityStr} is sent to ${this.toAddress}`,
          });
          this.$root.$emit('successfully_sent', this.sendAmount, this.toAddress);
        }
      } else {
        this.$q.notify({
          type: 'negative',
          message: `Failed to send ${quantityStr} to ${this.toAddress}`,
        });
      }
      this.sending = false;
    },
    copyToClipboard(str) {
      var el = document.createElement('textarea');
      el.value = str;
      el.setAttribute('readonly', '');
      el.style = {display: 'none'};
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);

      this.$q.notify({
        type: 'primary',
        message: 'Copied it to the clipboard successfully',
      });
    },
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
.to-address {
  width: 0px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  padding-top: inherit;
  padding-bottom: inherit;
}
</style>