<template>
  <div class="full-height main-div" :style="'background: linear-gradient(to bottom, #130C3F, #8946DF 200%)'">
    <div class="flex-center fit-div">
      <div class="text-center full-width" style="display: grid; grid-gap: 1rem">
        <login-button v-if="isAuthenticated" style="display:none"/>

<!-- Profile Image top left -->
        <div>
          <q-item class="userAvatar">
            <q-avatar class="profileImg  userAvatar" >
            <img url="~assets/camera.png">
          </q-avatar>
          <!-- <input type="file" ref="fileInput" accept="image/*"
            style="display: none" @change="onFilePicked"
          /> -->
        </q-item>

<!-- Account Name -->
        <label 
          class="text-white"
          :style="`height: ${accountNameStyle.height}px; opacity: ${accountNameStyle.opacity}; margin-bottom: 5px;`"
        >
          {{accountName}}
        </label>
        </div>

<!-- Account Amount -->
        <div class="full-width items-center balance-div">
          <div class="full-width" ></div>
          <div class="full-width" >
            <label class="text-weight-small text-white" :style="`font-size: ${balanceTextSize}px;`">
              ${{getFixed(parseInt(displayAmount), 0)}}.{{displayAmount.toFixed(2).slice(-2)}}
            </label>
          </div>
          <div class="full-width text-right">
            <q-btn
              round
              flat
              icon="qr_code_scanner"
              size="10px"
              class="text-white q-mr-md"
              :style="`background-color: #0002; opacity: ${qrcodeOpacity};`"
              @click="showQRScannerDlg = true"
            />
          </div>
        </div>

<!-- Action Buttons -->
        <div class="flex-center" :style="`display:flex; height: ${accountNameStyle.height * 0.5}px;`">
          <div class="balanceBtn">
            <q-btn stretch flat no-caps label="Send" @click="showSendDlg = true"/>  
          </div>
          <div class="qrCodeBtn">
            <q-btn stretch flat icon="qr_code_scanner" style="width: 40px; color: #FFFFFF; margin-bottom: 1rem; margin-top: 1rem;" @click="showQRScannerDlg = true"/>
          </div>
          <div class="balanceBtn">
            <q-btn stretch flat no-caps label="Receive" @click="showReceiveDlg = true"/>
          </div>
          <!-- <q-toolbar v-if="accountNameStyle.opacity > 0" class="text-white main-toolbar" :style="`opacity: ${accountNameStyle.opacity};`"> -->
            <!-- <q-separator dark vertical class="main-toolbar-sperator"/> -->
            <!-- <q-separator dark vertical class="main-toolbar-sperator"/> -->
          <!-- </q-toolbar> -->
        </div>

<!-- Convert Coins -->
    <div class="flex-center" :style="`display:flex; height: ${accountNameStyle.height * 3}px;`">
        <q-item
        clickable
        v-ripple
        class="convertBtns"
        @click="clickExchange()"
      >
        <q-item-section avatar>
          <q-avatar size="45px" class="q-my-sm">
            <!-- <img src="~assets/telos-swap.png"> -->
          </q-avatar>
        </q-item-section>
        
        <q-item-section >
          <div class="text-white text-left">
            <!-- <label class="text-subtitle1 text-weight-medium text-white h-20 self-end wraplabel">Convert</label> -->
            <!-- <label class="text-subtitle2 text-grey-5 wraplabel">From one crypto to another</label> -->
          </div>
        </q-item-section>
      </q-item>

<!-- Purchase Coins -->
      <q-item
        clickable
        v-ripple
        class="purchaseBtns"
        @click="clickPurchase()"
      >
        <q-item-section avatar>
          <q-avatar size="45px" class="q-my-sm">
            <!-- <img src="~assets/telos-buy.png"> -->
          </q-avatar>
        </q-item-section>
        
        <q-item-section >
          <div class="text-black text-left ">
            <!-- <label class="text-subtitle1 text-weight-medium text-white h-20 self-end wraplabel">Purchase crypto</label> -->
            <!-- <label class="text-subtitle2 text-weight-small text-grey-5 wraplabel">Purchase TLOS</label> -->
          </div>
        </q-item-section>
      </q-item>
    </div>
        
      </div>
    </div>

