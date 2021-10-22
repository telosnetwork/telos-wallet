<template>
  <q-dialog
    class="main-background"
    v-model="showDlg"
    persistent
    :maximized="true"
    transition-show="slide-left"
    transition-hide="slide-right"
  >
    <q-card
      class="full-height main-background"
      style="max-width: auto; margin: auto;"
    >
      <q-layout
        view="hhh Lpr fFf"
        container
        class="shadow-4 coinview main-background-overlay"
      >
        <q-header class="q-pa-sm " style="background: #00000000">
          <q-toolbar class="no-padding">
            <q-toolbar-title class="absolute full-width no-padding text-center">
              <label class="text-subtitle1 text-weight-medium h-20">{{
                `${getFixed(sendAmount, selectedCoin.precision)} ${
                  selectedCoin.symbol
                }`
              }}</label>
            </q-toolbar-title>

            <!-- Close Button -->
            <q-btn
              round
              flat
              dense
              v-close-popup
              class="text-white closebBtn"
              icon="west"
            />
            <!-- Next Button -->
            <q-btn
              flat
              dense
              class="q-ml-auto q-mr-sm text-white"
              label="Next"
              :disable="
                networkType === 'ethereum' &&
                  sendAmount * selectedCoin.price < 100
              "
              @click="
                networkType === 'ethereum' &&
                sendAmount * selectedCoin.price < 100
                  ? null
                  : nextPressed()
              "
            />
          </q-toolbar>

          <q-item v-if="isPToken" class="list-item q-pt-lg q-pb-none">
            <label class="text-center full-width text-white">To Network</label>
          </q-item>
          <div class="row q-gutter-x-md items-center justify-center q-pt-md">
            <q-avatar size="6rem">
              <img :src="selectedCoin.icon" />
            </q-avatar>
            <div><img src="~assets/icons/networkArrows.svg" /></div>
            <q-avatar size="6rem">
              <img
                v-if="networkType === 'telos' || networkType === 'tevm'"
                :src="selectedCoin.icon"
              />
              <div
                v-if="networkType == 'tevm'"
                class="flex absolute full-width full-height"
              >
                <img
                  class="flex q-ml-auto q-mt-auto"
                  alt="tEVM"
                  src="~assets/evm_logo.png"
                  style="width: 50%; height: 50%; margin-right: -10%; margin-bottom: -5%;"
                />
              </div>
              <img
                v-if="networkType == 'ethereum'"
                src="~assets/Ethereum.svg"
              />
            </q-avatar>
          </div>
        </q-header>

        <!-- Coin Images -->
        <!-- <div class="row">
          <div class="absolute" style=" left: 55%;">
            <q-item-section avatar class="cryptoImg1">
              <q-avatar size="6rem">
                <img :src="selectedCoin.icon" />
              </q-avatar>
            </q-item-section>
            <img
              class="avatarBackground"
              src="~assets/avatarBackground.svg"
              style=" left: 50%;"
            />
          </div>

          <div class="absolute" style=" left: 45%;">
            <q-item-section avatar class="cryptoImg2">
              <q-avatar size="6rem">
                <img :src="selectedCoin.icon" />
              </q-avatar>
            </q-item-section>
            <img
              class="avatarBackground2"
              src="~assets/avatarBackground.svg"
              style=" left: 45%;"
            />
          </div>
        </div> -->

        <!-- Crypto Buttons -->
        <q-item v-if="isPToken" class="list-item -center cryptoButtons">
          <q-btn-group class="full-width justify-center" push unelevated>
            <q-btn
              v-for="(pTokenNetwork, key) of coinpTokenNetworks"
              :key="pTokenNetwork"
              class="q-px-md"
              push
              no-caps
              :label="pTokenNetwork"
              :style="
                `background: ${networkType === key ? '#FFFFFF55' : '#FFFFFF22'};
                  color: ${networkType === 'key' ? 'grey' : 'white'};`
              "
              @click="networkType = key"
            />
          </q-btn-group>
        </q-item>

        <!-- To network -->
        <q-list>
          <q-item />
          <q-item class="list-item listItemTo">
            <q-item-section text-white side>To:</q-item-section>
            <q-item-section>
              <q-input
                v-model="toAddress"
                :value="toAddress.toLowerCase()"
                dense
                standout="bg-transparent text-white"
                label-color="white"
                color="white"
                input-class="text-white"
                class="round-sm full-width"
                :label="toPlaceHolder"
              />
            </q-item-section>
            <q-item-section side>
              <q-btn
                round
                flat
                size="12px"
                class="text-white q-mr-none"
                icon="qr_code_scanner"
                @click="showQRScanner()"
              />
            </q-item-section>
          </q-item>
          <q-item
            class="list-item listItemNotes"
            :disable="networkType === 'ptoken'"
          >
            <q-item-section text-white side>Notes:</q-item-section>
            <q-item-section>
              <q-input
                v-model="notes"
                :disable="
                  networkType === 'ptoken' || networkType === 'ethereum'
                "
                dense
                standout="bg-transparent text-white"
                label-color="white"
                color="white"
                input-class="text-white"
                class="round-sm full-width"
                label="notes"
              />
            </q-item-section>
          </q-item>
          <q-item
            v-if="
              networkType === 'ethereum' &&
                sendAmount * selectedCoin.price < 100
            "
            class="list-item items-center text-center text-red-5 text-weight-bold"
          >
            <div>Minimum of $100 for mainnet TLOS to Ethereum Transfers</div>
          </q-item>
          <q-item>
            <div v-if="checking" class="q-pt-md text-center full-width">
              <q-spinner
                class="q-my-md"
                color="primary"
                size="2em"
                :thickness="5"
              /><br />
              Checking {{ networkType === "telos" ? "Account" : "Address" }}
            </div>
          </q-item>
        </q-list>

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
import { mapGetters, mapActions } from "vuex";
import moment from "moment";
import SendConfirm from "./SendConfirm";

