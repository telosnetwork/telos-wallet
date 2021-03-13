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
              <label class="text-center full-width">From Network</label>
            </div>
            <div v-if="isPToken" class="list-item -center">
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
              <q-btn
                v-if="networkType === 'ptoken' || (networkType === 'tevm' && !$root.tEVMAccount)"
                class="q-mt-sm text-weight-medium text-caption"
                push no-caps
                :label="networkType === 'ptoken' ? 'Generate New Deposit Address' : 'Generate New Address'"
                :style="`background: white; visibility: ${networkType === 'telos' ? 'hidden' : ''}`"
                @click="networkType === 'ptoken' ? generateDepositAddress() : generateEVMAddress()"
              />
            </div>
            <q-space/>
            <div v-if="networkType === 'telos' || networkType === 'ethereum' || isAddressAvailable">
              <q-r-canvas :options="{data: qrcodeData, cellSize: 10}" style="width: 120px"/>
            </div>
            <div
              :class="networkType === 'telos' || networkType === 'ethereum' || !isAddressAvailable ?
                'text-h6' :
                'text-caption'"
              style="word-break: break-word;"
            >
              {{ displayAccountName }}
            </div>
            <div>({{selectedCoin.name}})</div>
            <div class="text-grey">Share address</div>
            <div v-if="networkType === 'ptoken' && awaiting" class="q-pt-md">
              <q-spinner color="primary" size="2em" :thickness="5" />
              Awaiting New Deposits...
            </div>
            <q-space/>
            <div v-if="networkType === 'tevm'" class="text-caption text-grey-8">
              Alert will display on balance screen when TLOS is recieved in your account
            </div>
            <div v-else-if="networkType === 'ptoken'" class="text-caption text-grey-8">
              Any {{ selectedCoin.symbol.slice(1) }} deposit sent to this address will mint an equal number of
              p{{ selectedCoin.symbol.slice(1) }} tokens on the TELOS address: {{accountName}}
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
import { pERC20 } from 'ptokens-perc20'
import pTokens from 'ptokens';

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
    ...mapGetters('global', ['pTokens', 'pTokenNetworks']),
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
      } else if (this.networkType === 'tevm') {
        return `${this.$root.tEVMAccount.address}(${this.selectedCoin.name})`;
      } else if (this.networkType === 'ethereum') {
        return `${this.accountName}(${this.selectedCoin.name})`;
      } else if (this.networkType === 'ptoken') {
        return `${this.depositAddress}(${this.selectedCoin.name})`;
      }
      return '';
    },
    displayAccountName() {
      if (this.networkType === 'telos') {
        return this.accountName;
      } else if (this.networkType === 'ethereum') {
        return this.accountName;
      } else if (this.networkType === 'tevm') {
        if (this.$root.tEVMAccount) {
          return this.$root.tEVMAccount.address;
        } else {
          return 'Please Generate New Address';
        }
      } else if (this.networkType === 'ptoken') {
        if (this.depositAddress.length > 0) {
          return this.depositAddress;
        } else {
          return 'Please Generate New Deposit Address';
        }
      }
      return '';
    },
    isAddressAvailable() {
      if (this.networkType === 'tevm' && this.$root.tEVMAccount) {
        return true;
      } else if (this.networkType === 'ptoken' && this.depositAddress.length > 0) {
        return true;
      }
      return false;
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
    chainName() {
      return this.$ual.authenticators[0].keycatMap[this.$ual.authenticators[0].selectedChainId].config.blockchain.name;
    },
    coinpTokenNetworks() {
      const networks = {};
      for (const key in this.pTokenNetworks[this.selectedCoin.symbol.toLowerCase()]) {
        if ((key !== 'tevm' && key !== 'ethereum') || this.chainName !== 'telos') {
          networks[key] = this.pTokenNetworks[this.selectedCoin.symbol.toLowerCase()][key];
        }
      }
      return networks;
    }
  },
  methods: {
    async generateEVMAddress() {
      let actions = [];
      actions.push({
        account: process.env.EVM_CONTRACT,
        name: 'create',
        data: {
          account: this.accountName,
          data: 'test',
        }
      });
      const transaction = await this.$store.$api.signTransaction(actions);
      if (transaction) {
        this.$q.notify({
          type: 'primary',
          message: `A new address is successfully created`,
        });
        this.$root.tEVMAccount = await this.$root.tEVMApi.telos.getEthAccountByTelosAccount(this.accountName);
        this.networkType = 'tevm';
      } else {
        this.$q.notify({
          type: 'negative',
          message: `Failed to create an address`,
        });
      }
    },
    async generateDepositAddress() {
      this.awaiting = false;
      let ptoken = new pTokens({
        pbtc: {
          blockchain: 'Telos',
          network: 'mainnet',
        },
        perc20: {
          blockchain: 'Telos',
          network: 'mainnet',
          pToken: 'pETH',
        },
      });

      let newAddress = null;
      if (this.selectedCoin.symbol.toLowerCase() === 'pbtc') {
        newAddress = await ptoken.pbtc.getDepositAddress(this.accountName);
      } else if (this.selectedCoin.symbol.toLowerCase() === 'tlos') {
        newAddress = await ptoken.peth.issue(10, this.accountName);
      } else {

      }

      if (newAddress.value) {
        this.awaiting = true;
        this.depositAddress = newAddress.value;
        this.metaData[this.selectedCoin.symbol] = this.depositAddress;
        window.localStorage.setItem('metaData', JSON.stringify(this.metaData));
        this.$q.notify({
          type: 'primary',
          message: 'New Deposit Address is generated successfully',
        });

        newAddress.waitForDeposit()
          .once('nativeTxBroadcasted', tx => {} )
          .once('nativeTxConfirmed', tx => {})
          .once('nodeReceivedTx', tx => {})
          .once('nodeBroadcastedTx', tx => {})
          .once('hostTxConfirmed', tx => {})
          .then(res => {
            this.$q.notify({
              type: 'primary',
              message: 'New Deposit is confirmed successfully',
            });
            this.awaiting = false;
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