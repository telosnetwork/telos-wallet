<template>
  <q-dialog
    class="main-background"
    v-model="showDlg"
    persistent
    :maximized="true"
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card
      v-if="selectedCoin"
      class=" full-height main-background"
      style="max-width: auto; margin: auto;"
    >
      <q-layout
        view="hhh Lpr fFf"
        container
        class="shadow-4 coinview main-background-overlay"
      >
        <q-header class=" text-white q-pa-sm" style="background: #00000000">
          <q-toolbar class="no-padding" style="background: #00000000">
            <q-toolbar-title class="absolute full-width no-padding text-center">
              <div class="display-grid">
                <label class="text-subtitle1 text-weight-medium">Send</label>
                <!-- <label class="text-subtitle2 text-white">{{`${getFixed(selectedCoin.amount, selectedCoin.precision)} ${selectedCoin.symbol} Available`}}</label> -->
              </div>
            </q-toolbar-title>
            <q-btn
              round
              flat
              dense
              v-close-popup
              class="text-white closebBtn"
              icon="west"
            />
          </q-toolbar>
        </q-header>

        <!-- Body Information -->
        <q-page-container>
          <!-- Coin Image -->
          <div class="absolute" style=" left: 50%; margin-left:-3.5rem;">
            <q-item-section avatar class="cryptoImg">
              <q-avatar size="6rem">
                <img :src="selectedCoin.icon" />
                <!-- <img :src="coin.icon"> -->
              </q-avatar>
            </q-item-section>
            <img class="avatarBackground" src="~assets/avatarBackground.svg" />
          </div>

          <div class="column text-center" :style="`height: ${cardHeight}px;`">
            <q-space />

            <!-- Amount Shown -->
            <div class="full-width items-center amount-div">
              <div class="full-width column">
                <label class="amount">Amount</label>
                <label
                  ref="widthElement"
                  :style="
                    `display: fit-content; visibility: hidden; position: absolute; font-size: ${amountFontSize}px;`
                  "
                >
                  {{ sendAmount }}
                </label>
                <div class="desktop-only flex flex-center">
                  <label
                    class="text-weight-regular q-mr-sm"
                    :style="
                      `font-size: ${amountFontSize}px; color: ${themeColor}`
                    "
                  >
                    {{ coinInput ? `` : "$ " }}
                  </label>
                  <input
                    type="text"
                    :class="
                      `text-weight-regular ${
                        coinInput ? 'text-right' : 'text-left'
                      } no-border no-outline transparent`
                    "
                    :style="
                      `font-size: ${amountFontSize}px; color: white; z-index: 1; width: ${inputWidth}px;`
                    "
                    v-model="sendAmount"
                    @focus="sendAmount = sendAmount === '0' ? '' : sendAmount"
                    @blur="
                      sendAmount = Number(
                        sendAmount === '' ? '0' : sendAmount
                      ).toString()
                    "
                    @change="sendPercentage = 0"
                  />
                  <label
                    class="text-weight-regular q-ml-sm"
                    :style="`font-size: ${amountFontSize}px; color: white`"
                  >
                    {{ coinInput ? selectedCoin.symbol : "" }}
                  </label>
                </div>
                <label
                  class="text-weight-regular full-width mobile-only"
                  :style="
                    `font-size: ${amountFontSize}px; color: ${themeColor}`
                  "
                >
                  {{
                    coinInput
                      ? `${sendAmount} ${selectedCoin.symbol}`
                      : `$${sendAmount}`
                  }}
                </label>
                <label class="text-subtitle1 text-weight-large text-white">
                  {{
                    coinInput
                      ? `$ ${getFixed(sendAmountValue * selectedCoin.price, 8)}`
                      : `${getFixed(
                          sendAmountValue / selectedCoin.price,
                          selectedCoin.precision
                        )} ${selectedCoin.symbol}`
                  }}
                </label>
              </div>
              <!-- <div class="full-width text-right absolute"> -->
              <!-- <q-btn round flat icon="fas fa-sync" size="12px" class="text-grey-4 q-mr-sm" @click="changeCoinInput()" style="background: linear-gradient(120deg, #1DD1FE, #8946DF); margin-right:3rem"/> -->
              <!-- </div> -->
            </div>

            <!-- Exchange persentage -->
            <q-btn-group
              class=" full-width justify-center"
              push
              unelevated
              style="margin-top: 2rem"
            >
              <q-btn
                class="q-px-md"
                push
                no-caps
                label="25%"
                :style="
                  `background: ${
                    sendPercentage === 25 ? '#FFFFFF55' : '#FFFFFF22'
                  };
                          color: ${sendPercentage === 25 ? 'white' : 'grey'};`
                "
                @click="
                  sendPercentage === 25
                    ? (sendPercentage = 0)
                    : (sendPercentage = 25);
                  sendAmount = Number(
                    sendPercentage === 0 ? '' : selectedCoin.amount / 4
                  ).toString();
                "
              />
              <q-btn
                class="q-px-md"
                push
                no-caps
                label="50%"
                :style="
                  `background: ${
                    sendPercentage === 50 ? '#FFFFFF55' : '#FFFFFF22'
                  };
                          color: ${sendPercentage === 50 ? 'white' : 'grey'};`
                "
                @click="
                  sendPercentage === 50
                    ? (sendPercentage = 0)
                    : (sendPercentage = 50);
                  sendAmount = Number(
                    sendPercentage === 0 ? '' : selectedCoin.amount / 2
                  ).toString();
                "
              />
              <q-btn
                class="q-px-md"
                push
                no-caps
                label="75%"
                :style="
                  `background: ${
                    sendPercentage === 75 ? '#FFFFFF55' : '#FFFFFF22'
                  };
                          color: ${sendPercentage === 75 ? 'white' : 'grey'};`
                "
                @click="
                  sendPercentage === 75
                    ? (sendPercentage = 0)
                    : (sendPercentage = 75);
                  sendAmount = Number(
                    sendPercentage === 0 ? '' : selectedCoin.amount * 0.75
                  ).toString();
                "
              />
              <q-btn
                class="q-px-md"
                push
                no-caps
                label="100%"
                :style="
                  `background: ${
                    sendPercentage === 100 ? '#FFFFFF55' : '#FFFFFF22'
                  };
                          color: ${sendPercentage === 100 ? 'white' : 'grey'};`
                "
                @click="
                  sendPercentage === 100
                    ? (sendPercentage = 0)
                    : (sendPercentage = 100);
                  sendAmount = Number(
                    sendPercentage === 0 ? '' : selectedCoin.amount
                  ).toString();
                "
              />
            </q-btn-group>

            <q-space />
            <q-space />
            <div class="q-pa-sm full-width mobile-only">
              <div class="q-gutter-x-xs q-gutter-y-lg">
                <q-btn
                  v-for="key in keyboard"
                  :key="key"
                  class="bg-white text-white q-mx-auto q-my-auto text-h5"
                  style="width: 30%; height: 60px;"
                  flat
                  :label="key"
                  @click="buttonClicked(key)"
                />
              </div>
            </div>
            <!-- Crypto Available -->
            <div class="display-grid cryptoAvailable full-width justify-center">
              <label class="text-subtitle2 text-white">{{
                `${getFixed(selectedCoin.amount, selectedCoin.precision)} ${
                  selectedCoin.symbol
                } Available`
              }}</label>
            </div>

            <!-- Next Button -->
            <div
              class="networkinfo flex-center full-width"
              style="display:flex;"
            >
              <q-btn
                class="text-white text-subtitle2 q-mx-md nextBtn flex-center"
                :style="
                  `height: 50px; background:linear-gradient(120deg, #1DD1FE, #8946DF);  display:flex`
                "
                flat
                no-caps
                label="Next"
                :disable="sendAmountValue === 0"
                @click="nextPressed()"
              />
            </div>
          </div>
        </q-page-container>
      </q-layout>
    </q-card>
    <SendToAddress
      :showSendToAddressDlg.sync="showSendToAddressDlg"
      :selectedCoin="selectedCoin"
      :sendAmount="sendCoinAmount"
    />
  </q-dialog>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import moment from "moment";
