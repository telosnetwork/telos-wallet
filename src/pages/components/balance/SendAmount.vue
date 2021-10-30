<template>
  <q-dialog
    v-model="showDlg"
    persistent
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <div class="main-background" v-if="selectedCoin">
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
              Send Amount
            </div>
            <div />
          </div>
          <div class="inputContainer">
            <q-avatar class="coinAvatar" size="5rem">
              <img :src="selectedCoin.icon" />
              <div
                v-if="selectedCoin.name == 'Telos EVM'"
                class="flex absolute full-width full-height"
              >
                <img
                  class="flex q-ml-auto"
                  alt="tEVM"
                  src="~assets/evm_logo.png"
                  style="width: 50%; height: 50%; margin-right: -10%; margin-bottom: -5%;"
                />
              </div>
            </q-avatar>
            <!-- <img class="avatarBackground" src="~assets/avatarBackground.svg" /> -->
            <!-- Amount Shown -->
            <!-- <div class="amount q-pt-sm">Amount</div> -->
            <!-- <label
              ref="widthElement"
              :style="
                `display: fit-content; position: absolute; font-size: ${amountFontSize}px;`
              "
            >
              {{ sendAmount }}
            </label> -->
            <div class="desktop-only flex flex-center">
              <label
                class="text-weight-regular q-mr-sm"
                :style="`font-size: ${amountFontSize}px; color: ${themeColor}`"
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
                  `font-size: ${amountFontSize}px; color: white; z-index: 1; width: 300px; margin-left: -200px`
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
            <div class="mobileAmountContainer  full-width  mobile-only">
              <label
                class="text-weight-regular"
                :style="
                  `font-size: ${amountFontSizeMobile}px; color: ${themeColor}`
                "
              >
                {{
                  coinInput
                    ? `${sendAmount} ${selectedCoin.symbol}`
                    : `$${sendAmount}`
                }}
              </label>
            </div>
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

            <!-- Exchange persentage -->
            <q-btn-group class="q-mt-sm" push unelevated rounded>
              <q-btn
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
            <!-- Crypto Available -->
            <div class="text-center q-pt-xs q-pb-l ">
              <label class="text-subtitle2 text-white">{{
                `${getFixed(selectedCoin.amount, selectedCoin.precision)} ${
                  selectedCoin.symbol
                } Available`
              }}</label>
            </div>
            <div class="keypad  q-py-md mobile-only">
              <div
                v-for="key in keyboard"
                :key="key"
                class="keypadKey text-h5"
                :label="key"
                @click="buttonClicked(key)"
              >
                <div>{{ key }}</div>
              </div>
            </div>

            <!-- Next Button -->
            <q-btn
              class="purpleGradient text-white text-subtitle2 nextBtn flex-center"
              flat
              no-caps
              label="Next"
              :disable="sendAmountValue === 0"
              @click="nextPressed()"
            />
          </div>
        </div>
      </div>
    </div>
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
    amountFontSizeMobile() {
      return Math.min(40, window.innerWidth / (this.sendAmount.length + 1));
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

<style lang="scss" scoped>
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
  font-size: 1.2rem;
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

.inputContainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  height: 400px;
  @media only screen and (max-height: 800px) {
    height: 90%;
  }
}
.keypad {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr 1fr;
  width: 100%;
  height: 100%;
}

.keypadKey {
  display: grid;
  place-items: center;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  &:active {
    background-color: #00000021;
  }
  // width: 30%;
  // height: 3rem;
  // bg-transparent text-white q-mx-auto q-my-auto text-h5
}
.mobileAmountContainer {
  height: 8rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
