<template>
  <div class="full-height main-div">
    <div class="flex-center fit-div" :style="`background: ${themeColor}`">
      <div class="text-center full-width" style="display: grid;">
        <login-button v-if="isAuthenticated"/>
        <label
          class="text-white"
          :style="`height: ${accountNameStyle.height}px; opacity: ${accountNameStyle.opacity}; margin-bottom: 5px;`"
        >
          {{accountName}}
        </label>

        <div class="full-width items-center balance-div">
          <div class="full-width" ></div>
          <div class="full-width" >
            <label class="text-weight-medium text-white" :style="`font-size: ${balanceTextSize}px;`">
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

        <div class="flex-center" :style="`display:flex; height: ${accountNameStyle.height * 2}px;`">
          <q-toolbar v-if="accountNameStyle.opacity > 0" class="text-white main-toolbar" :style="`opacity: ${accountNameStyle.opacity};`">
            <q-btn stretch flat no-caps label="Send" @click="showSendDlg = true"/>
            <q-separator dark vertical class="main-toolbar-sperator"/>
            <q-btn stretch flat no-caps label="Receive" @click="showReceiveDlg = true"/>
            <q-separator dark vertical class="main-toolbar-sperator"/>
            <q-btn stretch flat icon="qr_code_scanner" style="width: 40px;" @click="showQRScannerDlg = true"/>
          </q-toolbar>
        </div>
      </div>
    </div>

    <div :style="`height: ${coinViewHeight}px; text-align: -webkit-center;`">
      <div class="bar" :style="`background: ${themeColor}`"/>
      <q-layout
        view="hhh Lpr fFf"
        container
        class="shadow-4 coinview"
        :style="`margin-left: ${coinViewMargin}px; margin-right: ${coinViewMargin}px; width: auto; max-width: 800px;`"
      >
        <q-header class="coin-header flex-center q-px-md transparent">
          <q-tabs
            v-model="tab"
            dense
            align="center"
            narrow-indicator
            active-color="deep-purple-10"
            class="bg-white text-grey shadow-2 full-height no-shadow"
            style="min-width: 250px;"
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
            <q-tab-panels v-model="tab" animated>
              <q-tab-panel name="Coins" class="no-padding">
                <Coin
                  :coins="coins"
                  :coinLoadedAll="coinLoadedAll"
                  :showHistoryDlg.sync="showHistoryDlg"
                  :showDepositEVMDlg.sync="showDepositEVMDlg"
                  :showWithdrawEVMDlg.sync="showWithdrawEVMDlg"
                  :showExchangeDlg.sync="showExchangeDlg"
                  :showBuyAmountDlg.sync="showBuyAmountDlg"
                  :selectedCoin.sync="selectedCoin"
                  :suggestTokens="suggestTokens"
                />
              </q-tab-panel>
              <q-tab-panel name="Collectables">
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
    <DepositEVM
      :showDepositEVMDlg.sync="showDepositEVMDlg"
      :nativeTLOSBalance.sync="coins[0].amount"
      :haveEVMAccount.sync="this.$root.tEVMAccount && this.$root.tEVMAccount.address"
    />
    <WithdrawEVM
      :showWithdrawEVMDlg.sync="showWithdrawEVMDlg"
      :evmTLOSBalance.sync="coins[1].amount"
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
import BigNumber from 'bignumber.js';
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
import DepositEVM from './components/balance/DepositEVM';
import WithdrawEVM from './components/balance/WithdrawEVM';

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
    DepositEVM,
    WithdrawEVM,
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
      }, {
        account: 'eosio.token',
        name: 'Telos EVM',
        symbol: 'TLOS',
        amount: 0,
        price: 0.0,
        precision: 4,
        suggested: true,
        network: 'tevm',
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
      showDepositEVMDlg: false,
      showWithdrawEVMDlg: false,
      tEVMBalance: 0,
      tEVMWithdrawing: false,
    };
  },
  computed: {
    ...mapGetters('account', ['isAuthenticated', 'accountName']),
    ...mapGetters('global', ['footerHeight', 'minSpace', 'maxSpace', 'supportTokens', 'suggestTokens', 'pTokenNetworks']),
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
      const userCoins = await this.$hyperion.get(`/v2/state/get_tokens?account=${this.accountName}`);
      if (userCoins.status === 200) {
        const tokens = userCoins.data.tokens.filter((token) => {
          if (userCoins.data.tokens.filter(t => t.symbol === token.symbol).length > 1) {
            return token.contract.toLowerCase() === 'eosio.token';
          }
          return true;
        });
        userCoins.data.tokens.forEach((token) => {
          this.coins.forEach((coin) => {
            if (!coin.network && coin.symbol.toLowerCase() === token.symbol.toLowerCase() && coin.account === token.contract) {
              coin.amount = token.amount || 0;
              coin.precision = token.precision || 4;
            }
          });
        });
      }

      this.coins.forEach(async (coin) => {
        if (coin.network === 'tevm') {
          const evmAccount = await this.$root.tEVMApi.telos.getEthAccountByTelosAccount(this.accountName);
          coin.amount = BigNumber(evmAccount.balance.toString()).div(1e18).toFixed(4);
        }
      })

      await fetch(`https://www.api.bloks.io/telos/tokens`)
        .then(response => response.json())
        .then(json => {
          json.forEach((token) => {
            if (token.chain !== 'telos') {
              if (token.chain === 'eos' && token.key.includes('ptokens')) {
                this.coins.forEach((coin) => {
                  if (coin.symbol === token.symbol) {
                    coin.price = token.price.usd;
                  }
                });
              }
            } else if (token.metadata.name === 'Telos') {
              this.coins.forEach((coin) => {
                  if (coin.symbol === 'TLOS') {
                    coin.price = token.price.usd;
                  }
              });
              this.coins[0].price = token.price.usd;
            } else if (token.symbol !== 'TLOS') {
              if (!token.key.includes('ptokens')) {
                this.coins.forEach((coin) => {
                  if (coin.symbol === token.symbol) {
                    coin.price = token.price.usd;
                  }
                });
              }
            }
          });
        });

      const sortCoin = function (suggestTokens) {
        return function (a, b) {
          const aSymbol = a.symbol.toLowerCase();
          const bSymbol = b.symbol.toLowerCase();

          if (aSymbol === bSymbol) {
            if (a.network) {
              return 1;
            } else {
              return -1;
            }
          }

          if (aSymbol === 'tlos') {
            return -1;
          } else if (bSymbol === 'tlos') {
            return 1;
          }

          if (!suggestTokens.includes(aSymbol) || !suggestTokens.includes(bSymbol)) {
            if (suggestTokens.includes(aSymbol)) {
              return -1;
            }
            if (suggestTokens.includes(bSymbol)) {
              return 1;
            }
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
        return parseFloat(BigNumber(balanceStr).div(1e18).toFixed(4)) || 0;
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

      const transaction = await this.$store.$api.signTransaction(actions, `Withdraw ${quantityStr} from ${this.$root.tEVMAccount.address}`);

      if (transaction) {
        if (transaction === 'needAuth') {
          this.$q.notify({
            type: 'negative',
            message: `Authentication is required`,
          });
        } else if (transaction === 'error') {
          this.$q.notify({
            type: 'negative',
            message: `Withdraw failed. Make sure authentication is done correctly.`,
          });
        } else if (transaction !== 'cancelled') {
          this.$q.notify({
            type: 'primary',
            message: `Successfully withdrew ${quantityStr} from ${this.$root.tEVMAccount.address}`,
          });
          this.oldtEVMBalance = this.getCurrenttEVMBalance();
        }
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
      if (window.time && Date.now() / 1000 - window.time > 10 * 60) {
        location.reload();
      }
    }, 10);

    if (this.chainName === 'telos') {
      await this.loadNftTokenItems();
      this.loadNftTokenTags();
    }

    if (this.loadedCoins.length > 0) {
      this.coins = this.loadedCoins;
      this.coinLoadedAll = true;
    } else {
      this.coins.length = 2;
      await fetch(`https://www.api.bloks.io/telos/tokens`)
        .then(response => response.json())
        .then(json => {
          json.forEach((token) => {
            if (token.chain !== 'telos') {
            } else if (token.metadata.name === 'Telos') {
              this.coins.forEach((coin) => {
                if (coin.symbol === 'TLOS') {
                  coin.price = token.price.usd;
                  coin.icon = token.metadata.logo;
                }
              })
            } else if (token.symbol !== 'TLOS') {
              const precisionSplit = token.supply.circulating.toString().split('.');
              this.coins.push({
                account: token.account.toLowerCase(),
                name: token.metadata.name,
                symbol: token.symbol,
                amount: 0,
                price: 0,
                icon: token.metadata.logo,
                precision: precisionSplit.length > 1 ? precisionSplit[1].length : 0,
              });
              const tSymbol = token.symbol.toLowerCase();
              if (this.pTokenNetworks[tSymbol] && this.pTokenNetworks[tSymbol].tevm) {
                this.coins.push({
                account: token.account.toLowerCase(),
                name: token.metadata.name,
                symbol: token.symbol,
                amount: 0,
                price: 0,
                icon: token.metadata.logo,
                precision: precisionSplit.length > 1 ? precisionSplit[1].length : 0,
                network: 'tevm'
              });
              }
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
      window.time = Date.now() / 1000;
      if (!window.location.href.includes('localhost')) {
        console.clear();
        console.log("Don't try to use Inspector!");
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
    if (this.interval) {
      clearInterval(this.interval);
    }
    if (this.tokenInterval) {
      clearInterval(this.tokenInterval);
    }
  },
};
</script>

<style scoped>
.main-div {
  display: flex;
  flex-flow: column;
}
.fit-div {
  flex-grow: 1;
  display: flex;
}
.balance-div {
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
  width: 2px;
  height: 20px;
  margin: auto;
}
.bar {
  width: 100%;
  height: 50px;
  position: absolute;
}
.coinview {
  background-color: white;
  border-top-left-radius: 15px;
  border-top-right-radius: 15px;
  border-bottom-left-radius: unset;
  border-bottom-left-radius: unset;
}
.coin-header {
  height: 40px;
}
</style>
