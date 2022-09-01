<template>
  <q-dialog
    v-model="showDlg"
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
        <div class="text-h5 text-weight-medium text-center q-mt-lg ">
          EVM Withdraw
        </div>
        <div />
      </div>
      <div class="popupBody text-center">
        <div class="text-center text-subtitle2 text-grey-4">
          Withdraw your TLOS from the EVM,<br />
          fast, free and instant.
        </div>
        <div class="text-center q-mt-md">
          <div class="inputAmount row items-center ">
            <input
              type="text"
              class="col text-weight-regular text-right no-border no-outline transparent text-white"
              v-model="withdrawAmount"
              @focus="
                withdrawAmount = withdrawAmount === '0' ? '' : withdrawAmount
              "
              @blur="inputBlur"
            />
            <label class="text-weight-regular q-ml-sm text-left">
              TLOS
            </label>
          </div>
          <div @click="withdrawAmount=evmTLOSBalance" class="">Max: {{ evmTLOSBalance }}</div>
        </div>
        <div class="row justify-center q-mt-md q-mb-lg">
          <q-btn
            class="purpleGradient withdrawBtn"
            no-caps
            rounded
            label="Withdraw"
            @click="withdraw"
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
  props: ["showWithdrawEVMDlg", "evmTLOSBalance"],
  data() {
    return {
      withdrawAmount: "0"
    };
  },
  computed: {
    ...mapGetters("account", ["isAuthenticated", "accountName"]),
    showDlg: {
      get() {
        return this.showWithdrawEVMDlg;
      },
      set(value) {
        this.$emit("update:showWithdrawEVMDlg", value);
      }
    }
  },
  methods: {
    inputBlur() {
      if (isNaN(this.withdrawAmount)) this.withdrawAmount = "0";
      else this.withdrawAmount = Number(this.withdrawAmount).toString();
    },
    async withdraw() {
      let amount = parseFloat(this.withdrawAmount);
      if (amount > parseFloat(this.evmTLOSBalance)) {
        this.$q.notify({
          type: "negative",
          message: `Cannot withdraw more than EVM TLOS balance: ${this.evmTLOSBalance}`
        });
        return;
      }

      let quantityStr = `${amount.toFixed(4)} TLOS`;
      let actions = [];

      actions.push({
        account: "eosio.evm",
        name: "withdraw",
        data: {
          to: this.accountName.toLowerCase(),
          quantity: quantityStr
        }
      });

      try {
        const transaction = await this.$store.$api.signTransaction(
          actions,
          `Deposit ${quantityStr} to the EVM`
        );
        this.$q.notify({
          type: "primary",
          message: `${quantityStr} is withdrawn from the EVM`
        });
        this.$emitter.emit("successfully_withdrew", quantityStr);
        this.showDlg = false;
      } catch (error) {
        this.$errorNotification(error);
      }
    }
  },
  watch: {}
};
</script>

<style lang="scss" scoped>

.exitBtn {
  position: absolute;
}
.withdrawBtn {
  flex-basis: 15rem;
  height: 3rem;
}
</style>
