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
              <label class="text-subtitle1 text-weight-medium h-20">{{`${sendAmount} ${selectedCoin.symbol}`}}</label>
            </q-toolbar-title>
            <q-btn round flat dense v-close-popup class="text-grey-6" icon="west"/>
            <q-btn
              flat
              dense
              class="q-ml-auto q-mr-sm text-grey-6"
              label="Next"
              @click="nextPressed()"
            />
          </q-toolbar>
          <q-list>
            <q-item class="list-item">
              <q-item-section side>To:</q-item-section>
              <q-item-section>
                <q-input
                  v-model="toAddress"
                  dense
                  borderless
                  class="bg-grey-1 round-sm q-pl-sm"
                  :label="`username or ${selectedCoin.name} address`"
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
            <q-item class="list-item" :disable="networkType !== 'telos'">
              <q-item-section side>Notes:</q-item-section>
              <q-item-section>
                <q-input
                  v-model="notes"
                  :disable="networkType !== 'telos'"
                  dense
                  borderless
                  class="bg-grey-1 round-sm q-pl-sm"
                  label="notes"
                />
              </q-item-section>
            </q-item>
            
            <q-item v-if="isPToken" class="list-item q-pt-lg q-pb-none">
              <label class="text-center full-width">To Network</label>
            </q-item>
            <q-item v-if="isPToken" class="list-item -center">
              <q-btn-group class="full-width justify-center" push unelevated>
                <q-btn 
                  class="q-px-md"
                  push no-caps
                  label="Telos"
                  :style="`background: ${networkType === 'telos' ? 'rgb(220, 220, 220)' : 'rgb(245, 245, 245)'};`"
                  @click="networkType = 'telos'"
                />
                <q-btn
                  class="q-px-md"
                  push no-caps
                  label="Bitcoin"
                  :style="`background: ${networkType !== 'telos' ? 'rgb(220, 220, 220)' : 'rgb(245, 245, 245)'};`"
                  @click="networkType = 'ptoken'"
                />
              </q-btn-group>
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
    ...mapGetters('global', ['pTokens']),
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
      return this.pTokens.includes(this.selectedCoin.symbol.toLowerCase());
    },
  },
  methods: {
    ...mapActions('account', ['accountExists']),
    async nextPressed() {
      if (this.toAddress.length === 0) {
        this.$q.notify({
          type: 'dark',
          message: `Please fill the username or ${this.selectedCoin.name} address`,
        });
        return;
      }

      this.checking = true;
      if (this.networkType === 'ptoken') {
        if (this.selectedCoin.name === 'pTokens BTC') {
          const data = await fetch(`https://api.smartbit.com.au/v1/blockchain/address/${this.toAddress}`)
            .then(resp => resp.json());
          if (!data.success) {
            this.$q.notify({
              type: 'negative',
              message: `Address ${this.toAddress} does not exist`,
            });
            this.checking = false;
            return;
          }
        }
      } else {
        if (!(await this.accountExists(this.toAddress))) {
          this.$q.notify({
            type: 'negative',
            message: `Account ${this.toAddress} does not exist`,
          });
          this.checking = false;
          return;
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
    showSendToAddressDlg: function(val, oldVal) {
      if (val) {
        this.toAddress = this.$root.qrcode_accountName || '';
        this.networkType = this.$root.qrcode_networkType || 'telos';
        this.$root.qrcode_accountName = '';
        this.notes = '';
        this.checking = false;
      }
    },
    toAddress: function(val, oldVal) {
      if (isPToken) {
        if (this.selectedCoin.name === 'pTokens BTC' && this.toAddress.length >= 26) {
          this.networkType = 'ptoken';
        } else if (this.toAddress.length <= 12) {
          this.networkType = 'telos';
        }
      } else {
        this.networkType = 'telos';
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