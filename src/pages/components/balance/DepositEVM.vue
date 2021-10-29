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
              @blur="inputBlur"
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
        <div class="q-mt-md row justify-center">
          <div
            class="depositAddressToggle q-mb-md"
            v-if="depositOwnAddress"
            @click="depositOwnAddress = false"
          >
            + Deposit to a different address
          </div>
          <div
            class="depositAddressToggle"
            v-else
            @click="depositOwnAddress = true"
          >
            - Deposit to myself
          </div>
        </div>
        <div v-if="!depositOwnAddress" class="row justify-center">
          <q-input
            v-model="recipientAddress"
            label="Recipient"
            dense
            rounded
            class="q-pt-xs col-11"
            standout="bg-transparent text-white"
            label-color="white"
            color="white"
            input-class="text-white"
            @input="checkRecipientExist"
            @focus="checkRecipientExist"
            :rules="[
              val =>
                (val.slice(0, 2) === '0x' && val.length === 42) ||
                'Invalid address'
            ]"
          />
        </div>
        <q-btn
          class="purpleGradient"
          no-caps
          rounded
          label="Deposit"
          @click="deposit"
        />
        <div class="row justify-center q-mt-md">
          <div v-if="!haveEVMAccount && depositOwnAddress" class="note">
            NOTE: This is your first deposit so an additional “create” action
            will be included
          </div>
          <div
            v-if="
              !recipientAddressExists &&
                !depositOwnAddress &&
                recipientAddress != ''
            "
            class="note"
          >
            NOTE: The recipient address does not exist so an additional “create”
            action will be included
          </div>
        </div>
      </div>
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
      depositAmount: "0",
      depositOwnAddress: false,
      recipientAddress: "",
      recipientAddressExists: true
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
    inputBlur() {
      if (isNaN(this.depositAmount)) this.depositAmount = "0";
      else this.depositAmount = Number(this.depositAmount).toString();
    },
    async checkRecipientExist() {
      try {
        _ = await this.$root.tEVMApi.telos.getEthAccount(
          this.recipientAddress.toLowerCase()
        );
        this.recipientAddressExists = true;
      } catch (error) {
        this.recipientAddressExists = false;
      }
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
      let memo = "";
      if (this.depositOwnAddress) {
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
      } else {
        memo = this.recipientAddress.toLowerCase();
        await this.checkRecipientExist();
        if (!this.recipientAddressExists) {
          actions.push({
            account: process.env.EVM_CONTRACT,
            name: "openwallet",
            data: {
              account: this.accountName.toLowerCase(),
              address: this.recipientAddress.slice(2)
            }
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
          memo: memo
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
          if (!this.depositOwnAddress) {
            this.depositOwnAddress = true;
            this.recipientAddress = "";
          }
          this.$root.$emit("successfully_deposited", quantityStr);
          this.showDlg = false;
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
.depositAddressToggle {
  cursor: pointer;
  color: $lightBlue;
}
.note {
  max-width: 25rem;
}
</style>
