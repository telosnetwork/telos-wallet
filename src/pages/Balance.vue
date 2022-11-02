<template>
  <div class="row justify-center">
    <div style="width: 600px">
      <div style="height: 100%; overflow: auto">
        <div class="text-center">
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
                :style="`font-size: ${balanceTextSize}px; font-weight: 200; font-size: 50px; white-space: nowrap;`"
              >
                $ {{ getFixed(parseInt(displayAmount), 0) }}.{{
                  displayAmount.toFixed(2).slice(-2)
                }}
              </label>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="row q-mt-lg q-mb-md">
            <q-btn
              class="col balanceBtn purpleGradient text-subtitle2 flex-center"
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
              class="col balanceBtn purpleGradient text-subtitle2 flex-center"
              flat
              rounded
              no-caps
              label="Receive"
              @click="showReceiveDlg = true"
            />
          </div>

          <!-- Convert and Purchace -->
          <div class="row justify-between q-mb-md">
            <div class="convertBtn" @click="clickExchange()">
              <img src="~assets/coin/Convert.svg" class="q-mr-xs" />
              Convert
            </div>
            <div class="purchaceBtn" @click="clickPurchase()">
              Purchase
              <img src="~assets/coin/Purchase.svg" class="q-ml-xs" />
            </div>
          </div>
        </div>

        <q-tabs
          :value="balanceTab"
          v-model="tab"
          @click="switchTab"
          content-class="coinTabs"
          class="shadow-2 no-shadow"
          style="width: 100%"
        >
          <q-tab no-caps name="coins" label="Coins" key="coins" style="width: 50%; background: #00000000"></q-tab>
          <q-tab no-caps name="collectables" label="Collectables" key="coins" style="width: 50%; background: #00000000"></q-tab>
        </q-tabs>
        <q-tab-panels
          flat
          v-model="tab"
          class="coinTabPanels"
        >
          <q-tab-panel
            flat
            name="coins"
            label="Coins"
            class="no-padding"
            :style="' border:0px;'"
          >
            <Coin
              flat
              :coins="coins"
              :coinLoadedAll="coinLoadedAll"
              v-model:showHistoryDlg="showHistoryDlg"
              v-model:showDepositEVMDlg="showDepositEVMDlg"
              v-model:showWithdrawEVMDlg="showWithdrawEVMDlg"
              v-model:showExchangeDlg="showExchangeDlg"
              v-model:showBuyAmountDlg="showBuyAmountDlg"
              v-model:selectedCoin="selectedCoin"
              :suggestTokens="suggestTokens"
            />
          </q-tab-panel>
          <q-tab-panel name="collectables" label="Collectibles" :style="'background:  #00000000'">
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
        style="background: rgba(0, 0, 0, 0.4)"
      >
        <q-spinner-dots class="q-my-auto" color="primary" size="40px" />
      </div>
    </div>
    <History
      v-model:showHistoryDlg="showHistoryDlg"
      v-model:selectedCoin="selectedCoin"
      v-model:showSendAmountDlg="showSendAmountDlg"
      v-model:showShareAddressDlg="showShareAddressDlg"
      v-model:showBuyAmountDlg="showBuyAmountDlg"
      v-model:showExchangeDlg="showExchangeDlg"
      v-model:showRexStakeDlg="showRexStakeDlg"
    />
    <Exchange
      v-model:showExchangeDlg="showExchangeDlg"
      v-model:selectedConvertCoin="selectedCoin"
      :coins="coins"
    />
    <Send
      v-model:showSendDlg="showSendDlg"
      :coins="coins"
      v-model:selectedCoin="selectedCoin"
      v-model:showSendAmountDlg="showSendAmountDlg"
    />
    <DepositEVM
      v-model:showDepositEVMDlg="showDepositEVMDlg"
      v-model:nativeTLOSBalance="coins[0].amount"
    />
    <WithdrawEVM
    v-model:showWithdrawEVMDlg="showWithdrawEVMDlg"
    v-model:evmTLOSBalance="coins[1].amount"
    />
    <Receive
      v-model:showReceiveDlg="showReceiveDlg"
      :coins="coins"
      v-model:selectedCoin="selectedCoin"
      v-model:showShareAddressDlg="showShareAddressDlg"
    />
    <SendAmount
      v-model:showSendAmountDlg="showSendAmountDlg"
      :showHistoryDlg="showHistoryDlg"
      v-model:selectedCoin="selectedCoin"
    />
    <BuyAmount
      v-model:showBuyAmountDlg="showBuyAmountDlg"
      :showHistoryDlg="showHistoryDlg"
      v-model:selectedCoin="selectedCoin"
    />
    <ShareAddress
      v-model:showShareAddressDlg="showShareAddressDlg"
      :selectedCoin="selectedCoin"
    />
    <QRScanner v-model:showQRScannerDlg="showQRScannerDlg" :coins="coins" />
    <RexStaking
      v-if="selectedCoin"
      v-model:selectedCoin="selectedCoin"
      v-model:showRexStakeDlg="showRexStakeDlg"
    />

    <q-dialog v-model="showEVMWarning">
      <q-card class="popupCard">
        <q-card-section>
          <div class="text-h6">WARNING!</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          DO NOT USE THIS ANYWHERE EXCEPT TELOS EVM OR ELSE IT COULD RESULT IN A
          LOSS OF FUNDS. THIS PRIVATE KEY IS NOT AVAILABLE.
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            @click="showEVMAddress = true"
            flat
            no-caps
            label="I Understand"
            color="white"
            v-close-popup
            class="purpleGradient"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import BigNumber from "bignumber.js";