<!-- Coin Header -->
    <div :style="`height: ${coinViewHeight}px; text-align: -webkit-center;`">
      <!-- <div class="bar" :style="`background: ${themeColor}`"/> -->
      <q-layout
        view="hhh Lpr fFf"
        container
        class="shadow-4 coinview"
        :style="`width: auto; max-width: auto;`">
        <q-header class="coin-header flex-center" >
          <q-tabs
            v-model="tab"
            dense
            align="center"
            wide-indicator
            active-color="white"
            class=" text-white shadow-2 full-height no-shadow"
            style="min-width: 250px; background: #39276A"
          >
            <q-tab
              no-caps
              v-for="tab in tabs"
              :name="tab.title"
              :label="tab.label"
              :key="tab.title"
            />
          </q-tabs>
        </q-header>

        <q-page-container>
          <q-page v-touch-pan.vertical.prevent.mouse="handlePan">
            <q-tab-panels v-model="tab" animated class="coinviewGrid">
              <q-tab-panel name="Coins" class="no-padding" :style="'background: linear-gradient(to bottom, #6D659F55 -20%, #FFFFFF11 0%)'">
                <Coin
                  :coins="coins"
                  :coinLoadedAll="coinLoadedAll"
                  :showHistoryDlg.sync="showHistoryDlg"
                  :showExchangeDlg.sync="showExchangeDlg"
                  :showBuyAmountDlg.sync="showBuyAmountDlg"
                  :selectedCoin.sync="selectedCoin"
                  :suggestTokens="suggestTokens"
                />
              </q-tab-panel>
              <q-tab-panel name="Collectables" :style="'background: linear-gradient(to bottom, #6D659F55 -20%, #FFFFFF11 0%)'">
                <Collectables
                  :nftTokenTags="nftTokenTags"
                  :nftTokenLoadedAll="nftTokenLoadedAll"
                  :coinViewHeight="coinViewHeight"
                  :loadNftTokenTags="loadNftTokenTags"
                />
              </q-tab-panel>
            </q-tab-panels>
          </q-page>
        </q-page-container>
      </q-layout>
      
      <div class="q-pr-none text-white absolute full-width"
        :style="`bottom: ${footerHeight}px;`"
      >
        <q-banner
          v-if="$root.oldtEVMBalance !== tEVMBalance && tEVMBalance"
          inline-actions
          dense
          :style="`background: ${themeColor}; max-width: 800px; margin: auto;`"
        >
          <div :style="`font-size:16px; `">
            <marquee behavior="scroll" direction="left" style="vertical-align: bottom;">
              {{getFixed(tEVMBalance, 4)}} TLOS recieved from tEVM!
            </marquee>
          </div>
          <template v-slot:action>
            <q-btn
              class=""
              :style="`color: ${themeColor};`"
              no-caps
              size="12px"
              label="Withdraw Now"
              @click="withdrawEVM"
            />
            <q-btn
              round flat dense
              size="12px"
              icon="close"
              @click="$root.oldtEVMBalance = getCurrenttEVMBalance()"
            />
          </template>
        </q-banner>
      </div>
      <div v-if="tEVMWithdrawing"
        class="justify-center absolute flex full-width full-height"
        style="background: rgba(0, 0, 0, 0.4);"
      >
        <q-spinner-dots class="q-my-auto" color="primary" size="40px" />
      </div>
    </div>
    <History
      :showHistoryDlg.sync="showHistoryDlg"
      :selectedCoin.sync="selectedCoin"
      :showSendAmountDlg.sync="showSendAmountDlg"
      :showShareAddressDlg.sync="showShareAddressDlg"
      :showBuyAmountDlg.sync="showBuyAmountDlg"
      :showExchangeDlg.sync="showExchangeDlg"
    />
    <Exchange
      :showExchangeDlg.sync="showExchangeDlg"
      :selectedConvertCoin.sync="selectedCoin"
      :coins="coins"
    />
    <Send
      :showSendDlg.sync="showSendDlg"
      :coins="coins"
      :selectedCoin.sync="selectedCoin"
      :showSendAmountDlg.sync="showSendAmountDlg"
    />
    <Receive
      :showReceiveDlg.sync="showReceiveDlg"
      :coins="coins"
      :selectedCoin.sync="selectedCoin"
      :showShareAddressDlg.sync="showShareAddressDlg"
    />
    <SendAmount
      :showSendAmountDlg.sync="showSendAmountDlg"
      :showHistoryDlg="showHistoryDlg"
      :selectedCoin.sync="selectedCoin"
    />
    <BuyAmount
      :showBuyAmountDlg.sync="showBuyAmountDlg"
      :showHistoryDlg="showHistoryDlg"
      :selectedCoin.sync="selectedCoin"
    />
    <ShareAddress
      :showShareAddressDlg.sync="showShareAddressDlg"
      :selectedCoin="selectedCoin"
    />
    <QRScanner
      :showQRScannerDlg.sync="showQRScannerDlg"
      :coins="coins"
    />
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import moment from 'moment';
import LoginButton from 'components/LoginButton.vue';
import Coin from './components/balance/Coin';
import Collectables from './components/balance/Collectables';
import Send from './components/balance/Send';
import SendAmount from './components/balance/SendAmount';
import Receive from './components/balance/Receive';
import BuyAmount from './components/balance/BuyAmount';
import ShareAddress from './components/balance/ShareAddress';
import QRScanner from './components/balance/QRScanner';
import History from './components/balance/History';
import Exchange from './components/balance/Exchange';

