<template>
  <q-dialog
    v-model="showDlg"
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <div class="popupCard">
      <div class="popupHeading">
        <div>
          <q-btn
            round
            flat
            dense
            v-close-popup
            class="text-grey-6"
            icon="close"
          />
        </div>
        <div class="text-subtitle1 text-weight-medium text-center ">
          EVM Withdraw
        </div>
        <!-- <div class="text-center q-gutter-y-xs">
        </div> -->
        <div />
      </div>
      <div class="text-center">
        <div class="text-subtitle2 text-grey-4">
          Withdraw your TLOS from the EVM, fast, free and instant.
        </div>
        <div class="text-center">
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
          <div class="">Max: {{ evmTLOSBalance }}</div>
        </div>
        <q-btn
          class="purpleGradient q-mt-lg"
          no-caps
          rounded
          label="Withdraw"
          @click="withdraw"
        />
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

      const transaction = await this.$store.$api.signTransaction(
        actions,
        `Deposit ${quantityStr} to the EVM`
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
            message: `Transaction failed. Make sure authentication is done correctly.`
          });
        } else if (transaction !== "cancelled") {
          this.$q.notify({
            type: "primary",
            message: `${quantityStr} is withdrawn from the EVM`
          });
          this.$root.$emit("successfully_withdrew", quantityStr);
        }
      } else {
        this.$q.notify({
          type: "negative",
          message: `Failed to withdraw ${quantityStr} from EVM`
        });
      }
    }
  },
  watch: {}
};
</script>

<style lang="scss" scoped>
.toolbar-title {
  position: absolute;
  text-align: center;
}
.list-item {
  border: 1px solid #fafafa;
  border-left: none;
  border-right: none;
}
.display-grid {
  display: grid;
}
.h-20 {
  height: 20px;
}
.wraplabel {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
