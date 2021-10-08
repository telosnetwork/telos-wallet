<template>
  <q-dialog
    v-model="showDlg"
    persistent
    :maximized="true"
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="bg-white" style="max-width: 800px; height:25%; margin: auto; padding-top: .75rem;
    border-radius: 5px !important;">
      <q-layout
        view="hhh Lpr fFf"
        container
        class="shadow-4 coinview"
      >
        <q-header class="bg-white text-grey-8 q-pa-sm">
          <q-toolbar class="no-padding">
            <q-toolbar-title class="absolute full-width no-padding text-center">
              <div class="display-grid">
                <label class="text-subtitle1 text-weight-medium h-20">EVM Withdraw</label>
                <label class="text-subtitle2 text-grey-4">Withdraw your TLOS from the EVM, fast, free and instant.</label>
              </div>
            </q-toolbar-title>
            <q-btn round flat dense v-close-popup class="text-grey-6" icon="close"/>
          </q-toolbar>
        </q-header>
        <q-page-container style="width:25%; margin:auto;">
          <q-input outlined
                   v-model="withdrawAmount"
                   label="Withdraw amount"
                   placeholder="0.0000"
                   >
          </q-input>
          <div style="text-align:center; margin-top:.25rem; color: rgba(0, 0, 0, 0.54);">Max: {{evmTLOSBalance}}</div>
          <q-btn  style="display:block; margin: 2rem auto auto auto;" color="primary" no-caps label="Withdraw" @click="withdraw"/>
        </q-page-container>
      </q-layout>
    </q-card>
  </q-dialog>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import moment from 'moment';

export default {
  props: ['showWithdrawEVMDlg', 'evmTLOSBalance'],
  data() {
    return {
      withdrawAmount: '',
    }
  },
  computed: {
    ...mapGetters('account', ['isAuthenticated', 'accountName']),
    showDlg: {
      get() {
        return this.showWithdrawEVMDlg;
      },
      set(value) {
        this.$emit('update:showWithdrawEVMDlg', value);
      },
    },
  },
  methods: {
    async withdraw() {
      let amount = parseFloat(this.withdrawAmount);
      if (amount > parseFloat(this.evmTLOSBalance)) {
        this.$q.notify({
          type: 'negative',
          message: `Cannot withdraw more than EVM TLOS balance: ${this.evmTLOSBalance}`,
        });
        return;
      }

      let quantityStr = `${amount.toFixed(4)} TLOS`;
      let actions = [];

      actions.push({
        account: 'eosio.evm',
        name: 'withdraw',
        data: {
          to: this.accountName.toLowerCase(),
          quantity: quantityStr,
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
            message: `${quantityStr} is withdrawn from the EVM`,
          });
          this.$root.$emit('successfully_withdrew', quantityStr);
        }
      } else {
        this.$q.notify({
          type: 'negative',
          message: `Failed to withdraw ${quantityStr} from EVM`,
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
