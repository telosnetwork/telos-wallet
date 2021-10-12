<template>
  <q-dialog
    class="main-background"
    v-if="selectedCoin"
    v-model="showDlg"
    persistent
    :maximized="true"
    transition-show="slide-left"
    transition-hide="slide-right"
  >
    <q-card class="full-height main-card main-background" style="width: 100vw; margin: auto;">
      <q-layout
        view="hHh Lpr fff"
        class="shadow-4 coinview main-background-overlay"
      >

<!-- Header -->
        <q-header class="text-white q-pa-sm" style="background: #00000000 ">
          <q-toolbar class="no-padding">
            <q-toolbar-title class="absolute full-width no-padding text-center">
              <div class="display-grid">
                <!-- <label class="text-subtitle1 text-weight-medium h-20">{{`Receive ${selectedCoin.symbol}`}}</label> -->
                <label class="text-subtitle2 text-white">From Network</label>
                <!-- <label class="text-subtitle2 text-grey-4">Share your address</label> -->
              </div>
            </q-toolbar-title>
            <q-btn round flat dense v-close-popup class="text-white closebBtn" icon="west"/>
          </q-toolbar>
        </q-header>
      

<!-- Coin Image 1 -->
          <div class="row">
            <div class="absolute" style=" left: 55%;">
              <q-item-section avatar class="cryptoImg1">
                <q-avatar size="6rem">
                  <img :src="selectedCoin.icon">
                </q-avatar>
              </q-item-section>
              <img class="avatarBackground" src="~assets/avatarBackground.svg" style=" left: 50%;">
            </div>
  <!-- Coin Image 2 -->
            <div class="absolute" style=" left: 45%;">
              <q-item-section avatar class="cryptoImg2">
                <q-avatar size="6rem">
                  <img :src="selectedCoin.icon">
                </q-avatar>
              </q-item-section>
              <img class="avatarBackground2" src="~assets/avatarBackground.svg" style=" left: 45%;">
            </div>
          </div>

         <div class="row" style="margin-top: 100px">
          <div class="full-width items-center amount-div">
              <div class="full-width column text-center">
                <label class="amount">Amount</label>
                <label ref="widthElement" :style="`display: fit-content; visibility: hidden; position: absolute; font-size: ${amountFontSize}px;`">
                  {{ sendAmount }}
                </label>
                <div class="text-center row flex-center">
                  <input 
                    type="number"
                    :class="`text-weight-regular ${coinInput ? 'text-center' : 'text-center'} no-border no-outline transparent`"
                    :style="`font-size: 2rem; color: white; width: auto;`"
                    v-model="sendAmount"
                    @focus="sendAmount = (sendAmount === '0' ? '' : sendAmount)"
                    @blur="sendAmount = Number(sendAmount === '' ? '0' : sendAmount).toString()"
                  />
                  <label class="text-weight-regular q-ml-sm" :style="`font-size: 3rem; color: white`">
                    {{coinInput ? selectedCoin.symbol : ''}}
                  </label>
                </div>
                <label class="text-weight-regular full-width mobile-only" :style="`font-size: ${amountFontSize}px; color: ${themeColor}`">
                  {{coinInput ? `${sendAmount} ${selectedCoin.symbol}` : `$${sendAmount}`}}
                </label>
                <label class="text-subtitle1 text-weight-large text-white">
                  {{coinInput ? `$ ${getFixed(sendAmountValue * selectedCoin.price, 8)}` : `${getFixed(sendAmountValue / selectedCoin.price, selectedCoin.precision)} ${selectedCoin.symbol}`}}
                </label>
              </div>
              <!-- <div class="full-width text-right absolute"> -->
                <!-- <q-btn round flat icon="fas fa-sync" size="12px" class="text-grey-4 q-mr-sm" @click="changeCoinInput()" style="background: linear-gradient(120deg, #1DD1FE, #8946DF); margin-right:3rem"/> -->
              <!-- </div> -->
            </div>
            </div>
            <!-- <div v-if="isPToken" class="list-item q-pb-sm column qr-card text-center q-mx-auto q-my-md q-pa-sm no-shadow">  -->
              <!-- <label class="text-center full-width">From Network</label> -->
            <!-- </div> -->
            <!-- <div v-if="isPToken" class="list-item -center">
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
            </div> -->
            <q-space/>
            
            <!-- <div
              :class="networkType === 'telos' || networkType === 'ethereum' || !isAddressAvailable ?
                'text-h6' :
                'text-caption'"
              style="word-break: break-word;"
            >
              {{ displayAccountName }}
            </div> -->
            <!-- <div>({{selectedCoin.name}})</div> -->
            <!-- <div class="text-grey">Share address</div> -->
            <!-- <div v-if="networkType === 'ptoken' && awaiting" class="q-pt-md">
              <q-spinner color="primary" size="2em" :thickness="5" />
              Awaiting New Deposits...
            </div> -->
            <!-- <q-space/> -->
            <!-- <div v-if="networkType === 'tevm'" class="text-caption text-grey-8">
              Alert will display on balance screen when TLOS is recieved in your account
            </div> -->

