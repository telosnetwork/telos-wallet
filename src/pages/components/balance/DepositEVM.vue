<template>
  <q-dialog
    v-model="showDlg"
    :full-height="false"
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
          EVM Deposit
        </div>
        <!-- <div class="text-center q-gutter-y-xs">
        </div> -->
        <div />
      </div>
      <div class="text-center">
        <div class="text-subtitle2 text-grey-4">
          Deposit your TLOS into the EVM, fast, free and instant.
        </div>
        <div class="text-center">
          <div class="inputAmount row items-center ">
            <input
              type="text"
              class="col text-weight-regular text-right no-border no-outline transparent text-white"
              v-model="depositAmount"
              @focus="
                depositAmount = depositAmount === '0' ? '' : depositAmount
              "
              @blur="depositBlur"
            />
            <label class="text-weight-regular q-ml-sm text-left">
              TLOS
            </label>
          </div>
          <!-- <q-input
            bg-color="secondary"
            rounded
            outlined
            v-model="depositAmount"
            label="Deposit amount"
            placeholder="0.0000"
          /> -->
          <div class="">Max: {{ nativeTLOSBalance }}</div>
        </div>
        <q-btn
          class="purpleGradient q-mt-lg"
          no-caps
          rounded
          label="Deposit"
          @click="deposit"
        />
        <div v-if="!haveEVMAccount" class="q-mt-md">
          NOTE: This is your first deposit so an additional “create” action will
          be included
        </div>
      </div>
      <!-- <q-layout view="hhh Lpr fFf" container class="">
        <q-header class="bg-dark q-pa-sm">
          <q-toolbar class="no-padding">
            <q-toolbar-title class="absolute full-width no-padding text-center">
              <div class="display-grid">
                <label class="text-subtitle1 text-weight-medium h-20"
                  >EVM Deposit</label
                >
                <label class="text-subtitle2 text-grey-4"
                  >Deposit your TLOS into the EVM, fast, free and
                  instant.</label
                >
              </div>
            </q-toolbar-title>
            <q-btn
              round
              flat
              dense
              v-close-popup
              class="text-grey-6"
              icon="close"
            />
          </q-toolbar>
        </q-header>
        <q-page-container class="column items-center q-gutter-y-md">
          <q-input
            bg-color="secondary"
            rounded
            outlined
            v-model="depositAmount"
            label="Deposit amount"
            placeholder="0.0000"
          >
          </q-input>
          <div style="text-align:center;">Max: {{ nativeTLOSBalance }}</div>
          <q-btn
            class="purpleGradient"
            no-caps
            label="Deposit"
            @click="deposit"
          />
          <div v-if="!haveEVMAccount">
            NOTE: This is your first deposit so an additional “create” action
            will be included
          </div>
        </q-page-container>
      </q-layout> -->
    </div>
  </q-dialog>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import moment from "moment";

export default {
  props: ["showDepositEVMDlg", "nativeTLOSBalance", "haveEVMAccount"],
  data() {
    return {
      amount: "",
      depositAmount: "0"
    };
  },
  computed: {
    ...mapGetters("account", ["isAuthenticated", "accountName"]),
    showDlg: {
      get() {
        return this.showDepositEVMDlg;
      },
      set(value) {
        this.$emit("update:showDepositEVMDlg", value);
      }
    }
  },
  methods: {
    depositBlur() {
      if (isNaN(this.depositAmount)) this.depositAmount = "0";
      else this.depositAmount = Number(this.depositAmount).toString();
    },
    async deposit() {
      let amount = parseFloat(this.depositAmount);
      if (amount > parseFloat(this.nativeTLOSBalance)) {
        this.$q.notify({
          type: "negative",
          message: `Cannot deposit more than native TLOS balance: ${this.nativeTLOSBalance}`
        });
        return;
      }

      let quantityStr = `${amount.toFixed(4)} TLOS`;
      let actions = [];
      if (!this.haveEVMAccount) {
        actions.push({
          account: "eosio.evm",
          name: "create",
          data: {
            account: this.accountName.toLowerCase(),
            data: "create"
          }
        });
      }

      actions.push({
        account: "eosio.token",
        name: "transfer",
        data: {
          from: this.accountName.toLowerCase(),
          to: "eosio.evm",
          quantity: quantityStr,
          memo: ""
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
            message: `${quantityStr} is deposited to the EVM`
          });
          this.$root.$emit("successfully_deposited", quantityStr);
        }
      } else {
        this.$q.notify({
          type: "negative",
          message: `Failed to deposit ${quantityStr} to EVM`
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
.wraplabel {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.inputAmount {
  font-size: 3rem;
  z-index: 1;
  label {
    width: 50%;
  }
}
</style>
