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
          Earn up to 130% APR.
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
          Available: {{ selectedCoin.nativeBalance }}
          {{ selectedCoin.symbol }}
        </div>
        <div
          v-if="!staking"
          @click="amount = selectedCoin.rexBalance"
          class="q-mt-md"
        >
          Deposited: {{ selectedCoin.rexBalance }}
          {{ selectedCoin.symbol }}
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
            :label="staking ? 'Start Earning' : 'Return Funds'"
            @click="staking ? tryStake() : tryUnstake()"
          />
        </div>
        <div v-if="staking" class="q-mt-sm">
          This will lock your tokens for 4 days
        </div>
      </div>
    </div>
  </q-dialog>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import moment from "moment";
import { stakeRex } from "src/store/rex/actions";

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

    async stakeRex() {
      let quantityStr = `${Number(this.amount).toFixed(4)} TLOS`;
      const actions = [
        {
          account: "eosio",
          name: "deposit",
          data: {
            owner: this.accountName,
            amount: quantityStr,
          },
        },
        {
          account: "eosio",
          name: "buyrex",
          data: {
            from: this.accountName,
            amount: quantityStr,
          },
        },
      ];
      const transaction = await this.$store.$api.signTransaction(
        actions,
        `Deposit ${this.amount} TLOS to REX`
      );
    },

    async unstakeRex() {
      let quantityStr = `${Number(this.amount).toFixed(4)} TLOS`;
      let accountInfo = await this.$store.$api.getAccount(this.accountName);
      //   console.log(accountInfo);
      let totalRex = Number(accountInfo.rex_info.rex_balance.split(" ")[0]);
      let portionToUnstake = Number(this.amount) / this.selectedCoin.rexBalance;
      let rexToUnstake = (totalRex * portionToUnstake).toFixed(4);

      //   TODO check maturities
      const actions = [
        {
          account: "eosio",
          name: "sellrex",
          data: {
            from: this.accountName,
            rex: `${rexToUnstake} REX`,
          },
        },
        {
          account: "eosio",
          name: "withdraw",
          data: {
            owner: this.accountName,
            amount: quantityStr,
          },
        },
      ];
      const transaction = await this.$store.$api.signTransaction(
        actions,
        `Withdraw ${this.amount} TLOS from REX`
      );
    },

    async tryStake() {
      try {
        await this.stakeRex();
        this.$q.notify({
          type: "primary",
          message: `${this.amount} TLOS is staked to REX`,
        });
        this.amount = "0";
        this.staking = true;
        this.showDlg = false;
      } catch (error) {
        console.error(error);
        this.$errorNotification(error);
      }
    },

    async tryUnstake() {
      try {
        await this.unstakeRex();
        this.$q.notify({
          type: "primary",
          message: `${this.amount} TLOS is withdrawn from REX`,
        });
        this.amount = "0";
        this.staking = true;
        this.showDlg = false;
      } catch (error) {
        console.error(error);
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
