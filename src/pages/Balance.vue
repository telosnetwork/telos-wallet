<template>
  <div class="row justify-center">
    <div style="width: 90vh">
      <div style="height: 100%; overflow:auto">
        <div class="text-center full-width">
          <login-button v-if="isAuthenticated" style="display:none" />

          <!-- Profile Image top left -->
          <q-avatar class="profileImg" @click="$router.push('/settings')">
            <img :src="userAvatar" />
          </q-avatar>
          <!-- Account Name -->
          <div
            class="text-white q-mt-xl"
            :style="`opacity: ${accountNameStyle.opacity};`"
          >
            {{ accountName }}
          </div>

          <!-- Account Amount -->
          <div class="full-width items-center balance-div row">
            <div class="full-width"></div>
            <div class="full-width">
              <label
                class="text-white items-center"
                :style="
                  `font-size: ${balanceTextSize}px; font-weight: 200; font-size: 50px; white-space: nowrap;`
                "
              >
                $ {{ getFixed(parseInt(displayAmount), 0) }}.{{
                  displayAmount.toFixed(2).slice(-2)
                }}
              </label>
            </div>
          </div>

          <!-- EVM address -->
          <div class="text-caption q-pt-sm">
            <q-btn
              v-if="!$root.tEVMAccount"
              no-caps
              rounded
              outline
              style="width: 12rem;"
              :label="'Generate EVM Address'"
              @click="generateEVMAddress()"
            />
            <q-btn v-else rounded outline>
              {{ $root.tEVMAccount.address }}
            </q-btn>
          </div>

          <!-- Action Buttons -->
          <div class="flex-center q-mt-lg q-mb-md" :style="`display:flex`">
            <q-btn
              class="balanceBtn purpleGradient text-subtitle2 flex-center"
              flat
              rounded
              no-caps
              label="Send"
              @click="showSendDlg = true"
            />
            <div @click="showQRScannerDlg = true" class="qrBtn q-mx-xs">
              <img src="~assets/icons/qr_scan.svg" />
            </div>
            <q-btn
              class="balanceBtn purpleGradient text-subtitle2 flex-center"
              flat
              rounded
              no-caps
              label="Receive"
              @click="showReceiveDlg = true"
            />
            <!-- <q-toolbar v-if="accountNameStyle.opacity > 0" class="text-white main-toolbar" :style="`opacity: ${accountNameStyle.opacity};`"> -->
            <!-- <q-separator dark vertical class="main-toolbar-sperator"/> -->
            <!-- <q-separator dark vertical class="main-toolbar-sperator"/> -->
            <!-- </q-toolbar> -->
          </div>

          <!-- Convert and Purchace -->
          <div class="row justify-center q-mb-md">
            <div class="convertBtn" @click="clickExchange()">
              <img src="~assets/Convert.svg" class="q-mr-xs" />
              Convert
            </div>
            <div class="purchaceBtn" @click="clickPurchase()">
              Purchase
              <img src="~assets/Purchase.svg" class="q-ml-xs" />
            </div>
          </div>
        </div>

        <q-tabs
          :value="balanceTab"
          @input="switchTab($event)"
          wide-indicator
          active-color="white"
          class=" text-white shadow-2 no-shadow"
          style="width: 100%; background: #00000000"
        >
          <q-tab
            no-caps
            v-for="tab in tabs"
            :name="tab.title"
            :label="tab.label"
            :key="tab.title"
            style="width: 50%; background: #00000000;"
          />
        </q-tabs>
        <q-tab-panels
          flat
          :value="balanceTab"
          @input="switchTab($event)"
          class="coinviewGrid"
        >
          <q-tab-panel
            flat
            name="Coins"
            class="no-padding"
            :style="'background: #00000000; border:0px;'"
          >
            <Coin
              flat
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
          <q-tab-panel name="Collectables" :style="'background:  #00000000'">
            <Collectables
              :nftTokenTags="nftTokenTags"
              :nftTokenLoadedAll="nftTokenLoadedAll"
              :coinViewHeight="coinViewHeight"
              :loadNftTokenTags="loadNftTokenTags"
            />
          </q-tab-panel>
        </q-tab-panels>
      </div>
      <div
        class="q-pr-none text-white absolute full-width"
        :style="`bottom: ${footerHeight}px;`"
      ></div>
      <div
        v-if="tEVMWithdrawing"
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
      :haveEVMAccount.sync="
        this.$root.tEVMAccount && this.$root.tEVMAccount.address
      "
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
    <QRScanner :showQRScannerDlg.sync="showQRScannerDlg" :coins="coins" />
  </div>
