<template>
  <q-dialog
    v-if="selectedCoin"
    v-model="showDlg"
    persistent
    :maximized="true"
    transition-show="slide-left"
    transition-hide="slide-right"
  >
    <q-card class="full-height main-card" style="max-width: 800px; margin: auto;">
      <q-layout
        view="hHh Lpr fff"
        container
        class="shadow-4 coinview"
      >
        <q-header class="bg-white text-grey-8 q-pa-sm">
          <q-toolbar class="no-padding">
            <q-toolbar-title class="absolute full-width no-padding text-center">
              <div class="display-grid">
                <label class="text-subtitle1 text-weight-medium h-20">{{`Receive ${selectedCoin.symbol}`}}</label>
                <label class="text-subtitle2 text-grey-4">Share your address</label>
              </div>
            </q-toolbar-title>
            <q-btn round flat dense v-close-popup class="text-grey-6" icon="west"/>
          </q-toolbar>
        </q-header>
        <q-page-container>
          <q-card class="column qr-card text-center q-mx-auto q-my-md q-pa-sm no-shadow" :style="`height: ${cardHeight}px;`">
            <div v-if="isPToken" class="list-item q-pb-sm">
              <label class="text-center full-width">To Network</label>
            </div>
            <div v-if="isPToken" class="list-item -center">
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
              <q-btn
                class="q-mt-sm text-weight-medium text-caption"
                push no-caps
                label="Generate New Deposit Address"
                :style="`background: white; visibility: ${networkType === 'telos' ? 'hidden' : ''}`"
                @click="networkType === 'ptoken' ? generateDepositAddress() : null"
              />
            </div>
            <q-space/>
            <div v-if="networkType === 'telos' || depositAddress.length > 0">
              <q-r-canvas :options="{data: qrcodeData, cellSize: 10}" style="width: 120px"/>
            </div>
            <div
              :class="networkType === 'telos' || depositAddress.length === 0 ?
                'text-h6' :
                'text-caption'"
              style="word-break: break-word;"
            >
              {{
                networkType === 'telos' ?
                accountName :
                  (
                    depositAddress.length > 0 ?
                    depositAddress :
                    'Please Generate New Deposit Address'
                  )
              }}
            </div>
            <div>({{selectedCoin.name}})</div>
            <div class="text-grey">Share address</div>
            <div v-if="networkType === 'ptoken' && awaiting" class="q-pt-md">
              <q-spinner color="primary" size="2em" :thickness="5" />
              Awaiting New Deposits...
            </div>
            <q-space/>
            <div v-if="isPToken" class="text-caption text-grey-8">
              Any BTC deposit sent to this address will mint an equal number of pBTC tokens on the TELOS address: {{accountName}}
            </div>
          </q-card>
        </q-page-container>
        <div class="text-center text-grey-6">Transactions may take a few minutes to complete</div>
      </q-layout>
    </q-card>
  </q-dialog>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import moment from 'moment';
import { QRCanvas } from 'qrcanvas-vue';

export default {
  props: ['showShareAddressDlg', 'selectedCoin'],
  data() {
    return {
      searchCoinName: '',
      networkType: 'telos',
      depositAddress: '',
      metaData: {},
      awaiting: false,
    }
  },
  components: {
    QRCanvas,
  },
  computed: {
    ...mapGetters('account', ['isAuthenticated', 'accountName']),
    ...mapGetters('global', ['pTokens']),
    searchCoins() {
      return this.coins.filter((coin) => {
        return coin.name.toLowerCase().includes(this.searchCoinName.toLowerCase())
            || coin.symbol.toLowerCase().includes(this.searchCoinName.toLowerCase());
      });
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
        return `${this.accountName}(${this.selectedCoin.name})`;
      }
      return `${this.depositAddress}(${this.selectedCoin.name})`;
    },
    isPToken() {
      if (!this.selectedCoin) {
        return false;
      }
      return this.pTokens.includes(this.selectedCoin.symbol.toLowerCase());
    },
  },
  methods: {
    async generateDepositAddress() {
      this.awaiting = false;
      let ptokens = require("ptokens");
      let pBtcToken = new ptokens({
        pbtc: {
          blockchain: "Telos",
          network: "mainnet",
        },
      });

      let newAddress = await pBtcToken.pbtc.getDepositAddress(this.accountName);

      if (newAddress.value) {
        this.awaiting = true;
        this.depositAddress = newAddress.value;
        this.metaData[this.selectedCoin.symbol] = this.depositAddress;
        window.localStorage.setItem('metaData', JSON.stringify(this.metaData));
        this.$q.notify({
          type: 'primary',
          message: 'New Deposit Address is generated successfully',
        });
      }
    },
  },
  watch: {
    showShareAddressDlg: async function(val, oldVal) {
      if (val) {
        this.networkType = 'telos';
        this.metaData = JSON.parse(window.localStorage.getItem('metaData')) || {};
        this.depositAddress = this.metaData[this.selectedCoin.symbol] || '';
        if (this.depositAddress.length > 0) {
          this.awaiting = true;
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
.display-grid {
  display: grid;
}
.h-20 {
  height: 20px;
}
.main-card {
  background-image: linear-gradient(white, #f0f0f0);
}
.qr-card {
  width: 95%;
  border-radius: 20px;
}
</style>