<template>
  <q-dialog
    v-model="showDlg"
    persistent
    :maximized="true"
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
                <label class="text-subtitle2 text-grey-4">Deposit your TLOS into the EVM, fast, free and instant.</label>
              </div>
            </q-toolbar-title>
            <q-btn round flat dense v-close-popup class="text-grey-6" icon="close"/>
          </q-toolbar>
        </q-header>
        <q-page-container>
          <q-input outlined
                   v-model="depositAmount"
                   label="Deposit amount"
                   placeholder="0.0000"
                   :hint="`Max: ${nativeTLOSBalance}`"
                   :dense="dense" />
          <q-btn stretch flat no-caps label="Deposit" @click="deposit"/>
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
      depsoitAmount: ''
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
    deposit() {
      let amount = parseFloat(this.amount);
      if (amount > 1)
        debugger;
      let quantityStr = ''
      let actions = [];
      if (!this.haveEVMAccount) {
        actions.push({
          account: 'eosio.evm',
          name: 'create',
          data: {
            from: this.accountName.toLowerCase(),
            to: this.toAddress,
            quantity: quantityStr,
            memo: this.notes
          }
        })
      }

      actions.push({
        account: 'eosio.token',
        name: 'transfer',
        data: {
          from: this.accountName.toLowerCase(),
          to: 'eosio.evm',
          quantity: amountStr,
          memo: ''
        }
      })


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