const tabsData = [
  {
    title: 'Coins',
    caption: 'Coins',
    label: 'Coins',
  },
  {
    title: 'Collectables',
    caption: 'Collectables',
    label: 'Collectables',
  },
];

export default {
  props: ['loadedCoins', 'loadedNftTokens'],
  components: {
    LoginButton,
    Coin,
    Collectables,
    Send,
    SendAmount,
    Receive,
    BuyAmount,
    ShareAddress,
    QRScanner,
    History,
    Exchange,
  },
  data() {
    return {
      coins: [{
        account: 'eosio.token',
        name: 'Telos',
        symbol: 'TLOS',
        amount: 0,
        price: 0.0,
        precision: 4,
        suggested: true,
      }],
      nftTokenItems: {},
      nftTokenTags: [],
      nftAccounts: [
        'tlos.tbond',
        'marble.code',
      ],
      nftScopes: [
        0,
        0,
      ],
      displayAmount: 0,
      nftTagLoading: false,
      coinLoadedAll: false,
      nftTokenLoadedAll: false,
      panning: false,
      coinViewHeight: 0,
      tab: tabsData[0].title,
      tabs: tabsData,
      userTokens: {},
      interval: null,
      tokenInterval: null,
      selectedCoin: null,
      showSendDlg: false,
      showSendAmountDlg: false,
      showReceiveDlg: false,
      showShareAddressDlg: false,
      showBuyAmountDlg: false,
      showQRScannerDlg: false,
      showHistoryDlg: false,
      showExchangeDlg: false,
      tEVMBalance: 0,
      tEVMWithdrawing: false,
    };
  },
  computed: {
    ...mapGetters('account', ['isAuthenticated', 'accountName']),
    ...mapGetters('global', ['footerHeight', 'minSpace', 'maxSpace', 'supportTokens', 'suggestTokens']),
    totalAmount() {
      return this.coins.map(coin => coin.amount * coin.price).reduce((a, b) => a + b, 0);
    },
    availableHeight() {
      return window.innerHeight - (this.isAuthenticated ? this.footerHeight : 0);
    },
    coinViewMargin() {
      return (this.availableHeight - this.coinViewHeight - this.minSpace) * 0.1;
    },
    balanceTextSize() {
      return Math.min(35, (this.availableHeight - this.coinViewHeight) * 0.25);
    },
    accountNameStyle() {
      return {
        opacity: Math.max(0, (this.balanceTextSize - 15) * 0.05),
        height: Math.max(0, (this.balanceTextSize - 15) * 1),
      };
    },
    qrcodeOpacity() {
      return 1 - Math.max(0, (this.balanceTextSize - 15) * 0.1);
    },
    chainName() {
      return this.$ual.authenticators[0].keycatMap[this.$ual.authenticators[0].selectedChainId].config.blockchain.name;
    },
  },
  methods: {
    handlePan({ evt, ...info }) {
      this.coinViewHeight -= info.delta.y;
      this.coinViewHeight = Math.min(this.availableHeight - this.minSpace, Math.max(this.availableHeight - this.maxSpace, this.coinViewHeight));
      if (info.isFirst) {
        this.panning = true;
      } else if (info.isFinal) {
        this.panning = false;
      }
    },
    async getUserTokens() {
      await fetch(`https://www.api.bloks.io/telos${this.chainName === 'telos' ? '' : '-test'}/account/${this.accountName}?type=getAccountTokens&coreSymbol=TLOS`)
        .then(resp => resp.json())
        .then(data => {
          this.userTokens = { data, status: 200 };
        });
    },
    async loadUserTokens() {
      // const userCoins = await this.$hyperion.get(`/v2/state/get_tokens?account=${this.accountName}`);
      const settings = {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({code: "eosio.token", account: this.accountName, symbol: "TLOS"})
      };
      await fetch(`https://${this.chainName === 'telos' ? '' : 'testnet.'}telos.caleos.io/v1/chain/get_currency_balance`, settings)
        .then(resp => resp.json())
        .then(data => {
          if (data.length > 0) {
            this.coins[0].amount = parseFloat(data[0].split(' TLOS')[0]);
          }
        });

      const coins = this.userTokens;
      if (coins.status === 200) {
        coins.data.tokens.forEach((token) => {
          const tokenIndex = this.coins.findIndex(coin => coin.symbol.toLowerCase() === (token.symbol || token.currency).toLowerCase());
          if (tokenIndex >= 0) {
            this.coins[tokenIndex].amount = token.amount || 0;
            this.coins[tokenIndex].precision = token.decimals;
          }
        });
      }

      await fetch(`https://www.api.bloks.io/telos/tokens`)
        .then(response => response.json())
        .then(json => {
          json.forEach((token) => {
            if (token.chain !== 'telos') {
              if (token.chain === 'eos') {
                const coinIndex = this.coins.findIndex(coin => coin.symbol === token.symbol);
                if (coinIndex >= 0 && this.coins[coinIndex].price === 0) {
                  this.coins[coinIndex].price = token.price.usd;
                }
              }
            } else if (token.metadata.name === 'Telos') {
              this.coins[0].price = token.price.usd;
            } else if (token.symbol !== 'TLOS') {
              const coinIndex = this.coins.findIndex(coin => coin.symbol === token.symbol);
              if (coinIndex >= 0 && token.price.usd !== 0) {
                this.coins[coinIndex].price = token.price.usd;
              }
            }
          });
        });

      const sortCoin = function (suggestTokens) {
        return function (a, b) {
          if (!suggestTokens.includes(a.symbol.toLowerCase()) || !suggestTokens.includes(b.symbol.toLowerCase())) {
            if (suggestTokens.includes(a.symbol.toLowerCase())) return -1;
            if (suggestTokens.includes(b.symbol.toLowerCase())) return 1;
          }
          let aAmount = a.amount * a.price + (a.amount > 0 ? 1 : 0);
          let bAmount = b.amount * b.price + (b.amount > 0 ? 1 : 0);
          return bAmount - aAmount;
        }
      }
      this.coins = this.coins.sort(sortCoin(this.suggestTokens));
      this.$emit('update:loadedCoins', this.coins);
    },
    async loadNftTokenItems() {
      for (const account of this.nftAccounts) {
        await this.loadNftTokenItemssPerAccount(account);
      }
    },
    async loadNftTokenItemssPerAccount(nftAccount) {
      const tagData = await this.$store.$api.getTableRows({
        code: nftAccount,
        index_position: 1,
        json: true,
        key_type: "",
        limit: "1000",
        lower_bound: null,
        reverse: false,
        scope: nftAccount,
        show_payer: false,
        table: "items",
        table_key: "",
        upper_bound: null
      });
      this.nftTokenItems[nftAccount] = tagData.rows.filter(row => row.owner === this.accountName);
    },
    async loadNftTokenTags() {
      for (const account of this.nftAccounts) {
        if (this.nftTokenItems[account]) {
          await this.loadNftTokenTagsPerAccount(account);
        }
      }
    },
    async loadNftTokenTagsPerAccount(nftAccount) {
      if (this.nftTagLoading) {
        return;
      }
      this.nftTagLoading = true;
      const index = this.nftAccounts.findIndex(account => account === nftAccount);
      let foundFirstData = false;
      let count = 10;

      while(count > 0) {
        if (this.nftScopes[index] >= this.nftTokenItems[nftAccount].length) {
          break;
        }
        const tagData = await this.$store.$api.getTableRows({
          code: nftAccount,
          index_position: 1,
          json: true,
          key_type: "",
          limit: "100",
          lower_bound: null,
          reverse: false,
          scope: `${this.nftTokenItems[nftAccount][this.nftScopes[index]].serial}`,
          show_payer: false,
          table: "tags",
          table_key: "",
          upper_bound: null
        });
        if (tagData.rows.length == 0) {
          if (foundFirstData) {
            break;
          }
          this.nftScopes[index] += 1;
        } else {
          if (nftAccount === 'tlos.tbond') {
            const title = tagData.rows.find(row => row.tag_name === 'title').content;
            const image = tagData.rows.find(row => row.tag_name === 'image').content;
            this.nftTokenTags.push({
              title: title,
              image: image,
            });
          } else if (nftAccount === 'marble.code') {
            const data = JSON.parse(tagData.rows.find(row => row.tag_name === 'data').content);
            this.nftTokenTags.push({
              title: data.ti,
              image: data.dt,
            });
          }
          this.$emit('update:loadedNftTokens', this.nftTokenTags);
          foundFirstData = true;
          this.nftScopes[index] += 1;
          count -= 1;
        }
      }
      this.nftTagLoading = false;
    },
    getCurrenttEVMBalance() {
      if (this.$root.tEVMAccount) {
        const balanceStr = this.$root.tEVMAccount.balance.toString();
        const strLength = balanceStr.length;
        return parseFloat(`${balanceStr.substring(0, strLength - 18)}.${balanceStr.substring(strLength - 18, strLength)}`) || 0;
      }
      return 0;
    },
    async withdrawEVM() {
      // this.tEVMWithdrawing = true;
      const quantityStr = `${this.getFixed(this.getCurrenttEVMBalance(), 4).replace(',', '')} ${'TLOS'}`;
      let actions = [];
      actions.push({
        account: process.env.EVM_CONTRACT,
        name: 'withdraw',
        data: {
          to: this.accountName.toLowerCase(),
          quantity: quantityStr,
        }
      });
      const transaction = await this.$store.$api.signTransaction(actions);
      if (transaction) {
        this.$q.notify({
          type: 'primary',
          message: `Successfully withdrew ${quantityStr} from ${this.$root.tEVMAccount.address}`,
        });
        this.oldtEVMBalance = this.getCurrenttEVMBalance();
      } else {
        this.$q.notify({
          type: 'negative',
          message: `Failed to withdraw ${quantityStr} from ${this.$root.tEVMAccount.address}`,
        });
      }
      this.tEVMWithdrawing = false;
    }
  },
  created: async function() {
    this.interval = setInterval(() => {
      if (!this.panning) {
        if (this.coinViewHeight < this.availableHeight - (this.minSpace + this.maxSpace) * 0.5
          && this.coinViewHeight > this.availableHeight - this.maxSpace) {
          this.coinViewHeight = this.coinViewHeight - 3;
        } else if (this.coinViewHeight >= this.availableHeight - (this.minSpace + this.maxSpace) * 0.5
          && this.coinViewHeight < this.availableHeight - this.minSpace){
          this.coinViewHeight = this.coinViewHeight + 3;
        }
        const approxViewHeight = Math.min(this.availableHeight - this.minSpace, Math.max(this.availableHeight - this.maxSpace, this.coinViewHeight));
        if (this.coinViewHeight != approxViewHeight) {
          this.coinViewHeight = approxViewHeight;
        }
      }
      this.displayAmount = this.totalAmount - (this.totalAmount - this.displayAmount) * 0.98;
    }, 10);

    if (this.chainName === 'telos') {
      await this.loadNftTokenItems();
      this.loadNftTokenTags();
    }

    if (this.loadedCoins.length > 0) {
      this.coins = this.loadedCoins;
      this.coinLoadedAll = true;
    } else {
      this.coins.length = 1;
      await fetch(`https://www.api.bloks.io/telos/tokens`)
        .then(response => response.json())
        .then(json => {
          json.forEach((token) => {
            if (token.chain !== 'telos') {
            } else if (token.metadata.name === 'Telos') {
              this.coins[0].price = token.price.usd;
              this.coins[0].icon = token.metadata.logo;
            } else if (token.symbol !== 'TLOS') {
              const precisionSplit = token.supply.circulating.toString().split('.');
              this.coins.push({
                account: token.account.toLowerCase(),
                name: token.metadata.name,
                symbol: token.symbol,
                amount: 0,
                price: token.price.usd,
                icon: token.metadata.logo,
                precision: precisionSplit.length > 1 ? precisionSplit[1].length : 0,
              });
            }
          });
        });
      this.getUserTokens().then(this.loadUserTokens());
    }

    this.coinLoadedAll = true;
    this.tokenInterval = setInterval(async () => {
      this.getUserTokens().then(this.loadUserTokens());
      try {
        this.$root.tEVMAccount = await this.$root.tEVMApi.telos.getEthAccountByTelosAccount(this.accountName);
        this.tEVMBalance = this.getCurrenttEVMBalance();
      } catch {
      }
    }, 5000);
  },
  beforeMount() {
    this.coinViewHeight = window.innerHeight - this.footerHeight - this.maxSpace;
  },
  mounted() {
    this.$root.$on('successfully_sent', (sendAmount, toAddress) => {
      this.showSendAmountDlg = false;
      this.showSendDlg = false;
    });
    this.$root.$on('qrcode_scanned', ({ accountName, coinName, networkType }) => {
      if (!this.selectedCoin) {
        this.$root.qrcode_accountName = accountName;
        this.$root.qrcode_networkType = networkType;
        this.selectedCoin = this.coins.find(coin => coin.name === coinName);
        this.showSendAmountDlg = true;
      }
    });
    this.$root.$on('show_qrscanner', () => {
      this.showQRScannerDlg = true;
    });
  },
  beforeDestroy() {
    if (this.interval) clearInterval(this.interval);
    if (this.tokenInterval) clearInterval(this.tokenInterval);
  },
};
</script>

