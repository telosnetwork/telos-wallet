<template>
  <q-dialog
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
              Confirm Send
            </div>
            <div />
          </div>
          <div class="text-h5 text-center">
            {{
              `${getFixed(sendAmount, selectedCoin.precision)} ${
                selectedCoin.symbol
              }`
            }}
          </div>
          <div>
            <div class="column items-center ">
              <div class="confirmGrid q-py-lg q-gutter-y-sm">
                <div class="text-weight-bold">To</div>
                <div class="lt-md">{{ toAddressShort }}</div>
                <!-- <div class="gt-sm">{{ toAddress }}</div> -->
                <div v-if="networkType !== 'telos'" class="text-weight-bold">
                  Network Fee
                </div>
                <div v-if="networkType !== 'telos'">
                  {{ `$ ${getFixed(gasFee * selectedCoin.price, 8)}` }}
                </div>
                <div class="text-weight-bold">Total</div>
                <div>
                  {{ `$ ${getFixed(sendAmount * selectedCoin.price, 8)}` }}
                </div>
              </div>
              <div
                v-if="
                  selectedCoin.symbol === 'TLOS' && networkType === 'ethereum'
                "
                class="text-caption text-grey-8 cursor-pointer text-center q-mt-xl"
                @click="
                  copyToClipboard('0x7825e833D495F3d1c28872415a4aee339D26AC88')
                "
              >
                Ethereum Wallet users: to view TLOS balance in wallet, add TLOS
                with contract address:
                0x7825e833D495F3d1c28872415a4aee339D26AC88
              </div>
              <div class="text-center">
                <q-btn
                  class="purpleGradient text-white text-subtitle2 nextBtn flex-center"
                  flat
                  no-caps
                  label="Confirm send"
                  :disable="sendAmount === 0"
                  @click="confirm()"
                />
              </div>
            </div>
          </div>
          <div />
        </div>
      </div>
    </div>
    <div
      v-if="sending"
      class="justify-center absolute flex"
      style="background: rgba(0, 0, 0, 0.4);"
    >
      <q-spinner-dots class="q-my-auto" color="primary" size="40px" />
    </div>
  </q-dialog>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import moment from "moment";
import { networkInterfaces } from "os";
import BigNumber from "bignumber.js";

export default {
  props: [
    "showSendConfirmDlg",
    "selectedCoin",
    "sendAmount",
    "toAddress",
    "notes",
    "networkType"
  ],
  data() {
    return {
      sending: false,
      gasPrice: new BigNumber(0)
    };
  },
  computed: {
    ...mapGetters("account", ["isAuthenticated", "accountName"]),
    showDlg: {
      get() {
        return this.showSendConfirmDlg;
      },
      set(value) {
        this.$emit("update:showSendConfirmDlg", value);
      }
    },
    cardHeight() {
      return window.innerHeight - 200;
    },
    toAddressShort() {
      if (this.toAddress.length <= 12) {
        return this.toAddress
      } else {
        return `${this.toAddress.slice(0, 10)}..${this.toAddress.slice(-10)}`;
      }
    },
    gasFee() {
      return this.gasPrice
        .times(21000)
        .div(1e18)
        .toFixed(4);
    }
  },
  methods: {
    ...mapActions("evm", ["getGasPrice"]),
    amountFontSize() {
      return Math.min(50, window.innerWidth / (this.sendAmount.length + 1));
    },
    async confirm() {
      // console.log(this.selectedCoin);
      this.sending = true;
      let actions = [];
      const quantityStr = `${parseFloat(this.sendAmount).toFixed(
        this.selectedCoin.precision
      )} ${this.selectedCoin.symbol}`;
      if (this.networkType === "telos") {
        actions.push({
          account: this.selectedCoin.account,
          name: "transfer",
          data: {
            from: this.accountName.toLowerCase(),
            to: this.toAddress,
            quantity: quantityStr,
            memo: this.notes
          }
        });
      } else if (this.networkType === "tevm") {
        try {
          if (this.selectedCoin.name === "Telos EVM") {
            const rawTrx = await this.$root.tEVMApi.transfer({
              account: this.accountName,
              sender: this.$root.tEVMAccount.address,
              to: this.toAddress,
              quantity: quantityStr,
              returnRaw: true
            }, {
              gasLimit: 21000
            });
            actions.push({
              account: process.env.EVM_CONTRACT,
              name: "raw",
              data: {
                ram_payer: this.accountName.toLowerCase(),
                tx: rawTrx,
                estimate_gas: false,
                sender: this.$root.tEVMAccount.address.substring(2)
              }
            });
          } else {
            try {
              const accountAddress = await this.$root.tEVMApi.telos.getEthAccount(
                this.toAddress.toLowerCase()
              );
            } catch (error) {
              actions.push({
                account: process.env.EVM_CONTRACT,
                name: "openwallet",
                data: {
                  account: this.accountName.toLowerCase(),
                  address: this.toAddress.slice(2)
                }
              });
            }

            actions.push({
              account: this.selectedCoin.account,
              name: "transfer",
              data: {
                from: this.accountName.toLowerCase(),
                to: process.env.EVM_CONTRACT,
                quantity: quantityStr,
                memo: this.toAddress
              }
            });
          }
        } catch {
          this.$q.notify({
            type: "negative",
            message: `Failed to send ${quantityStr} to ${this.toAddress}`
          });
          this.sending = false;
          return;
        }
      } else if (this.networkType === "ethereum") {
        actions.push({
          account: "eosio.token",
          name: "transfer",
          data: {
            from: this.accountName.toLowerCase(),
            to: "xeth.ptokens",
            quantity: quantityStr,
            memo: this.toAddress
          }
        });
      } else if (this.networkType === "ptoken") {
        actions.push({
          account: this.selectedCoin.account,
          name: "redeem",
          data: {
            sender: this.accountName.toLowerCase(),
            memo: this.toAddress,
            quantity: quantityStr
          }
        });
      }
      try {
        const transaction = await this.$store.$api.signTransaction(
          actions,
          `Send ${quantityStr} to ${this.toAddress}`
        );
        this.$q.notify({
          type: "primary",
          message: `${quantityStr} is sent to ${this.toAddress}`
        });
        this.$root.$emit("successfully_sent", this.sendAmount, this.toAddress);
      } catch (error) {
        this.$errorNotification(error);
      }
      this.sending = false;
    },
    copyToClipboard(str) {
      var el = document.createElement("textarea");
      el.value = str;
      el.setAttribute("readonly", "");
      el.style = { display: "none" };
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);

      this.$q.notify({
        type: "primary",
        message: "Copied it to the clipboard successfully"
      });
    }
  },
  async mounted() {
    this.gasPrice = new BigNumber("0x" + (await this.getGasPrice()));
  }
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
.to-address {
  width: 0px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  padding-top: inherit;
  padding-bottom: inherit;
}
.confirmGrid {
  display: grid;
  grid-template-columns: 7rem auto;
}
</style>
