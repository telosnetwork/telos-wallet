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
          {{$t('components.evm_withdraw')}}
        </div>
        <div />
      </div>
      <div class="popupBody text-center">
        <div class="text-center text-subtitle2 text-grey-4">
          {{$t('components.withdraw_1')}}<br />{{$t('components.withdraw_2')}}
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
              autofocus="true"
            />
            <label class="text-weight-regular q-ml-sm text-left">
              TLOS
            </label>
          </div>
          <div @click="withdrawAmount=evmTLOSBalance" class="">Max: {{ evmTLOSBalance }}</div>
        </div>
        <div class="row justify-center q-mt-md q-mb-lg">
          <q-btn
            :disabled="!(parseFloat(withdrawAmount) > 0)"
            class="purpleGradient withdrawBtn"
            no-caps
            rounded
            :label="$t('components.withdraw')"
            @click="withdraw"
          />
        </div>
      </div>
    </div>
  </q-dialog>
</template>

<script>
import { mapGetters, mapActions } from "vuex";

export default {
  name: 'WithdrawEVM',
  emits: ['updateBalances'],
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
    ...mapActions("account", [
      "setEvmState"
    ]),
    inputBlur() {
      if (isNaN(this.withdrawAmount)) this.withdrawAmount = "0";
      else this.withdrawAmount = Number(this.withdrawAmount).toString();
    },
    async withdraw() {
      let amount = parseFloat(this.withdrawAmount);
      if (amount > parseFloat(this.evmTLOSBalance)) {
        this.$errorNotification(this.$t('components.cannot_withdraw', {balance:this.evmTLOSBalance}));
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
          this.$t('components.deposit_to_evm', {quantity:quantityStr})
        );
        this.$emit("updateBalances");
        this.showDlg = false;
        this.$successNotification(this.$t('components.is_withdrawn_from_evm', {quantity:quantityStr}));
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
