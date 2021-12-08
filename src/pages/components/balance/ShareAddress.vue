<template>
  <q-dialog
    v-if="selectedCoin"
    v-model="showDlg"
    persistent
    maximized
    transition-show="slide-left"
    transition-hide="slide-right"
  >
    <div class="main-background">
      <div class="dialogPage">
        <div class="dialogPageContent">
          <div class="dialogPageHeading">
            <div>
              <q-btn
                round
                flat
                dense
                v-close-popup
                class="closebBtn"
                icon="west"
              />
            </div>
            <div class="text-subtitle1 text-weight-medium text-center">
              {{ `Receive ${selectedCoin.symbol}` }}
            </div>
            <div />
          </div>
          <div>
            <q-card
              class="column qr-card text-center q-mx-auto q-my-md q-pa-sm no-shadow bg-transparent q-gutter-md"
            >
              <div v-if="isPToken" class="list-item q-pb-sm">
                <label class="text-center full-width text-white"
                  >From Network</label
                >
              </div>
              <div v-if="isPToken" class="list-item ">
                <q-btn-group
                  class="full-width justify-center"
                  push
                  unelevated
                  rounded
                >
                  <q-btn
                    v-for="(pTokenNetwork, key) of coinpTokenNetworks"
                    :key="pTokenNetwork"
                    class="q-px-md"
                    push
                    no-caps
                    :label="pTokenNetwork"
                    :style="
                      `background: ${
                        networkType === key ? '#FFFFFF55' : '#FFFFFF22'
                      };
                            color: ${networkType === key ? 'white' : 'grey'};`
                    "
                    @click="networkType = key"
                  />
                </q-btn-group>
                <q-btn
                  v-if="
                    networkType === 'ptoken' ||
                      (networkType === 'tevm' && !$root.tEVMAccount)
                  "
                  class="purpleGradient q-mt-lg text-weight-medium text-caption"
                  push
                  no-caps
                  :label="
                    networkType === 'ptoken'
                      ? 'Generate New Deposit Address'
                      : 'Generate New Address'
                  "
                  :style="
                    `visibility: ${networkType === 'telos' ? 'hidden' : ''}`
                  "
                  @click="
                    networkType === 'ptoken'
                      ? generateDepositAddress()
                      : generateEVMAddress()
                  "
                />
              </div>
              <q-space />
              <div
                v-if="
                  networkType === 'telos' ||
                    networkType === 'ethereum' ||
                    isAddressAvailable
                "
                class="cursor-pointer"
                @click="copyToClipboard(qrcodeData)"
              >
                <q-r-canvas
                  :options="{ data: qrcodeData, cellSize: 10 }"
                  class="qrCanvas q-pa-lg bg-white"
                />
              </div>
              <div
                :class="
                  networkType === 'telos' ||
                  networkType === 'ethereum' ||
                  !isAddressAvailable
                    ? 'text-h6'
                    : 'text-caption'
                "
                class="text-white"
                style="word-break: break-word;"
              >
                {{ displayAccountName }}
              </div>
              <div class="text-white">({{ selectedCoin.name }} address)</div>
              <div v-if="networkType === 'ptoken' && awaiting" class="q-pt-md">
                <q-spinner color="primary" size="2em" :thickness="5" />
                Awaiting New Deposits...
              </div>
              <q-space />
              <div
                v-if="networkType === 'tevm'"
                class="text-caption text-red"
              >
                WARNING! This a a Telos EVM address only. Do not send funds to this address on any other network!
              </div>
              <div
                v-else-if="networkType === 'ptoken'"
                class="text-caption text-grey-8"
              >
                Any {{ selectedCoin.symbol.slice(1) }} deposit sent to this
                address will mint an equal number of p{{
                  selectedCoin.symbol.slice(1)
                }}
                tokens on the TELOS address: {{ accountName }}
              </div>
            </q-card>
          </div>
        </div>
      </div>
    </div>
  </q-dialog>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import moment from "moment";
import { QRCanvas } from "qrcanvas-vue";
import { pERC20 } from "ptokens-perc20";
import pTokens from "ptokens";
import { copyToClipboard } from "quasar";

