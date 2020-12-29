<template>
  <q-dialog
    v-model="showDlg"
    persistent
    :maximized="true"
    transition-show="slide-left"
    transition-hide="slide-right"
  >
    <q-card class="bg-white full-height">
      <q-layout
        view="hhh Lpr fFf"
        container
        class="shadow-4 coinview"
      >
        <q-header class="bg-white text-grey-8 q-pa-sm">
          <q-toolbar class="no-padding">
            <q-toolbar-title class="absolute full-width no-padding text-center">
              <label class="text-subtitle1 text-weight-medium h-20">{{`${sendAmount} ${selectedCoin.symbol}`}}</label>
            </q-toolbar-title>
            <q-btn round flat dense v-close-popup class="text-grey-6" icon="west"/>
            <q-btn
              flat
              dense
              class="q-ml-auto q-mr-sm text-grey-6"
              label="Next"
              @click="nextPressed()"
            />
          </q-toolbar>
          <q-list>
            <q-item class="list-item">
              <q-item-section side>To:</q-item-section>
              <q-item-section>
                <q-input
                  v-model="toAddress"
                  dense
                  borderless
                  class="bg-grey-1 round-sm q-pl-sm"
                  :label="`username or ${selectedCoin.name} address`"
                />
              </q-item-section>
              <q-item-section side>
                <q-btn round flat size="12px" class="text-grey-5 q-mr-none" icon="qr_code_scanner" />
              </q-item-section>
            </q-item>
            <q-item class="list-item">
              <q-item-section side>Notes:</q-item-section>
              <q-item-section>
                <q-input
                  v-model="notes"
                  dense
                  borderless
                  class="bg-grey-1 round-sm q-pl-sm"
                  label="notes"
                />
              </q-item-section>
            </q-item>
            <q-item-label header class="text-center">Show results from your contacts</q-item-label>
          </q-list>
        </q-header>
        <q-page-container>
          <q-list>
            <q-item-label header class="text-center"> </q-item-label>
          </q-list>
        </q-page-container>
      </q-layout>
    </q-card>
    <SendConfirm :showSendConfirmDlg.sync="showSendConfirmDlg" :selectedCoin="selectedCoin" :sendAmount="sendAmount" :toAddress="toAddress" :notes="notes"/>
  </q-dialog>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import moment from 'moment';
import SendConfirm from './SendConfirm';

export default {
  props: ['showSendToAddressDlg', 'selectedCoin', 'sendAmount'],
  data() {
    return {
      toAddress: '',
      notes: '',
      showSendConfirmDlg: false,
    }
  },
  components: {
    SendConfirm,
  },
  computed: {
    ...mapGetters('account', ['isAuthenticated', 'accountName']),
    showDlg: {
      get() {
        return this.showSendToAddressDlg;
      },
      set(value) {
        this.$emit('update:showSendToAddressDlg', value);
      },
    },
  },
  methods: {
    ...mapActions('account', ['accountExists']),
    async nextPressed() {
      if (this.toAddress.length === 0) {
        this.$q.notify({
          type: 'dark',
          message: `Please fill the username or ${this.selectedCoin.name} address`,
        });
        return;
      }
      if (!(await this.accountExists(this.toAddress))) {
        this.$q.notify({
          type: 'negative',
          message: `Account ${this.toAddress} does not exist`,
        });
        return;
      }
      this.showSendConfirmDlg = true;
    },
  },
  mounted() {
    this.$root.$on('successfully_sent', (sendAmount, toAddress) => {
      this.showSendConfirmDlg = false;
    });
  },
  watch: {
    showSendToAddressDlg: function(val, oldVal) {
      if (val) {
        this.toAddress = '';
        this.notes = '';
      }
    },
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
</style>