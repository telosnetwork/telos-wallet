<template>
  <q-dialog
    v-model="showDlg"
    persistent
    :maximized="true"
    transition-show="slide-up"
    transition-hide="slide-down"
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
              <label class="text-subtitle1 text-weight-medium h-20">Send</label>
            </q-toolbar-title>
            <q-btn round flat dense v-close-popup icon="west"/>
          </q-toolbar>
        </q-header>
        <q-page-container>
          <q-list>
              <q-item>
                <q-input
                  v-model="receiverAddress"
                  dense
                  borderless
                  class="bg-grey-2 round-sm q-pl-sm"
                  :label="`username or ${selectedCoin.name} address`"
                />
              </q-item>
              <q-item clickable v-ripple class="list-item">
                <q-item-section>
                  <div class="text-black text-left display-grid">
                    <label class="text-subtitle1 text-weight-medium text-blue-grey-10 h-20">asd</label>
                    <label class="text-subtitle2 text-grey-5">bda</label>
                  </div>
                </q-item-section>
              </q-item>
          </q-list>
        </q-page-container>
      </q-layout>
    </q-card>
  </q-dialog>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import moment from 'moment';

export default {
  props: ['showSendToAddressDlg', 'selectedCoin', 'sendAmount'],
  data() {
    return {
      receiverAddress: '',
    }
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
    // selectCoin(coin) {
    //   this.$emit('update:showSendToAddressDlg', true);
    //   this.$emit(`update:selectedCoin`, coin);
    // },
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