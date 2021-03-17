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
              <label class="text-subtitle1 text-weight-medium h-20">{{`${getFixed(sendAmount, selectedCoin.precision)} ${selectedCoin.symbol}`}}</label>
            </q-toolbar-title>
            <q-btn round flat dense v-close-popup class="text-grey-6" icon="west"/>
            <q-btn
              flat
              dense
              class="q-ml-auto q-mr-sm text-grey-6"
              label="Next"
              :disable="networkType === 'ethereum' && (sendAmount * selectedCoin.price) < 100"
              @click="networkType === 'ethereum' && (sendAmount * selectedCoin.price) < 100 ? null : nextPressed()"
            />
          </q-toolbar>
          <q-list>
            <q-item v-if="isPToken" class="list-item q-pt-lg q-pb-none">
              <label class="text-center full-width">To Network</label>
            </q-item>
            <q-item v-if="isPToken" class="list-item -center">
              <q-btn-group class="full-width justify-center" push unelevated>
                <q-btn
                  v-for="(pTokenNetwork, key) of coinpTokenNetworks"
                  :key="pTokenNetwork"
                  class="q-px-md"
                  push no-caps
                  :label="pTokenNetwork"
                  :style="`background: ${networkType === key ? 'rgb(220, 220, 220)' : 'rgb(245, 245, 245)'};`"
                  @click="networkType = key"
                />
              </q-btn-group>
            </q-item>
            <q-item />
            <q-item class="list-item">
              <q-item-section side>To:</q-item-section>
              <q-item-section>
                <q-input
                  v-model="toAddress"
                  :value="toAddress.toLowerCase()"
                  dense
                  borderless
                  class="bg-grey-1 round-sm q-pl-sm"
                  :label="toPlaceHolder"
                />
              </q-item-section>
              <q-item-section side>
                <q-btn
                  round
                  flat
                  size="12px"
                  class="text-grey-5 q-mr-none"
                  icon="qr_code_scanner"
                  @click="showQRScanner()"
                />
              </q-item-section>
            </q-item>
            <q-item class="list-item" :disable="networkType === 'ptoken'">
              <q-item-section side>Notes:</q-item-section>
              <q-item-section>
                <q-input
                  v-model="notes"
                  :disable="networkType === 'ptoken' || networkType === 'ethereum'"
                  dense
                  borderless
                  class="bg-grey-1 round-sm q-pl-sm"
                  label="notes"
                />
              </q-item-section>
            </q-item>
            <q-item v-if="networkType === 'ethereum' && (sendAmount * selectedCoin.price) < 100"
              class="list-item items-center justify-center text-red-5 text-weight-bold"
            >
              <label>You can't send TLOS to Ethereum less than $100</label>
            </q-item>
            <q-item>
              <div v-if="checking" class="q-pt-md text-center full-width">
                <q-spinner class="q-my-md" color="primary" size="2em" :thickness="5" /><br/>
                Checking {{networkType === 'telos' ? 'Account' : 'Address'}}
              </div>
            </q-item>
          </q-list>
        </q-header>
        <q-page-container>
          <q-list>
            <q-item-label header class="text-center"> </q-item-label>
          </q-list>
        </q-page-container>
      </q-layout>
    </q-card>
    <SendConfirm
      :showSendConfirmDlg.sync="showSendConfirmDlg"
      :selectedCoin="selectedCoin"
      :sendAmount="sendAmount"
      :toAddress="toAddress"
      :notes="notes"
      :networkType="networkType"
    />
  </q-dialog>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import moment from 'moment';
import SendConfirm from './SendConfirm';