</template>

<script>
import BigNumber from "bignumber.js";
import { mapGetters, mapActions } from "vuex";
import moment from "moment";
import LoginButton from "components/LoginButton.vue";
import Coin from "./components/balance/Coin";
import Collectables from "./components/balance/Collectables";
import Send from "./components/balance/Send";
import SendAmount from "./components/balance/SendAmount";
import Receive from "./components/balance/Receive";
import BuyAmount from "./components/balance/BuyAmount";
import ShareAddress from "./components/balance/ShareAddress";
import QRScanner from "./components/balance/QRScanner";
import History from "./components/balance/History";
import Exchange from "./components/balance/Exchange";
import DepositEVM from "./components/balance/DepositEVM";
import WithdrawEVM from "./components/balance/WithdrawEVM";

const tabsData = [
  {
    title: "Coins",
    caption: "Coins",
    label: "Coins"
  },
  {
    title: "Collectables",
    caption: "Collectables",
    label: "Collectables"
  }
];

export default {
  props: ["loadedCoins", "loadedNftTokens", "balanceTab"],
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
    WithdrawEVM
  },
  data() {
    return {
      coins: [
        {
          account: "eosio.token",
          name: "Telos",
          symbol: "TLOS",
          amount: 0,
          price: 0.0,
          precision: 4,
          suggested: true
        },
        {
          account: "eosio.token",
          name: "Telos EVM",
          symbol: "TLOS",
          amount: 0,
          price: 0.0,
          precision: 4,
          suggested: true,
          network: "tevm"
        }
      ],
      nftTokenItems: {},
      nftTokenTags: [],
      nftScopes: [0, 0],
      displayAmount: 0,
      nftTagLoading: false,
      coinLoadedAll: false,
      nftTokenLoadedAll: false,
      panning: false,
      coinViewHeight: 0,
      tabs: tabsData,
      tab: "Coins",
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
      avatar: ""
    };
  },
  computed: {
    ...mapGetters("account", ["isAuthenticated", "accountName"]),
    ...mapGetters("global", [
      "footerHeight",
      "minSpace",
      "maxSpace",
      "supportTokens",
      "suggestTokens",
      "pTokenNetworks"
    ]),
    userAvatar() {
      if (this.avatar) return this.avatar;

      return "/profile/default_avatar.svg";
    },
    totalAmount() {
      return this.coins
        .map(coin => coin.amount * coin.price)
        .reduce((a, b) => a + b, 0);
    },
    availableHeight() {
      return (
        window.innerHeight - (this.isAuthenticated ? this.footerHeight : 0)
      );
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
        height: Math.max(0, (this.balanceTextSize - 15) * 1)
      };
    },
    qrcodeOpacity() {
      return 1 - Math.max(0, (this.balanceTextSize - 15) * 0.1);
    },
    chainName() {
      return this.$ual.authenticators[0].keycatMap[
        this.$ual.authenticators[0].selectedChainId
      ].config.blockchain.name;
    },
    nftAccounts() {
      if (this.chainName === "telos") {
        return ["tlos.tbond", "marble.code"];
      } else {
        return ["marbletessst"];
      }
    }
  },
  methods: {
    ...mapActions("account", ["accountExists", "getUserProfile"]),
    async loadUserProfile() {
      if (
        !this.$store.state.account.profiles.hasOwnProperty(this.accountName)
      ) {
        await this.getUserProfile(this.accountName);
      }
      const accountProfile = this.$store.state.account.profiles[
        this.accountName
      ];
      if (!accountProfile) {
        return;
      }

      this.avatar = accountProfile.avatar;
    },
    switchTab(val) {
      console.log("asdf");
      this.$emit("update:balanceTab", val);
    },
    clickPurchase() {
      // this.$emit('update:selectedCoin', this.coins.find(coin => coin.symbol === 'TLOS'));
      this.selectedCoin = this.coins.find(coin => coin.symbol === "TLOS");
      // this.$emit('update:showBuyAmountDlg', true);
      this.showBuyAmountDlg = true;
    },
    clickExchange() {
      console.log("Pina Colladas!!!", "Clicked me!!!!!");
      // this.$emit('update:showExchangeDlg', true); // not working anymore
      this.showExchangeDlg = true;
    },
    handlePan({ evt, ...info }) {
      this.coinViewHeight -= info.delta.y;
      // this.coinViewHeight = Math.min(this.availableHeight - this.minSpace, Math.max(this.availableHeight - this.maxSpace, this.coinViewHeight));
      if (info.isFirst) {
        this.panning = true;
      } else if (info.isFinal) {
        this.panning = false;
      }
    },
    async getUserTokens() {
      await fetch(
        `https://www.api.bloks.io/telos${
          this.chainName === "telos" ? "" : "-test"
        }/account/${this.accountName}?type=getAccountTokens&coreSymbol=TLOS`
      )
        .then(resp => resp.json())
        .then(data => {
          this.userTokens = { data, status: 200 };
        });
    },
    async loadUserTokens() {
      const userCoins = await this.$hyperion.get(
        `/v2/state/get_tokens?account=${this.accountName}`
      );
      if (userCoins.status === 200) {
        const tokens = userCoins.data.tokens.filter(token => {
          if (
            userCoins.data.tokens.filter(t => t.symbol === token.symbol)
              .length > 1
          ) {
            return token.contract.toLowerCase() === "eosio.token";
          }
          return true;
        });
        userCoins.data.tokens.forEach(token => {
          this.coins.forEach(coin => {
            if (
              !coin.network &&
              coin.symbol.toLowerCase() === token.symbol.toLowerCase() &&
              coin.account === token.contract
            ) {
              coin.amount = token.amount || 0;
              coin.precision = token.precision || 4;
            }
          });
        });
      }

      this.coins.forEach(async coin => {
        if (coin.network === "tevm") {
          const evmAccount = await this.$root.tEVMApi.telos.getEthAccountByTelosAccount(
            this.accountName
          );
          coin.amount = BigNumber(evmAccount.balance.toString())
            .div(1e18)
            .toFixed(4);
        }
      });

      await fetch(`https://www.api.bloks.io/telos/tokens`)
        .then(response => response.json())
        .then(json => {
          json.forEach(token => {
            if (token.chain !== "telos") {
              if (token.chain === "eos" && token.key.includes("ptokens")) {
                this.coins.forEach(coin => {
                  if (coin.symbol === token.symbol) {
                    coin.price = token.price.usd;
                  }
                });
              }
            } else if (token.metadata.name === "Telos") {
              this.coins.forEach(coin => {
                if (coin.symbol === "TLOS") {
                  coin.price = token.price.usd;
                }
              });
              this.coins[0].price = token.price.usd;
            } else if (token.symbol !== "TLOS") {
              if (!token.key.includes("ptokens")) {
                this.coins.forEach(coin => {
                  if (coin.symbol === token.symbol) {
                    coin.price = token.price.usd;
                  }
                });
              }
            }
          });
        });

      const sortCoin = function(suggestTokens) {
        return function(a, b) {
          const aSymbol = a.symbol.toLowerCase();
          const bSymbol = b.symbol.toLowerCase();

          if (aSymbol === bSymbol) {
            if (a.network) {
              return 1;
            } else {
              return -1;
            }
          }

          if (aSymbol === "tlos") {
            return -1;
          } else if (bSymbol === "tlos") {
            return 1;
          }

          if (
            !suggestTokens.includes(aSymbol) ||
            !suggestTokens.includes(bSymbol)
          ) {
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
        };
      };
      this.coins = this.coins.sort(sortCoin(this.suggestTokens));
      this.$emit("update:loadedCoins", this.coins);
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
      this.nftTokenItems[nftAccount] = tagData.rows.filter(
        row => row.owner === this.accountName
      );
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
      const index = this.nftAccounts.findIndex(
        account => account === nftAccount
      );
      let foundFirstData = false;
      let count = 10;

      while (count > 0) {
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
          scope: `${
            this.nftTokenItems[nftAccount][this.nftScopes[index]].serial
          }`,
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
          if (nftAccount === "tlos.tbond") {
            const title = tagData.rows.find(row => row.tag_name === "title")
              .content;
            const image = tagData.rows.find(row => row.tag_name === "image")
              .content;
            this.nftTokenTags.push({
              title: title,
              image: image
            });
          } else if (nftAccount === "marble.code") {
            const data = JSON.parse(
              tagData.rows.find(row => row.tag_name === "data").content
            );
            this.nftTokenTags.push({
              title: data.ti,
              image: data.dt
            });
          } else if (nftAccount === "marbletessst") {
            const data = JSON.parse(
              tagData.rows.find(row => row.tag_name === "data").content
            );
            this.nftTokenTags.push({
              title: data.ti,
              image: data.dt
            });
          }
          this.$emit("update:loadedNftTokens", this.nftTokenTags);
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
        return (
          parseFloat(
            BigNumber(balanceStr)
              .div(1e18)
              .toFixed(4)
          ) || 0
        );
      }
      return 0;
    },
    async withdrawEVM() {
      // this.tEVMWithdrawing = true;
      const quantityStr = `${this.getFixed(
        this.getCurrenttEVMBalance(),
        4
      ).replace(",", "")} ${"TLOS"}`;
      let actions = [];
      actions.push({
        account: process.env.EVM_CONTRACT,
        name: "withdraw",
        data: {
          to: this.accountName.toLowerCase(),
          quantity: quantityStr
        }
      });

      const transaction = await this.$store.$api.signTransaction(
        actions,
        `Withdraw ${quantityStr} from ${this.$root.tEVMAccount.address}`
      );

      if (transaction) {
        if (transaction === "needAuth") {
          this.$q.notify({
            type: "negative",
            message: `Authentication is required`
          });
        } else if (transaction === "error") {
          this.$q.notify({
            type: "negative",
            message: `Withdraw failed. Make sure authentication is done correctly.`
          });
        } else if (transaction !== "cancelled") {
          this.$q.notify({
            type: "primary",
            message: `Successfully withdrew ${quantityStr} from ${this.$root.tEVMAccount.address}`
          });
          this.oldtEVMBalance = this.getCurrenttEVMBalance();
        }
      } else {
        this.$q.notify({
          type: "negative",
          message: `Failed to withdraw ${quantityStr} from ${this.$root.tEVMAccount.address}`
        });
      }
      this.tEVMWithdrawing = false;
    },
    async generateEVMAddress() {
      let actions = [];
      actions.push({
        account: process.env.EVM_CONTRACT,
        name: "create",
        data: {
          account: this.accountName,
          data: "test"
        }
      });
      const transaction = await this.$store.$api.signTransaction(
        actions,
        `Create a new EVM address`
      );
      if (transaction) {
        if (transaction === "needAuth") {
          this.$q.notify({
            type: "negative",
            message: `Authentication is required`
          });
        } else if (transaction === "error") {
          this.$q.notify({
            type: "negative",
            message: `Creation failed. Make sure authentication is done correctly.`
          });
        } else if (transaction !== "cancelled") {
          this.$q.notify({
            type: "primary",
            message: `A new address is successfully created`
          });
          this.$root.tEVMAccount = await this.$root.tEVMApi.telos.getEthAccountByTelosAccount(
            this.accountName
          );
          this.networkType = "tevm";
        }
      } else {
        this.$q.notify({
          type: "negative",
          message: `Failed to create an address`
        });
      }
    }
  },
  created: async function() {
    this.interval = setInterval(() => {
      if (!this.panning) {
        if (
          this.coinViewHeight <
            this.availableHeight - (this.minSpace + this.maxSpace) * 0.5 &&
          this.coinViewHeight > this.availableHeight - this.maxSpace
        ) {
          // this.coinViewHeight = this.coinViewHeight - 3;
        } else if (
          this.coinViewHeight >=
            this.availableHeight - (this.minSpace + this.maxSpace) * 0.5 &&
          this.coinViewHeight < this.availableHeight - this.minSpace
        ) {
          // this.coinViewHeight = this.coinViewHeight + 3;
        }
        const approxViewHeight = Math.min(
          this.availableHeight - this.minSpace,
          Math.max(this.availableHeight - this.maxSpace, this.coinViewHeight)
        );
        if (this.coinViewHeight != approxViewHeight) {
          // this.coinViewHeight = approxViewHeight;
        }
      }
      this.displayAmount =
        this.totalAmount - (this.totalAmount - this.displayAmount) * 0.98;
      if (window.time && Date.now() / 1000 - window.time > 10 * 60) {
        location.reload();
      }
    }, 10);

    if (this.chainName === "telos" || 1) {
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
          json.forEach(token => {
            if (token.chain !== "telos") {
            } else if (token.metadata.name === "Telos") {
              this.coins.forEach(coin => {
                if (coin.symbol === "TLOS") {
                  coin.price = token.price.usd;
                  coin.icon = "/coins/TLOS.png";
                }
              });
            } else if (token.symbol !== "TLOS") {
              const precisionSplit = token.supply.circulating
                .toString()
                .split(".");
              this.coins.push({
                account: token.account.toLowerCase(),
                name: token.metadata.name,
                symbol: token.symbol,
                amount: 0,
                price: 0,
                icon: token.metadata.logo,
                precision:
                  precisionSplit.length > 1 ? precisionSplit[1].length : 0
              });
              const tSymbol = token.symbol.toLowerCase();
              if (
                this.pTokenNetworks[tSymbol] &&
                this.pTokenNetworks[tSymbol].tevm
              ) {
                this.coins.push({
                  account: token.account.toLowerCase(),
                  name: token.metadata.name,
                  symbol: token.symbol,
                  amount: 0,
                  price: 0,
                  icon: token.metadata.logo,
                  precision:
                    precisionSplit.length > 1 ? precisionSplit[1].length : 0,
                  network: "tevm"
                });
              }
            }
          });
        });
      if (this.isAuthenticated)
        this.getUserTokens().then(this.loadUserTokens());
    }

    this.coinLoadedAll = true;
    this.tokenInterval = setInterval(async () => {
      if (this.isAuthenticated)
        this.getUserTokens().then(this.loadUserTokens());
      try {
        this.$root.tEVMAccount = await this.$root.tEVMApi.telos.getEthAccountByTelosAccount(
          this.accountName
        );
        this.tEVMBalance = this.getCurrenttEVMBalance();
      } catch {}
      window.time = Date.now() / 1000;
      if (!window.location.href.includes("localhost")) {
        console.clear();
        console.log("Don't try to use Inspector!");
      }
      window.time = Date.now() / 1000;
      if (!window.location.href.includes("localhost")) {
        console.clear();
        console.log("Don't try to use Inspector!");
      }
    }, 5000);
  },
  beforeMount() {
    this.coinViewHeight =
      window.innerHeight - this.footerHeight - this.maxSpace;
  },
  mounted() {
    this.loadUserProfile();
    this.$root.$on("successfully_sent", (sendAmount, toAddress) => {
      this.showSendAmountDlg = false;
      this.showSendDlg = false;
    });
    this.$root.$on(
      "qrcode_scanned",
      ({ accountName, coinName, networkType }) => {
        if (!this.selectedCoin) {
          this.$root.qrcode_accountName = accountName;
          this.$root.qrcode_networkType = networkType;
          this.selectedCoin = this.coins.find(coin => coin.name === coinName);
          this.showSendAmountDlg = true;
        }
      }
    );
    this.$root.$on("show_qrscanner", () => {
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
  watch: {
    accountName() {
      this.loadUserProfile();
    }
  }
};
</script>

<style lang="scss" scoped>
.balance-div {
  background-color: #00000000;
  display: inline-flex;
  justify-content: space-between;
}
.coinviewGrid {
  background-color: #00000000;
}

.balanceBtn {
  margin-right: 0.5vw;
  margin-left: 0.5vw;
  width: 8rem;
  height: 3rem;
}

.convertBtn,
.purchaceBtn {
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  img {
    border-radius: 20px;
  }
  &:hover {
    text-shadow: 0 0 5px $white;
    img {
      box-shadow: 0 0 5px $white;
    }
  }
}
.convertBtn {
  margin-right: 3rem;
}
.profileImg {
  height: 4rem;
  width: 4rem;
  // margin: 1rem;
  cursor: pointer;
  background: no-repeat;
  right: 1.5rem;
  top: 1.5rem;
  position: absolute;
  display: none;
  @media only screen and (min-width: 1000px) {
    display: block;
  }
}
</style>
