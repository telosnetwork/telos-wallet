<template>
  <q-dialog
    v-model="showDlg"
    :full-height="false"
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <div class="popupCard">
      <div class="exitBtn">
        <q-btn
          round
          flat
          dense
          v-close-popup
          class="text-grey-6"
          icon="close"
        />
      </div>
      <div class="popupHeading">
        <div />
        <div class="text-h5 text-weight-medium text-center q-mt-lg">REX</div>
        <div />
      </div>
      <div class="text-center">
        <div class="text-subtitle2 text-grey-4 text-center q-mb-sm">
          Earn up to 130% APR
        </div>
        <q-btn-toggle
          v-model="staking"
          color="grey"
          toggle-color="primary"
          rounded
          no-caps
          :options="[
            { label: 'Start Earning', value: true },
            { label: 'Return Funds', value: false },
          ]"
        />
        <div
          v-if="staking"
          @click="amount = selectedCoin.nativeBalance"
          class="q-mt-md"
        >
          Available: {{ selectedCoin.nativeBalance }} {{ selectedCoin.symbol }}
        </div>
        <div
          v-if="!staking"
          @click="amount = selectedCoin.rexBalance"
          class="q-mt-md"
        >
          Deposited: {{ selectedCoin.rexBalance }} {{ selectedCoin.symbol }}
        </div>
        <div class="text-center q-mt-md">
          <div class="inputAmount row items-center">
            <input
              type="text"
              class="col text-weight-regular text-right no-border no-outline transparent text-white"
              v-model="amount"
              @focus="amount = amount === '0' ? '' : amount"
              @blur="inputBlur"
            />
            <label class="text-weight-medium q-ml-sm text-left"> TLOS </label>
          </div>
        </div>
        <div class="q-my-md">
          <q-btn
            class="q-mx-xs"
            color="secondary"
            outline
            rounded
            label="25%"
            @click="
              amount = (
                staking
                  ? selectedCoin.nativeBalance * 0.25
                  : selectedCoin.rexBalance * 0.25
              ).toFixed(4)
            "
          />
          <q-btn
            class="q-mx-xs"
            color="secondary"
            outline
            rounded
            label="50%"
            @click="
              amount = (
                staking
                  ? selectedCoin.nativeBalance * 0.5
                  : selectedCoin.rexBalance * 0.5
              ).toFixed(4)
            "
          />
          <q-btn
            class="q-mx-xs"
            color="secondary"
            outline
            rounded
            label="75%"
            @click="
              amount = (
                staking
                  ? selectedCoin.nativeBalance * 0.75
                  : selectedCoin.rexBalance * 0.75
              ).toFixed(4)
            "
          />
          <q-btn
            class="q-mx-xs"
            color="secondary"
            outline
            rounded
            label="100%"
            @click="
              amount = (
                staking
                  ? selectedCoin.nativeBalance
                  : selectedCoin.rexBalance * 1
              ).toFixed(4)
            "
          />
        </div>
        <div class="row justify-center">
          <q-btn
            class="purpleGradient depositBtn"
            no-caps
            rounded
            label="Start Earning"
            @click="staking ? tryStake() : tryUnstake()"
          />
        </div>
      </div>
    </div>
  </q-dialog>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import moment from "moment";

export default {
  props: ["showRexStakeDlg", "haveEVMAccount", "selectedCoin"],
  data() {
    return {
      amount: 0,
      staking: true,
    };
  },
  computed: {
    ...mapGetters("account", ["isAuthenticated", "accountName"]),
    showDlg: {
      get() {
        return this.showRexStakeDlg;
      },
      set(value) {
        this.$emit("update:showRexStakeDlg", value);
      },
    },
  },
  methods: {
    ...mapActions("rex", ["getRexBalance"]),

    inputBlur() {
      if (isNaN(this.amount)) this.amount = "0";
      else this.amount = Number(this.amount).toString();
    },
    async deposit() {
      let amount = parseFloat(this.amount);
      if (amount > parseFloat(this.selectedCoin.nativeBalance)) {
        this.$q.notify({
          type: "negative",
          message: `Cannot deposit more than native TLOS balance: ${this.selectedCoin.nativeBalance}`,
        });
        return;
      }

      let quantityStr = `${amount.toFixed(4)} TLOS`;
      let actions = [];
      let memo = "";
      if (this.depositOwnAddress) {
        if (!this.haveEVMAccount) {
          actions.push({
            account: "eosio.evm",
            name: "create",
            data: {
              account: this.accountName.toLowerCase(),
              data: "create",
            },
          });
        }
      } else {
        memo = this.recipientAddress.toLowerCase();
        await this.checkRecipientExist();
        if (!this.recipientAddressExists) {
          actions.push({
            account: process.env.EVM_CONTRACT,
            name: "openwallet",
            data: {
              account: this.accountName.toLowerCase(),
              address: this.recipientAddress.slice(2),
            },
          });
        }
      }

      actions.push({
        account: "eosio.token",
        name: "transfer",
        data: {
          from: this.accountName.toLowerCase(),
          to: "eosio.evm",
          quantity: quantityStr,
          memo: memo,
        },
      });

      try {
        const transaction = await this.$store.$api.signTransaction(
          actions,
          `Deposit ${quantityStr} to the EVM`
        );
        this.$q.notify({
          type: "primary",
          message: `${quantityStr} is deposited to the EVM`,
        });
        this.amount = "0";
        this.depositOwnAddress = false;
        this.recipientAddress = "";
        this.recipientAddressExists = true;
        this.$root.$emit("successfully_deposited", quantityStr);

        this.showDlg = false;
      } catch (error) {
        this.$errorNotification(error);
      }
    },
  },
  watch: {},
  async mounted() {},
};
</script>

<style lang="scss" scoped>
.depositAddressToggle {
  cursor: pointer;
}
.lightBlue {
  color: $lightBlue;
}
.note {
  max-width: 25rem;
}
.depositBtn {
  flex-basis: 15rem;
  height: 3rem;
}
// .popupCard {
//   position: relative;
// }
.exitBtn {
  position: absolute;
  // right: 0px;
}
</style>
