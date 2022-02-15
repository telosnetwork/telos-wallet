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
        <div class="text-h5 text-weight-medium text-center q-mt-lg">
          Network Resources
        </div>
        <div />
      </div>
      <div class="text-center">
        <div class="text-subtitle2 text-grey-4 text-center q-mb-sm">
          Stake CPU and NET for processing transactions. RAM is used for storing
          data on the blockchain.
        </div>
        <div class="fit row wrap justify-center items-start content-center">
          <!-- CPU -->
          <div class="col">
            <div
              class="fit column wrap justify-center items-center content-center"
            >
              <q-circular-progress
                show-value
                font-size="12px"
                :value="value"
                size="50px"
                :thickness="0.22"
                color="teal"
                track-color="grey-3"
                class="q-ma-md"
              >
                {{ 50 }}%
              </q-circular-progress>

              <div>CPU</div>
              <div>x KB/ x KB</div>
              <div>Total Staked: xx</div>
              <div>Staked by other: xx</div>
            </div>
          </div>
          <!-- NET -->
          <div class="col">
            <div
              class="fit column wrap justify-center items-center content-center"
            >
              <q-circular-progress
                show-value
                font-size="12px"
                :value="value"
                size="50px"
                :thickness="0.22"
                color="teal"
                track-color="grey-3"
                class="q-ma-md"
              >
                {{ 50 }}%
              </q-circular-progress>

              <div>NET</div>
              <div>x KB/ x KB</div>
              <div>Total Staked: xx</div>
              <div>Staked by other: xx</div>
            </div>
          </div>
          <!-- RAM -->
          <div class="col">
            <div
              class="fit column wrap justify-center items-center content-center"
            >
              <q-circular-progress
                show-value
                font-size="12px"
                :value="usedRAM/totalRAM*100"
                size="50px"
                :thickness="0.22"
                color="teal"
                track-color="grey-3"
                class="q-ma-md"
              >
                {{ (usedRAM/totalRAM * 100).toFixed(0) }}%
              </q-circular-progress>

              <div>RAM</div>
              <div>
                {{(usedRAM/1024).toFixed(2)}} KB /
                {{(totalRAM/1024).toFixed(2)}} KB
              </div>
            </div>
          </div>
        </div>

        <div
          class="q-mt-md fit row wrap justify-center items-center content-center"
        >
          <q-select
            class="q-mr-sm"
            rounded
            standout
            v-model="selectedResource"
            :options="resourceOptions"
          />
          <q-input
            class="q-mr-sm"
            rounded
            outlined
            v-model="amount"
            label="Amount in TLOS"
          />
          <q-btn @click="buyResource()" rounded color="primary" label="Stake" />
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
  props: ["showManageResourcesDlg", "haveEVMAccount", "selectedCoin"],
  data() {
    return {
      amount: 0,
      selectedResource: 'RAM', //ram,cpu,net
      resourceOptions: [
        "RAM", "CPU", "NET"
      ],
      accountInfo: []
    };
  },
  computed: {
    ...mapGetters("account", ["isAuthenticated", "accountName"]),
    showDlg: {
      get() {
        return this.showManageResourcesDlg;
      },
      set(value) {
        this.$emit("update:showManageResourcesDlg", value);
      },
    },

    totalRAM() {
        if (this.accountInfo) {
          return this.accountInfo.ram_quota;
        } else {
            return 0;
        }
    },
    availRAM() {
        if (this.accountInfo) {
            return this.accountInfo.ram_quota - this.accountInfo.ram_usage;
        } else {
            return 0;
        }
    },
    usedRAM() {
        if (this.accountInfo) {
            return this.accountInfo.ram_usage;
        } else {
            return 0;
        }

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
  async mounted() {
    this.accountInfo = await this.$store.$api.getAccount(this.accountName);
    console.log(this.accountInfo)
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