export default {
  props: ["showSendToAddressDlg", "selectedCoin", "sendAmount"],
  data() {
    return {
      toAddress: "",
      notes: "",
      showSendConfirmDlg: false,
      networkType: "telos",
      checking: false
    };
  },
  components: {
    SendConfirm
  },
  computed: {
    ...mapGetters("account", ["isAuthenticated", "accountName"]),
    ...mapGetters("global", ["pTokens", "pTokenNetworks"]),
    showDlg: {
      get() {
        return this.showSendToAddressDlg;
      },
      set(value) {
        this.$emit("update:showSendToAddressDlg", value);
      }
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
    toPlaceHolder() {
      if (this.networkType === "telos") {
        return "Username or Telos address";
      }
      return `${this.pTokenNetworks[this.tSymbol][this.networkType]} address`;
    },
    chainName() {
      return this.$ual.authenticators[0].keycatMap[
        this.$ual.authenticators[0].selectedChainId
      ].config.blockchain.name;
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
        // if (key !== 'tevm' || this.chainName !== 'telos') {
        networks[key] = this.pTokenNetworks[this.tSymbol][key];
        // }
      }
      return networks;
    }
  },
  methods: {
    ...mapActions("account", ["accountExists"]),
    async nextPressed() {
      if (this.toAddress.length === 0) {
        this.$q.notify({
          type: "dark",
          message: `Please fill the ${this.toPlaceHolder}`
        });
        return;
      }

      this.checking = true;
      if (this.networkType === "telos") {
        if (!(await this.accountExists(this.toAddress))) {
          this.$q.notify({
            type: "negative",
            message: `Account ${this.toAddress} does not exist`
          });
          this.checking = false;
          return;
        }
      } else if (
        this.networkType === "tevm" ||
        this.networkType === "ethereum"
      ) {
        if (this.toAddress.length !== 42 || !this.toAddress.startsWith("0x")) {
          this.$q.notify({
            type: "negative",
            message: `Address ${this.toAddress} is not valid`
          });
          this.checking = false;
          return;
        }
      } else if (this.networkType === "ptoken") {
        if (this.selectedCoin.name === "pTokens ETH") {
          if (
            this.toAddress.length !== 42 ||
            !this.toAddress.startsWith("0x")
          ) {
            this.$q.notify({
              type: "negative",
              message: `Address ${this.toAddress} is not valid`
            });
            this.checking = false;
            return;
          }
        } else if (this.selectedCoin.name === "pTokens BTC") {
          const data = await fetch(
            `https://api.smartbit.com.au/v1/blockchain/address/${this.toAddress}`
          ).then(resp => resp.json());
          if (!data.success) {
            this.$q.notify({
              type: "negative",
              message: `Address ${this.toAddress} is not valid`
            });
            this.checking = false;
            return;
          }
        }
      }

      this.checking = false;
      this.showSendConfirmDlg = true;
    },
    showQRScanner() {
      this.$root.$emit("show_qrscanner");
    }
  },
  mounted() {
    this.$root.$on("successfully_sent", (sendAmount, toAddress) => {
      this.showSendConfirmDlg = false;
    });
    this.$root.$on(
      "qrcode_scanned",
      ({ accountName, coinName, networkType }) => {
        if (this.showSendToAddressDlg) {
          if (this.selectedCoin && coinName !== this.selectedCoin.name) {
            this.$q.notify({
              type: "dark",
              message: `Please scan with correct token`
            });
          } else {
            this.toAddress = accountName;
            this.networkType = networkType;
          }
        }
      }
    );
  },
  watch: {
    showSendToAddressDlg: async function(val, oldVal) {
      if (val) {
        this.toAddress = this.$root.qrcode_accountName || "";
        this.networkType = this.$root.qrcode_networkType || "telos";
        if (this.selectedCoin && this.selectedCoin.network) {
          this.networkType = this.selectedCoin.network;
        }
        this.$root.qrcode_accountName = "";
        this.notes = "";
        this.checking = false;
      }
    },
    toAddress: function(val, oldVal) {
      if (this.networkType === "telos") {
        this.toAddress = this.toAddress.toLowerCase();
      }
    },
    networkType: function(val, oldVal) {
      if (val === "telos") {
        this.toAddress = this.toAddress.toLowerCase();
      } else if (val === "tevm") {
        if (!this.$root.tEVMAccount) {
          this.$q.notify({
            type: "dark",
            message: `Please generate your tEVM address`
          });
        }
      }
    }
  }
};
</script>

<style scoped>
.toolbar-title {
  position: absolute;
  text-align: center;
}
.list-item {
  /* border: 1px solid #fafafa; */
  border-left: none;
  border-right: none;
}
.display-grid {
  display: grid;
}
.h-20 {
  height: 20px;
}

.cryptoImg1 {
  position: absolute;
  width: 6rem;
  height: 6rem;
  margin-top: 9rem;
  margin-left: 1rem;
  width: 6rem;
  height: 6rem;
}
.cryptoImg2 {
  position: absolute;
  width: 0.5rem;
  height: 0.5rem;
  margin-top: 11rem;
  margin-right: 3rem;
  margin-left: -5rem;
}

.avatarBackground {
  display: flex;
  position: relative;
  left: 30%;
  margin-left: -3.4rem;
  margin-top: 7.5rem;
  /* margin-bottom: -1rem; */
}

.avatarBackground2 {
  display: flex;
  position: relative;
  left: -1rem;
  margin-left: -6.6rem;
  margin-top: 7.3rem;
  width: 8rem;
  height: 8rem;
  /* margin-bottom: -1rem; */
}

.cryptoButtons {
  margin-top: 40vh;
}
</style>