<!-- Crypto Buttons -->
            <div v-if="isPToken" class="list-item -center">
              <q-btn-group class="full-width justify-center cryptoBtn" push unelevated>
                <q-btn 
                  v-for="(pTokenNetwork, key) of coinpTokenNetworks"
                  :key="pTokenNetwork"
                  class="q-px-md"
                  push 
                  no-caps
                  :label="pTokenNetwork"
                  :style="`background: ${networkType === key ? '#FFFFFF55' : '#FFFFFF22'}; 
                          color: ${networkType === 'key' ? 'grey' : 'white'};`"
                  @click="networkType = key"
                />
              </q-btn-group>

<!-- Generate New Address -->
              <q-btn
                v-if="networkType === 'ptoken' || (networkType === 'tevm' && !$root.tEVMAccount)"
                class="q-mt-sm text-weight-medium text-caption generateBtn flex-center"
                push no-caps
                :label="networkType === 'ptoken' ? 'Generate New Deposit Address' : 'Generate New Address'"
                :style="`visibility: ${networkType === 'telos' ? 'hidden' : ''}; display:flex;`"
                @click="networkType === 'ptoken' ? generateDepositAddress() : generateEVMAddress()"
              />
            </div>

            <div v-else-if="networkType === 'ptoken'" class="text-caption text-white">
              Any {{ selectedCoin.symbol.slice(1) }} deposit sent to this address will mint an equal number of
              p{{ selectedCoin.symbol.slice(1) }} tokens on the TELOS address: {{accountName}}
            </div>
            
        <div class="networkinfo flex-center" style="display:block;">

<!-- QRCode -->
          <div v-if="networkType === 'telos' || networkType === 'ethereum' || isAddressAvailable"
              class="cursor-pointer qrCode"
              @click="copyToClipboard(qrcodeData)"
            >
              <q-r-canvas
                :options="{data: qrcodeData, cellSize: 10}"
                style="width: 100px"
              />
          </div>

<!-- Username -->
            <q-item>
              <q-input
                v-model="username"
                class="round-sm full-width networkinfo" 
                label="Username or Telos address"
                dense 
                standout="bg-transparent text-white" 
                label-color="white" 
                color="white" 
                input-class="text-white"
              /> 
            </q-item>

<!-- Notes -->
            <q-item>
                <q-input
                v-model="notes"
                class="round-sm full-width text-white networkinfo" 
                label="Notes"
                dense
                standout="bg-transparent text-white" 
                label-color="white" 
                color="white" 
                input-class="text-white"
              /> 
            </q-item>
        </div>

<!-- Next Button -->
        <div class="networkinfo flex-center" style="display:flex;">
            <q-btn class="text-white text-subtitle2 q-mx-md nextBtn"
              :style="`height: 50px; background:linear-gradient(120deg, #1DD1FE, #8946DF); display:flex;`"
              flat
              no-caps
              label="Next"
              :disable="sendAmountValue === 0"
              @click="nextPressed()"
            />
          </div>
        <!-- <div class="text-center text-grey-6">Transactions may take a few minutes to complete</div> -->
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
      username: '',
      notes: ""
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
      }
      if (this.networkType === 'ptoken' && this.depositAddress.length > 0) {
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
    copyToClipboard(str) {
      const accountName = str.substring(0, str.lastIndexOf('('));
      var el = document.createElement('textarea');
      el.value = accountName;
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
/* .qr-card {
  width: 95%;
  border-radius: 20px;
} */

.closebBtn{
  border: 2px solid white;
}

.cryptoImg1{
  position: absolute;
  width: 6rem;
  height: 6rem;
  margin-top: 6rem;
  margin-left: 1rem;
  width: 6rem;
  height: 6rem;
}
.cryptoImg2{
  position: absolute;
  width: 0.5rem;
  height:0.5rem;
  margin-top: 8rem;
  margin-right: 3rem;
  margin-left: -5rem;
  
  }
  

.avatarBackground{
  display: flex;
  position: relative;
  left: 30%; 
  margin-left: -3.4rem;
  margin-top: 4.5rem;
  /* margin-bottom: -1rem; */
}

.avatarBackground2{
  display: flex;
  position: relative;
  left: -1rem; 
  margin-left:-6.6rem;
  margin-top: 4.3rem;
  width: 8rem;
  height: 8rem;
  /* margin-bottom: -1rem; */
}

.cryptoBtn{
  margin-top: 1rem;
}

.networkinfo{
  display:block;
  margin-left: 2rem;
  margin-right: 2rem;
  margin-top: 1rem;
}

.nextBtn{
  margin-top: 0.5rem;
  width: 600px;
  margin-bottom: 1rem;

}

.qrCode{
  float: right;
}

.amount-div {
  display: inline-flex;
  justify-content: space-between;
}

.amount{
  color: #fafafa;
  margin-top: 7rem;
  margin-bottom: 0.5rem;
  font-size: 1.5rem;
}

input[type="number"]::-webkit-outer-spin-button, input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}
 
input[type="number"] {
    -moz-appearance: textfield;
}

.generateBtn{
  background:linear-gradient(120deg, #1DD1FE, #8946DF) ;
  color: white;
  margin-top: 2rem;
  left: 50%;
  transform: translateX(-50%);
}

.main-background {
  background: #020039;
}

.main-background-overlay {
   background:  url("~assets/MainBG.svg");
   background-repeat: no-repeat;
   background-size: cover;
}

@media only screen and (min-width: 1000px) {
.networkinfo{
  display:block;
  margin-left: 10rem;
  margin-right: 10rem;
  margin-top: 1rem;
  
}
}
</style>