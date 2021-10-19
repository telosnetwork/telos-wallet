<template>
  <q-dialog
    v-model="showDlg"
    persistent
    :maximized="true"
    :full-height="false"
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="dialogCard q-pa-md" style="max-width: 800px; height:25%;">
      <q-layout view="hhh Lpr fFf" container class="">
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
      </q-layout>
    </q-card>
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
      depositAmount: ""
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

<style scoped>
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
