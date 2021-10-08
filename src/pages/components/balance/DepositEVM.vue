<template>
  <q-dialog
    v-model="showDlg"
    persistent
    :maximized="true"
    :full-height="false"
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="bg-white full-height" style="max-width: 800px; margin: auto;">
      <q-layout
        view="hhh Lpr fFf"
        container
        class="shadow-4 coinview"
      >
        <q-header class="bg-white text-grey-8 q-pa-sm">
          <q-toolbar class="no-padding">
            <q-toolbar-title class="absolute full-width no-padding text-center">
              <div class="display-grid">
                <label class="text-subtitle1 text-weight-medium h-20">EVM Deposit</label>
                <label style="margin-top:.25rem;" class="text-subtitle2 text-grey-4">Deposit your TLOS into the EVM, fast, free and instant.</label>
              </div>
            </q-toolbar-title>
            <q-btn round flat dense v-close-popup class="text-grey-6" icon="close"/>
          </q-toolbar>
        </q-header>
        <q-page-container style="width:25%; margin:auto;">
          <q-input outlined
                   v-model="depositAmount"
                   label="Deposit amount"
                   placeholder="0.0000"
                   :dense="dense">
          </q-input>
          <div style="text-align:center; margin-top:.25rem; color: rgba(0, 0, 0, 0.54);">Max: {{nativeTLOSBalance}}</div>
          <q-btn  style="display:block; margin: 2rem auto auto auto;" color="primary" no-caps label="Deposit" @click="deposit"/>
        </q-page-container>
      </q-layout>
    </q-card>
  </q-dialog>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import moment from 'moment';

export default {
  props: ['showDepositEVMDlg', 'nativeTLOSBalance'],
  data() {
    return {
      amount: '',
      depositAmount: ''
    }
  },
  computed: {
    ...mapGetters('account', ['isAuthenticated', 'accountName']),
    showDlg: {
      get() {
        return this.showDepositEVMDlg;
      },
      set(value) {
        this.$emit('update:showDepositEVMDlg', value);
      },
    },
    haveEVMAccount() {
      return this.$root.tEVMAccount && this.$root.tEVMAccount.address;
    }
  },
  methods: {
    async deposit() {
      debugger;
      let amount = parseFloat(this.depositAmount);
      if (amount > parseFloat(this.nativeTLOSBalance)) {
        this.$q.notify({
          type: 'negative',
          message: `Cannot deposit more than native TLOS balance: ${this.nativeTLOSBalance}`,
        });
        return;
      }

      let quantityStr = `${amount.toFixed(4)} TLOS`;
      let actions = [];
      if (!this.haveEVMAccount) {
        actions.push({
          account: 'eosio.evm',
          name: 'create',
          data: {
            account: this.accountName.toLowerCase(),
            data: 'create'
          }
        })
      }

      actions.push({
        account: 'eosio.token',
        name: 'transfer',
        data: {
          from: this.accountName.toLowerCase(),
          to: 'eosio.evm',
          quantity: quantityStr,
          memo: ''
        }
      })

      const transaction = await this.$store.$api.signTransaction(actions, `Deposit ${quantityStr} to the EVM`);
      if (transaction) {
        if (transaction === 'needAuth') {
          this.$q.notify({
            type: 'negative',
            message: `Authentication is required`,
          });
        } else if (transaction === 'error') {
          this.$q.notify({
            type: 'negative',
            message: `Transaction failed. Make sure authentication is done correctly.`,
          });
        } else if (transaction !== 'cancelled') {
          this.$q.notify({
            type: 'primary',
            message: `${quantityStr} is deposited to the EVM`,
          });
          this.$root.$emit('successfully_deposited', quantityStr);
        }
      } else {
        this.$q.notify({
          type: 'negative',
          message: `Failed to send ${quantityStr} to ${this.toAddress}`,
        });
      }

    }
  },
  watch: {
  },
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