import { mapGetters, mapActions } from "vuex";
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
import RexStaking from "./components/balance/RexStaking";
import { copyToClipboard } from "quasar";

const GETTING_STARTED_URL = "https://www.telos.net/#getting-started";
const TSWAPS_URL = "https://tswaps.com/swap";

export default {
  props: ["loadedCoins", "loadedNftTokens", "balanceTab"],
  components: {
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
    RexStaking,
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
          suggested: true,
        },
        {
          account: "eosio.token",
          name: "Telos EVM",
          symbol: "TLOS",
          amount: 0,
          price: 0.0,
          precision: 4,
          suggested: true,
          network: "tevm",
        },
      ],
      nftTokenItems: {},
      nftTokenTags: new Set(),
      nftScopes: [0, 0],
      displayAmount: 0,
      nftTagLoading: false,
      coinLoadedAll: false,
      nftTokenLoadedAll: false,
      panning: false,
      coinViewHeight: 0,
      tab: this.balanceTab,
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
      showEVMWarning: false,
      showEVMAddress: false,
      showRexStakeDlg: false,
      tEVMWithdrawing: false,
      avatar: "",
    };
  },
  computed: {
    ...mapGetters("account", ["isAuthenticated", "accountName", "evmAddress", "evmBalance"]),
    ...mapGetters("global", [
      "footerHeight",
      "minSpace",
      "maxSpace",
      "supportTokens",
      "suggestTokens",
      "pTokenNetworks",
    ]),
    totalAmount() {
      return this.coins
        .map(
          (coin) =>
            (coin?.totalAmount === undefined ? coin.amount : coin.totalAmount) *
            coin.price
        )
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
        height: Math.max(0, (this.balanceTextSize - 15) * 1),
      };
    },
    qrcodeOpacity() {
      return 1 - Math.max(0, (this.balanceTextSize - 15) * 0.1);
    },
    chainName() {
      if (process.env.CHAIN_NAME === undefined) {
        return "telos";
      } else {
        return process.env.CHAIN_NAME;
      }
    },
    nftAccounts() {
      if (this.chainName !== "telos") {
        return ["marbletessst"];
      } else {
        return ["tlos.tbond", "marble.code"];
      }
    },
    shortenedEvmAddress() {
      const address = this.evmAddress;
      return `${address.slice(0, 12)}..${address.slice(-12)}`;
    },
  },
  methods: {
    ...mapActions("account", ["accountExists", "getUserProfile", "setEvmState"]),
    ...mapActions("rex", ["getRexBalance"]),

    copyStrToClipboard(str) {
      copyToClipboard(str).then(() => {
        this.$q.notify({
          type: "primary",
          message: "Copied to clipboard",
        });
      });
    },
    async loadUserProfile() {
      if (
        !this.$store.state.account.profiles.hasOwnProperty(this.accountName)
      ) {
        await this.getUserProfile(this.accountName);
      }
      const accountProfile =
        this.$store.state.account.profiles[this.accountName];
      if (!accountProfile) {
        return;
      }

      this.avatar = accountProfile.avatar;
    },
    async switchTab() {
      this.$emit("update:balanceTab", this.tab);
      if (
        this.isAuthenticated &&
        this.tab === "collectables" &&
        this.nftTokenTags.size == 0
      ) {
        this.loadUserProfile();
        await this.loadNftTokenItems();
        this.loadNftTokenTags();
      }
    },
    clickPurchase() {
      this.selectedCoin = this.coins.find((coin) => coin.symbol === "TLOS");
      window.open(GETTING_STARTED_URL);
    },
    clickExchange() {
      window.open(TSWAPS_URL);
    },
    handlePan({ evt, ...info }) {
      this.coinViewHeight -= info.delta.y;
      if (info.isFirst) {
        this.panning = true;
      } else if (info.isFinal) {
        this.panning = false;
      }
    },
    async loadCoinList() {
      const coins = await this.$store.$api.getTableRows({
        code: "tokenmanager",
        limit: "1000",
        scope: "tokenmanager",
        table: "tokens",
      });

      coins.rows.forEach((token) => {
        const [precision, symbol] = token.token_symbol.split(",");
        const account = token.contract_account;
        if (account == "eosio.token" && symbol == "TLOS") return;

        const name = token.token_name;
        const icon = token.logo_sm;
        const amount = 0;
        const price = 0;

        this.coins.push({
          account,
          name,
          symbol,
          amount,
          price,
          icon,
          precision,
        });
      });
    },
    async loadPrices() {
      const tlosUsdDataPoints = await this.$store.$api.getTableRows({
        code: "delphioracle",
        limit: "1000",
        scope: "tlosusd",
        table: "datapoints",
      });

      const tlosPrice = tlosUsdDataPoints.rows[0].median / 10000;
      this.coins[0].price = tlosPrice;
      this.coins[1].price = tlosPrice;
    },
    async loadUserTokens() {
      const userCoins = await this.$hyperion.get(
        `/v2/state/get_tokens?account=${this.accountName}&limit=1000`
      );
      if (userCoins.status === 200) {
        const tokens = userCoins.data.tokens.filter((token) => {
          if (
            userCoins.data.tokens.filter((t) => t.symbol === token.symbol)
              .length > 1
          ) {
            return token.contract.toLowerCase() === "eosio.token";
          }
          return true;
        });
        userCoins.data.tokens.forEach((token) => {
          if (token.symbol === undefined) {
            return;
          }
          if (token.precision === undefined) {
            token.precision = 0;
          }
          this.coins.forEach(async (coin) => {
            if (
              !coin.network &&
              coin.symbol.toLowerCase() === token.symbol.toLowerCase() &&
              coin.account === token.contract
            ) {

                // This patch fixes #46 (because /v2/state/get_tokens currently does not return the TLOS balance)
                const rpc = this.$store.$api.getRpc();
                if (coin.account === "eosio.token" && coin.symbol === "TLOS" && coin.name == "Telos") {
                    coin.amount = Number(
                      (
                        await rpc.get_currency_balance("eosio.token", this.accountName, "TLOS")
                      )[0].split(" ")[0]
                    );
                    coin.rexBalance =
                      (await this.getRexBalance(this.accountName)) || 0;
                    coin.totalAmount = coin.amount + coin.rexBalance;
                }else {
                  coin.amount = token.amount || 0;
                  coin.totalAmount = coin.amount || 0;
                }
                coin.precision = token.precision;

              // // get REX balance here and add to amount
              // if (token.contract === "eosio.token" && token.symbol === "TLOS") {
              //   coin.amount = token.amount || 0;
              //   coin.rexBalance =
              //     (await this.getRexBalance(this.accountName)) || 0;
              //   coin.totalAmount = coin.amount + coin.rexBalance;
              // } else {
              //   coin.amount = token.amount || 0;
              //   coin.totalAmount = coin.amount || 0;
              // }
            }
          });
          // if token not in coins, add it
          if (
            !this.coins.find(
              (coin) =>
                coin.symbol.toLowerCase() === token.symbol.toLowerCase() &&
                coin.account === token.contract
            )
          ) {
            this.coins.push({
              account: token.contract,
              name: `${token.symbol} (${token.contract})`,
              symbol: token.symbol,
              amount: token.amount || 0,
              price: 0,
              precision: token.precision || 4,
              icon: `${token.contract}-${token.symbol}`,
            });
          }
          this.coins.forEach((coin) => {
            if (coin.symbol === "TLOS" && coin.account === "eosio.token") {
              coin.icon = "/coins/TLOS.png";
            }
          });
        });
      }

      this.coins.forEach(async (coin) => {
        if (coin.network === "tevm") {
          coin.amount = this.evmBalance;
        }
      });

      const sortCoin = function (suggestTokens) {
        return function (a, b) {
          const aSymbol = a.symbol.toLowerCase();
          const bSymbol = b.symbol.toLowerCase();
          const aContract = a.account.toLowerCase();
          const bContract = b.account.toLowerCase();

          if (aSymbol === bSymbol) {
            if (a.network) {
              return 1;
            } else {
              return -1;
            }
          }

          if (aSymbol === "tlos" && a.account === "eosio.token") {
            return -1;
          } else if (bSymbol === "tlos" && b.account === "eosio.token") {
            return 1;
          }

          if (
            !suggestTokens.map((t) => t.sym).includes(aSymbol) ||
            !suggestTokens.map((t) => t.sym).includes(bSymbol)
          ) {
            if (
              suggestTokens.map((t) => t.sym).includes(aSymbol) &&
              suggestTokens.map((t) => t.contract).includes(aContract)
            ) {
              return -1;
            }
            if (
              suggestTokens.map((t) => t.sym).includes(bSymbol) &&
              suggestTokens.map((t) => t.contract).includes(bContract)
            ) {
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
      let more = true;
      let next_key = 10000;
      while (more === true) {
        let lower_bound = BigNumber(this.$nameToUint64(this.accountName)).times(
          "1e16"
        );
        let upper_bound = lower_bound.plus(next_key);
        const tagData = await this.$store.$api.getTableRows({
          code: nftAccount,
          index_position: 3,
          json: true,
          key_type: "i128",
          limit: "10000",
          reverse: false,
          scope: nftAccount,
          show_payer: false,
          table: "items",
          table_key: "",
          lower_bound: lower_bound.toFixed(),
          upper_bound: upper_bound.toFixed(),
        });
        if (tagData.more === false) {
          more = false;
        } else {
          next_key = tagData.next_key;
        }

        if (this.nftTokenItems[nftAccount]) {
          let moreNFTs = tagData.rows.filter(
            (row) => row.owner === this.accountName
          );
          this.nftTokenItems[nftAccount] =
            this.nftTokenItems[nftAccount].concat(moreNFTs);
        } else {
          this.nftTokenItems[nftAccount] = tagData.rows.filter(
            (row) => row.owner === this.accountName
          );
        }
      }
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
        (account) => account === nftAccount
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
          limit: 9999,
          lower_bound: null,
          reverse: false,
          scope: `${
            this.nftTokenItems[nftAccount][this.nftScopes[index]].serial
          }`,
          show_payer: false,
          table: "tags",
          table_key: "",
          upper_bound: null,
        });
        if (tagData.rows.length == 0) {
          if (foundFirstData) {
            break;
          }
          this.nftScopes[index] += 1;
        } else {
          if (nftAccount === "tlos.tbond") {
            if (
              tagData.rows.find((row) => row.tag_name === "title") !==
                undefined &&
              tagData.rows.find((row) => row.tag_name === "image") !== undefined
            ) {
              const title = tagData.rows.find(
                (row) => row.tag_name === "title"
              ).content;
              const image = tagData.rows.find(
                (row) => row.tag_name === "image"
              ).content;
              this.nftTokenTags.add({
                title: title,
                image: image,
              });
            }
          } else if (nftAccount === "marble.code") {
            if (
              tagData.rows.find((row) => row.tag_name === "data") !== undefined
            ) {
              const data = JSON.parse(
                tagData.rows.find((row) => row.tag_name === "data").content
              );
              this.nftTokenTags.add({
                title: data.ti,
                image: data.dt,
              });
            } else if (
              tagData.rows.find((row) => row.tag_name === "json.hash") !==
              undefined
            ) {
              // Get dstor data
              let hash = tagData.rows.find(
                (row) => row.tag_name === "json.hash"
              ).content;
              let response = await fetch(
                `https://api.dStor.cloud/ipfs/${hash}`
              );
              const data = await response.json();
              this.nftTokenTags.add({
                title: data.ti,
                image: data.dt,
              });
            }
          } else if (nftAccount === "marbletessst") {
            if (
              tagData.rows.find((row) => row.tag_name === "data") !== undefined
            ) {
              const data = JSON.parse(
                tagData.rows.find((row) => row.tag_name === "data").content
              );
              this.nftTokenTags.add({
                title: data.ti,
                image: data.dt,
              });
            }
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
      if (this.evmBalance) {
        const balanceStr = this.evmBalance.toString();
        return parseFloat(BigNumber(balanceStr).div(1e18).toFixed(4)) || 0;
      }
      return 0;
    },
    async withdrawEVM() {
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
          quantity: quantityStr,
        },
      });

      try {
        const transaction = await this.$store.$api.signTransaction(
          actions,
          `Withdraw ${quantityStr} from ${this.evmAddress}`
        );
        this.$q.notify({
          type: "primary",
          message: `Successfully withdrew ${quantityStr} from ${this.evmAddress}`,
        });
      } catch (error) {
        this.$errorNotification(error);
      }

      this.tEVMWithdrawing = false;
    }
  },
  created: async function () {
    this.interval = setInterval(() => {
      if (!this.panning) {
        if (
          this.coinViewHeight <
            this.availableHeight - (this.minSpace + this.maxSpace) * 0.5 &&
          this.coinViewHeight > this.availableHeight - this.maxSpace
        ) {
        } else if (
          this.coinViewHeight >=
            this.availableHeight - (this.minSpace + this.maxSpace) * 0.5 &&
          this.coinViewHeight < this.availableHeight - this.minSpace
        ) {
        }
        const approxViewHeight = Math.min(
          this.availableHeight - this.minSpace,
          Math.max(this.availableHeight - this.maxSpace, this.coinViewHeight)
        );
        if (this.coinViewHeight != approxViewHeight) {
        }
      }
      this.displayAmount =
        this.totalAmount - (this.totalAmount - this.displayAmount) * 0.98;
      if (window.time && Date.now() / 1000 - window.time > 10 * 60) {
        location.reload();
      }
    }, 5);

    if (this.loadedCoins.length > 0) {
      this.coins = this.loadedCoins;
      this.coinLoadedAll = true;
    } else {
      this.coins.length = 2;
      await this.loadCoinList();
      await this.loadPrices();

      if (this.isAuthenticated) this.loadUserTokens();
    }

    this.coinLoadedAll = true;
    this.tokenInterval = setInterval(async () => {
      if (this.isAuthenticated) {
        this.loadUserTokens();
        await this.loadPrices();
      }
      if (!this.evmAddress){
        try {
          await this.setEvmState()
        } catch(e) {
          console.error(e);
        }
      }
      window.time = Date.now() / 1000;
    }, 5000);
  },
  beforeMount() {
    this.coinViewHeight =
      window.innerHeight - this.footerHeight - this.maxSpace;
  },
  async mounted() {
    this.loadUserProfile();
    this.$emitter.on("successfully_sent", (sendAmount, toAddress) => {
      this.showSendAmountDlg = false;
      this.showSendDlg = false;
    });
    this.$emitter.on(
      "qrcode_scanned",
      ({ accountName, coinName, networkType }) => {
        if (!this.selectedCoin) {
          this.$root.qrcode_accountName = accountName;
          this.$root.qrcode_networkType = networkType;
          this.selectedCoin = this.coins.find((coin) => coin.name === coinName);
          this.showSendAmountDlg = true;
        }
      }
    );
    this.$emitter.on("show_qrscanner", () => {
      this.showQRScannerDlg = true;
    });
    if (this.isAuthenticated) {
      this.loadUserProfile();
      await this.loadNftTokenItems();
      this.loadNftTokenTags();
    }
  },
  beforeUnmount() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    if (this.tokenInterval) {
      clearInterval(this.tokenInterval);
    }
    this.coins = [];
  },
  watch: {
    async accountName() {
      if (this.isAuthenticated) {
        this.loadUserProfile();
        await this.loadNftTokenItems();
        this.loadNftTokenTags();
      }
    },
    balanceTab(val){
      this.tab = val;
    }
  },
};
</script>

<style lang="scss" scoped>
.balance-div {
  background-color: #00000000;
  display: inline-flex;
  justify-content: space-between;
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
</style>