export default {
  props: ['showSendToAddressDlg', 'selectedCoin', 'sendAmount'],
  data() {
    return {
      toAddress: '',
      notes: '',
      showSendConfirmDlg: false,
      networkType: 'telos',
      checking: false,
    }
  },
  components: {
    SendConfirm,
  },
  computed: {
    ...mapGetters('account', ['isAuthenticated', 'accountName']),
    ...mapGetters('global', ['pTokens', 'pTokenNetworks']),
    showDlg: {
      get() {
        return this.showSendToAddressDlg;
      },
      set(value) {
        this.$emit('update:showSendToAddressDlg', value);
      },
    },
    isPToken() {
      if (!this.selectedCoin) {
        return false;
      }
      if (!this.pTokens.includes(this.selectedCoin.symbol.toLowerCase())) {
        return false;
      }
      return Object.keys(this.coinpTokenNetworks).length > 1;
    },
    toPlaceHolder() {
      if (this.networkType === 'telos') {
        return 'Username or Telos address';
      }
      return `${this.pTokenNetworks[this.selectedCoin.symbol.toLowerCase()][this.networkType]} address`;
    },
    chainName() {
      return this.$ual.authenticators[0].keycatMap[this.$ual.authenticators[0].selectedChainId].config.blockchain.name;
    },
    coinpTokenNetworks() {
      const networks = {};
      for (const key in this.pTokenNetworks[this.selectedCoin.symbol.toLowerCase()]) {
        if (key !== 'tevm' || this.chainName !== 'telos') {
          networks[key] = this.pTokenNetworks[this.selectedCoin.symbol.toLowerCase()][key];
        }
      }
      return networks;
    }
  },
  methods: {
    ...mapActions('account', ['accountExists']),
    async nextPressed() {
      if (this.toAddress.length === 0) {
        this.$q.notify({
          type: 'dark',
          message: `Please fill the ${this.toPlaceHolder}`,
        });
        return;
      }

      this.checking = true;
      if (this.networkType === 'telos') {
        if (!(await this.accountExists(this.toAddress))) {
          this.$q.notify({
            type: 'negative',
            message: `Account ${this.toAddress} does not exist`,
          });
          this.checking = false;
          return;
        }
      } else if (this.networkType === 'tevm' || this.networkType === 'ethereum') {
        if (this.toAddress.length !== 42 || !this.toAddress.startsWith('0x')) {
          this.$q.notify({
            type: 'negative',
            message: `Address ${this.toAddress} is not valid`,
          });
          this.checking = false;
          return;
        }
      } else if (this.networkType === 'ptoken') {
        if (this.selectedCoin.name === 'pTokens ETH') {
          if (this.toAddress.length !== 42 || !this.toAddress.startsWith('0x')) {
            this.$q.notify({
              type: 'negative',
              message: `Address ${this.toAddress} is not valid`,
            });
            this.checking = false;
            return;
          }
        } else if (this.selectedCoin.name === 'pTokens BTC') {
          const data = await fetch(`https://api.smartbit.com.au/v1/blockchain/address/${this.toAddress}`)
            .then(resp => resp.json());
          if (!data.success) {
            this.$q.notify({
              type: 'negative',
              message: `Address ${this.toAddress} is not valid`,
            });
            this.checking = false;
            return;
          }
        }
      }

      this.checking = false;
      this.showSendConfirmDlg = true;
    },
    showQRScanner() {
      this.$root.$emit('show_qrscanner');
    }
  },
  mounted() {
    this.$root.$on('successfully_sent', (sendAmount, toAddress) => {
      this.showSendConfirmDlg = false;
    });
    this.$root.$on('qrcode_scanned', ({ accountName, coinName, networkType }) => {
      if (this.showSendToAddressDlg) {
        if (this.selectedCoin && coinName !== this.selectedCoin.name) {
          this.$q.notify({
            type: 'dark',
            message: `Please scan with correct token`,
          });
        } else {
          this.toAddress = accountName;
          this.networkType = networkType;
        }
      }
    });
  },
  watch: {
    showSendToAddressDlg: async function(val, oldVal) {
      if (val) {
        this.toAddress = this.$root.qrcode_accountName || '';
        this.networkType = this.$root.qrcode_networkType || 'telos';
        this.$root.qrcode_accountName = '';
        this.notes = '';
        this.checking = false;
      }
    },
    toAddress: function(val, oldVal) {
      if (this.networkType === 'telos') {
        this.toAddress = this.toAddress.toLowerCase();
      }
    },
    networkType: function(val, oldVal) {
      if (val === 'telos') {
        this.toAddress = this.toAddress.toLowerCase();
      } else if (val === 'tevm') {
        if (!this.$root.tEVMAccount) {
          this.$q.notify({
            type: 'dark',
            message: `Please generate your tEVM address`,
          });
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