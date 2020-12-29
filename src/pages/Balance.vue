<template>
  <div class="full-height main-div">
    <div class="flex-center bg-deep-purple fit-div">
      <div class="text-center full-width" style="display: grid;">
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
              ${{getFixed(coins.map(coin => coin.amount * coin.price).reduce((a, b) => a + b, 0), 4)}}
            </label>
          </div>
          <div class="full-width text-right">
            <q-btn round flat icon="qr_code_scanner" size="10px" class="text-white q-mr-md" :style="`background-color: #0002; opacity: ${qrcodeOpacity};`"/>
          </div>
        </div>

        <div class="flex-center" :style="`display:flex; height: ${accountNameStyle.height * 2}px;`">
          <q-toolbar v-if="accountNameStyle.opacity > 0" class="text-white main-toolbar" :style="`opacity: ${accountNameStyle.opacity};`">
            <q-btn stretch flat no-caps label="Send" @click="showSendDlg = true"/>
            <q-separator dark vertical class="main-toolbar-sperator"/>
            <q-btn stretch flat no-caps label="Receive" @click="showReceiveDlg = true"/>
            <q-separator dark vertical class="main-toolbar-sperator"/>
            <q-btn stretch flat icon="qr_code_scanner" style="width: 40px;"/>
          </q-toolbar>
        </div>
      </div>
    </div>

    <div :style="`height: ${coinViewHeight}px;`">
      <div class="bg-deep-purple bar"/>
      <q-layout
        view="hhh Lpr fFf"
        container
        class="shadow-4 coinview"
        :style="`margin-left: ${coinViewMargin}px; margin-right: ${coinViewMargin}px; width: auto;`"
      >
        <q-header class="coin-header flex-center bg-white" style="display: flex;">
          <q-tabs
            v-model="tab"
            dense
            align="center"
            narrow-indicator
            active-color="deep-purple-10"
            class="bg-white text-grey shadow-2 full-height no-shadow"
            style="width: 350px;"
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
                <Coin :coins="coins"/>
              </q-tab-panel>
              <q-tab-panel name="Collectibles">
                <Collectibles />
              </q-tab-panel>
            </q-tab-panels>
          </q-page>
        </q-page-container>
      </q-layout>
    </div>
    <Send :showSendDlg.sync="showSendDlg" :coins="coins" :selectedCoin.sync="selectedCoin" :showSendAmountDlg.sync="showSendAmountDlg"/>
    <Receive :showReceiveDlg.sync="showReceiveDlg" :coins="coins" :selectedCoin.sync="selectedCoin" :showShareAddressDlg.sync="showShareAddressDlg"/>
    <SendAmount :showSendAmountDlg.sync="showSendAmountDlg" :selectedCoin="selectedCoin"/>
    <ShareAddress :showShareAddressDlg.sync="showShareAddressDlg" :selectedCoin="selectedCoin"/>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import moment from 'moment';
import Coin from './components/balance/Coin';
import Collectibles from './components/balance/Collectibles';
import Send from './components/balance/Send';
import SendAmount from './components/balance/SendAmount';
import Receive from './components/balance/Receive';
import ShareAddress from './components/balance/ShareAddress';

const tabsData = [
  {
    title: 'Coins',
    caption: 'Coins',
    label: 'Coins',
  },
  {
    title: 'Collectibles',
    caption: 'Collectibles',
    label: 'Collectibles',
  },
];

export default {
  data() {
    return {
      coins: [],
      panning: false,
      coinViewHeight: 0,
      tab: tabsData[0].title,
      tabs: tabsData,
      interval: null,
      tokenInterval: null,
      selectedCoin: { amount: 0, symbol: 'TLOS' },
      showSendDlg: false,
      showSendAmountDlg: false,
      showReceiveDlg: false,
      showShareAddressDlg: false,
    };
  },
  components: {
    Coin,
    Collectibles,
    Send,
    SendAmount,
    Receive,
    ShareAddress,
  },
  computed: {
    ...mapGetters('account', ['isAuthenticated', 'accountName']),
    ...mapGetters('global', ['footerHeight', 'minSpace', 'maxSpace']),
    userAvatar() {
      if (this.avatar) return this.avatar;

      return 'https://images.squarespace-cdn.com/content/54b7b93ce4b0a3e130d5d232/1519987165674-QZAGZHQWHWV8OXFW6KRT/icon.png?content-type=image%2Fpng';
    },
    availableHeight() {
      return window.innerHeight - (this.isAuthenticated ? this.footerHeight : 0);
    },
    coinViewMargin() {
      return (this.availableHeight - this.coinViewHeight - this.minSpace) * 0.1;
    },
    balanceTextSize() {
      return (this.availableHeight - this.coinViewHeight) * 0.25;
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
    async loadUserTokens() {
      const coins = await this.$hyperion.get(`/v2/state/get_tokens?limit=20&account=${this.accountName}`);
      this.coins = [{
        name: 'Telos',
        symbol: 'TLOS',
        amount: coins.data.tokens[0] ? coins.data.tokens[0].amount : 0,
        price: 0.16,
        icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/4660.png',
        suggested: true,
      }, {
        name: 'Bitcoin',
        symbol: 'BTC',
        amount: 0,
        price: 25241.54,
        icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png',
      }, {
        name: 'Ethereum',
        symbol: 'ETH',
        amount: 0,
        price: 625.32,
        icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
      }];
      await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${this.coins.map(coin => coin.name).join('%2C')}&vs_currencies=usd`)
        .then(resp => resp.json())
        .then(data => {
          this.coins = this.coins.map(coin => ({ price: data[coin.name.toLowerCase()].usd, ...coin }));
        });
    },
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
    }, 10);
    this.tokenInterval = setInterval(() => {
      this.loadUserTokens();
    }, 5000);
    this.loadUserTokens();
  },
  beforeMount() {
    this.coinViewHeight = window.innerHeight - this.footerHeight - this.maxSpace;
  },
  mounted() {
    this.$root.$on('successfully_sent', (sendAmount, toAddress) => {
      this.showSendAmountDlg = false;
      this.showSendDlg = false;
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