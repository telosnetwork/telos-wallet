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
        <div class="text-h5 text-weight-medium text-center q-mt-lg">Staking (REX)</div>
        <div />
      </div>
      <div class="text-center">
        <div class="text-subtitle2 text-grey-4 text-center q-mb-sm">
          Earn up to 13% APR.
        </div>
        <q-btn-toggle
          v-model="staking"
          color="dark"
          toggle-color="dark"
          toggle-text-color="white"
          text-color="grey-7"
          rounded
          no-caps
          :options="[
            { label: 'Stake', value: true },
            { label: 'Unstake', value: false },
          ]"
        />
        <div v-if="staking" @click="amount = tokenAmount" class="q-mt-md">
          Available: {{ tokenAmount }}
          {{ "TLOS" }}
        </div>
        <div v-if="!staking" @click="amount = tokenRexBalance" class="q-mt-md">
          Deposited: {{ tokenRexBalance }}
          {{ "TLOS" }}
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
                staking ? tokenAmount * 0.25 : tokenRexBalance * 0.25
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
                staking ? tokenAmount * 0.5 : tokenRexBalance * 0.5
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
                staking ? tokenAmount * 0.75 : tokenRexBalance * 0.75
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
              amount = (staking ? tokenAmount : tokenRexBalance * 1).toFixed(4)
            "
          />
        </div>
        <div class="row justify-center">
          <q-btn
            class="purpleGradient depositBtn"
            no-caps
            rounded
            :label="staking ? 'Stake Now' : 'Unstake Now'"
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
      tokenAmount: 0,
      tokenRexBalance: 0,
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
      let totalRex = Number(accountInfo.rex_info.rex_balance.split(" ")[0]);
      let portionToUnstake = Number(this.amount) / this.tokenRexBalance;
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
  async mounted() {
    //   TODO get rex apr from api, cors issues
    //       fetch("https://api.staker.one/v1/telos/apr", {
    //   mode: 'cors',
    //   headers: {
    //     'Access-Control-Allow-Origin':'*'
    //   }})
    //     .then(res => res.json())
    //     .then(json => {
    //       console.log(json);
    //     });
    this.tokenRexBalance = await this.getRexBalance(this.accountName);

    const rpc = this.$store.$api.getRpc();
    this.tokenAmount = Number(
      (
        await rpc.get_currency_balance("eosio.token", this.accountName, "TLOS")
      )[0].split(" ")[0]
    );
  },
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