<style scoped>
.main-div {
  background-color: #00000000;
  display: flex;
  flex-flow: column;  
}
.fit-div {
  background-color: #00000000;
  flex-grow: 1;
  display: flex;
}
.balance-div {
  background-color: #00000000;
  display: inline-flex;
  justify-content: space-between;
}
.main-toolbar {
  background-color: #0002;
  border-radius: 15px;
  width: 250px;
  height: 35px;
  min-block-size: auto;
}
.main-toolbar-sperator {
  background-color: #00000000;
  width: 2px;
  height: 20px;
  margin: auto;
}
.bar {  
  background-color: #00000000;
  width: 100%;
  height: 50px;
  position: absolute;
}
.coinview {
  background-color: #00000000;
  border-top-left-radius: 15px;
  border-top-right-radius: 15px;
  border-bottom-left-radius: unset;
  border-bottom-left-radius: unset;
}

.coinviewGrid{
  background-color: #00000000;
}
.coin-header {
  background-color: #13090900;
  height: 40px;
}

.balanceBtn{
  color: #FFFFFF;
  background: linear-gradient(120deg, #42b883, #8946DF);
  border-radius: 1rem;
  margin-bottom: 2rem;
  margin-right: 1rem;
  margin-left: 1rem;
  margin-top: 2rem;
  width: 8rem;
  height: 3rem;
  text-align: center;
  justify-content: center;
  align-content: center;
}

.backgroundGradient{
background: linear-gradient(to bottom, #130C3F, #8946DF 200%)
}

.purchaseBtns{
  background-image: url("~assets/Purchase.svg");
  height: 1rem;
  width: 8rem;
  border: none;
  border-radius: 0%;
  padding: 0px;
  text-align: center;
  display: flex;
  outline:none;
  border: 0;
  background-repeat: no-repeat;
  margin-left: 10rem;
  margin-top: 2rem;
  margin-bottom: 1rem;
  
}

.convertBtns{
  display: flex;
  background-image: url("~assets/Convert.svg");
  height: 2rem;
  width: 8rem;
  border: none;
  border-radius: 0%;
  padding: 0px;
  display: flex;
  outline:none;
  border: 0;
  background-repeat: no-repeat;
  margin-left: 2rem;
  margin-top: 2rem;
  text-align: center;
  margin-bottom: 1rem;
}

.profileImg{
  background-image: url("~assets/camera.svg");
  text-align: center;
  display: inline-block;
  background-repeat: no-repeat;
  height: 3rem; 
  width: 3rem; 
  border-radius: 10rem;
  margin-top: 1rem; 
  margin-bottom:-1rem;
  margin-left: 2rem;

}
</style>