export default {
  props: ["showShareAddressDlg", "selectedCoin"],
  data() {
    return {
      searchCoinName: "",
      networkType: "telos",
      depositAddress: "",
      metaData: {},
      awaiting: false,
      username: "",
      notes: "",
      selectedDestCoin: "",
      sendAmountValue: 0,
      coinInput: "",
      sendAmount: 0,
      amountFontSize: ""
    };
  },
  components: {
    QRCanvas
  },
  computed: {
    ...mapGetters("account", ["isAuthenticated", "accountName"]),
    ...mapGetters("global", ["pTokens", "pTokenNetworks"]),
    searchCoins() {
      return this.coins.filter(coin => {
        return (
          coin.name.toLowerCase().includes(this.searchCoinName.toLowerCase()) ||
          coin.symbol.toLowerCase().includes(this.searchCoinName.toLowerCase())
        );
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
        this.$emit("update:showShareAddressDlg", value);
      }
    },
    qrcodeData() {
      if (this.networkType === "telos") {
        return `${this.accountName}(${this.selectedCoin.name})`;
      } else if (this.networkType === "tevm") {
        return `${this.$root.tEVMAccount.address}(${this.selectedCoin.name})`;
      } else if (this.networkType === "ethereum") {
        return `${this.accountName}(${this.selectedCoin.name})`;
      } else if (this.networkType === "ptoken") {
        return `${this.depositAddress}(${this.selectedCoin.name})`;
      }
      return "";
    },
    displayAccountName() {
      if (this.networkType === "telos") {
        return this.accountName;
      } else if (this.networkType === "ethereum") {
        return this.accountName;
      } else if (this.networkType === "tevm") {
        if (this.$root.tEVMAccount) {
          return this.$root.tEVMAccount.address;
        } else {
          return "Please Generate New Address";
        }
      } else if (this.networkType === "ptoken") {
        if (this.depositAddress.length > 0) {
          return this.depositAddress;
        } else {
          return "Please Generate New Deposit Address";
        }
      }
      return "";
    },
    isAddressAvailable() {
      if (this.networkType === "tevm" && this.$root.tEVMAccount) {
        return true;
      }
      if (this.networkType === "ptoken" && this.depositAddress.length > 0) {
        return true;
      }
      return false;
    },
    tSymbol() {
      return this.selectedCoin.symbol.toLowerCase();
    },
    isPToken() {
      if (!this.selectedCoin) {
        return false;
      }
      if (!this.pTokens.includes(this.tSymbol)) {
        return false;
      }
      if (this.selectedCoin.network) {
        return true;
      }
      return Object.keys(this.coinpTokenNetworks).length > 1;
    },
    chainName() {
      return process.env.CHAIN_NAME;
    },
    coinpTokenNetworks() {
      if (this.selectedCoin.network) {
        return {
          [this.selectedCoin.network]: this.pTokenNetworks[this.tSymbol][
            this.selectedCoin.network
          ]
        };
      }
      const networks = {};
      for (const key in this.pTokenNetworks[this.tSymbol]) {
        // if ((key !== 'tevm' && key !== 'ethereum') || this.chainName !== 'telos') {
        if (key !== "ethereum" || this.chainName !== "telos") {
          networks[key] = this.pTokenNetworks[this.tSymbol][key];
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
        name: "create",
        data: {
          account: this.accountName,
          data: "data"
        }
      });
      try {
        const transaction = await this.$store.$api.signTransaction(
          actions,
          `Create a new EVM address`
        );
        this.$q.notify({
          type: "primary",
          message: `A new address is successfully created`
        });
        this.$root.tEVMAccount = await this.$root.tEVMApi.telos.getEthAccountByTelosAccount(
          this.accountName
        );
        this.networkType = "tevm";
      } catch (error) {
        this.$errorNotification(error);
      }
    },
    getImgUrl(pic) {
      return require("src/assets/ethereumLogo.svg"); //+pic);
    },
    async generateDepositAddress() {
      this.awaiting = false;
      let ptoken = new pTokens({
        pbtc: {
          blockchain: "Telos",
          network: "mainnet"
        },
        perc20: {
          blockchain: "Telos",
          network: "mainnet",
          pToken: "pETH"
        }
      });

      let newAddress = null;
      if (this.selectedCoin.symbol.toLowerCase() === "pbtc") {
        newAddress = await ptoken.pbtc.getDepositAddress(this.accountName);
      } else if (this.selectedCoin.symbol.toLowerCase() === "tlos") {
        newAddress = await ptoken.peth.issue(10, this.accountName);
      }

      if (newAddress.value) {
        this.awaiting = true;
        this.depositAddress = newAddress.value;
        this.metaData[this.selectedCoin.symbol] = this.depositAddress;
        window.localStorage.setItem("metaData", JSON.stringify(this.metaData));
        this.$q.notify({
          type: "primary",
          message: "New Deposit Address is generated successfully"
        });

        newAddress
          .waitForDeposit()
          .once("nativeTxBroadcasted", tx => {})
          .once("nativeTxConfirmed", tx => {})
          .once("nodeReceivedTx", tx => {})
          .once("nodeBroadcastedTx", tx => {})
          .once("hostTxConfirmed", tx => {})
          .then(res => {
            this.$q.notify({
              type: "primary",
              message: "New Deposit is confirmed successfully"
            });
            this.awaiting = false;
          });
      }
    },
    copyToClipboard(str) {
      copyToClipboard(str).then(() => {
        this.$q.notify({
          type: "primary",
          message: "Copied to clipboard"
        });
      });
    }
  },
  watch: {
    showShareAddressDlg: async function(val, oldVal) {
      if (val) {
        this.networkType = "telos";
        if (this.selectedCoin && this.selectedCoin.network) {
          this.networkType = this.selectedCoin.network;
        }
        this.metaData =
          JSON.parse(window.localStorage.getItem("metaData")) || {};
        this.depositAddress = this.metaData[this.selectedCoin.symbol] || "";
      }
    }
  },
  mounted() {}
};
</script>

<style lang="scss" scoped>
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

.cryptoImg1 {
  position: absolute;
  width: 6rem;
  height: 6rem;
  margin-top: 6rem;
  margin-left: 1rem;
  width: 6rem;
  height: 6rem;
}
.cryptoImg2 {
  position: absolute;
  width: 0.5rem;
  height: 0.5rem;
  margin-top: 8rem;
  margin-right: 3rem;
  margin-left: -5rem;
}

.avatarBackground {
  display: flex;
  position: relative;
  left: 30%;
  margin-left: -3.4rem;
  margin-top: 4.5rem;
  /* margin-bottom: -1rem; */
}

.avatarBackground2 {
  display: flex;
  position: relative;
  left: -1rem;
  margin-left: -6.6rem;
  margin-top: 4.3rem;
  width: 8rem;
  height: 8rem;
  /* margin-bottom: -1rem; */
}

.cryptoBtn {
  margin-top: 1rem;
}

.networkinfo {
  display: block;
  margin-left: 2rem;
  margin-right: 2rem;
  margin-top: 1rem;
}

.nextBtn {
  margin-top: 0.5rem;
  width: 600px;
  margin-bottom: 1rem;
}

.qrCode {
  margin-left: 50%;
  transform: translateX(-10%);
}

.amount-div {
  display: inline-flex;
  justify-content: space-between;
}

.amount {
  color: #fafafa;
  margin-top: 7rem;
  margin-bottom: 0.5rem;
  font-size: 1.5rem;
}

input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}

.generateBtn {
  background: linear-gradient(120deg, #1dd1fe, #8946df);
  color: white;
  margin-top: 2rem;
  left: 50%;
  transform: translateX(-50%);
}

.username {
  width: 50%;
  left: 50%;
  transform: translateX(-50%);
}
.notes {
  width: 50%;
  left: 50%;
  transform: translateX(-50%);
}
@media only screen and (min-width: 1000px) {
  .networkinfo {
    display: block;
    margin-left: 10rem;
    margin-right: 10rem;
    margin-top: 1rem;
  }

  .coin_icon {
    background: "~assets/ethereumLogo.svg";
  }
}
.qrCanvas {
  width: 15rem;
  border-radius: 2rem;
}
</style>