import SendToAddress from "./SendToAddress";
import { setInterval } from "timers";
import { isNumber } from "util";

export default {
  props: ["showSendAmountDlg", "showHistoryDlg", "selectedCoin"],
  data() {
    return {
      keyboard: ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "←"],
      sendAmount: "0",
      sendPercentage: 0,
      coinInput: true,
      showSendToAddressDlg: false,
      inputWidth: 50
    };
  },
  components: {
    SendToAddress
  },
  computed: {
    ...mapGetters("account", ["isAuthenticated", "accountName"]),
    showDlg: {
      get() {
        return this.showSendAmountDlg;
      },
      set(value) {
        this.$emit("update:showSendAmountDlg", value);
      }
    },
    cardHeight() {
      return window.innerHeight - 100;
    },
    amountFontSize() {
      return Math.min(50, window.innerWidth / (this.sendAmount.length + 1));
    },
    sendAmountValue() {
      return Number(this.sendAmount.replace(",", ""));
    },
    sendCoinAmount() {
      if (!this.selectedCoin) {
        return 0;
      }
      if (this.coinInput) {
        return this.sendAmountValue;
      }
      return this.getFixed(
        this.sendAmountValue / this.selectedCoin.price,
        this.selectedCoin.precision
      ).replace(",", "");
    }
  },
  methods: {
    selectCoin(coin) {
      this.showShareAddressDlg = true;
      this.selectedCoin = coin;
    },
    changeCoinInput() {
      if (this.coinInput) {
        this.sendAmount = this.getFixed(
          this.sendAmountValue * this.selectedCoin.price,
          8
        ).replace(",", "");
      } else {
        this.sendAmount = this.getFixed(
          this.sendAmountValue / this.selectedCoin.price,
          this.selectedCoin.precision
        ).replace(",", "");
      }

      this.coinInput = !this.coinInput;
      this.inputValue = `${!this.coinInput ? "$ " : ""}${this.sendAmount}${
        this.coinInput ? " " + this.selectedCoin.symbol : ""
      }`;
    },
    buttonClicked(key) {
      if (key === ".") {
        if (!this.sendAmount.includes(".")) {
          this.sendAmount += ".";
        }
      } else if (key === "←") {
        if (this.sendAmount.length > 1) {
          this.sendAmount = this.sendAmount.slice(0, -1);
        } else {
          this.sendAmount = "0";
        }
      } else {
        if (this.sendAmount === "0") {
          this.sendAmount = key;
        } else {
          this.sendAmount += key;
        }
      }

      if (this.coinInput && this.sendAmountValue > this.selectedCoin.amount) {
        this.sendAmount = this.selectedCoin.amount.toString();
      } else if (
        !this.coinInput &&
        this.sendAmountValue >
          this.selectedCoin.amount * this.selectedCoin.price
      ) {
        this.sendAmount = (
          this.selectedCoin.amount * this.selectedCoin.price
        ).toString();
      }
    },
    nextPressed() {
      this.showSendToAddressDlg = true;
    }
  },
  mounted() {
    this.$root.$on("successfully_sent", (sendAmount, toAddress) => {
      this.showSendToAddressDlg = false;
    });
  },
  watch: {
    showSendAmountDlg: function(val, oldVal) {
      if (val) {
        this.coinInput = true;
        this.sendAmount = "0";
      } else if (!this.showHistoryDlg) {
        this.$emit("update:selectedCoin", null);
      }
    },
    sendAmount: function(val, oldVal) {
      setInterval(() => {
        const widthElement = this.$refs.widthElement;
        this.inputWidth = widthElement ? widthElement.clientWidth + 5 : 50;
      }, 1);

      if (this.sendAmount != oldVal) {
        if (this.coinInput && this.sendAmountValue > this.selectedCoin.amount) {
          this.sendAmount = this.selectedCoin.amount.toString();
        } else if (
          !this.coinInput &&
          this.sendAmountValue >
            this.selectedCoin.amount * this.selectedCoin.price
        ) {
          this.sendAmount = (
            this.selectedCoin.amount * this.selectedCoin.price
          ).toString();
        } else if (val.charAt(val.length - 1) !== ".") {
          const cleanStr = val.replace(/\s/g, "");
          const num = parseFloat(cleanStr) || 0;
          const maxValue = Math.max(0, num);
          if (this.sendAmountValue !== maxValue) {
            this.sendAmount = Math.max(0, num).toString();
          }
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
.amount-div {
  display: inline-flex;
  justify-content: space-between;
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
.amount {
  color: #fafafa;
  margin-top: 7rem;
  margin-bottom: 2rem;
  font-size: 1.5rem;
}
.cryptoImg {
  position: absolute;
  width: 6rem;
  height: 6rem;
  margin-top: 2rem;
}

.avatarBackground {
  display: flex;
  position: relative;
  left: 50%;
  margin-left: -4rem;
  margin-top: 0.5rem;
  /* margin-bottom: -1rem; */
}

.cryptoAvailable {
  margin-bottom: 3rem;
  font-size: 2rem;
}

.nextBtn {
  margin-top: 0.5rem;
  width: 600px;
  margin-bottom: 1rem;
}

@media only screen and (min-width: 1000px) {
}
</style>
