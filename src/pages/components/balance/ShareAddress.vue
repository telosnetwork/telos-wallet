<template>
  <q-dialog
    v-if="selectedCoin"
    v-model="showDlg"
    persistent
    :maximized="true"
    transition-show="slide-left"
    transition-hide="slide-right"
  >
    <q-card class="full-height main-card">
      <q-layout
        view="hHh Lpr fff"
        container
        class="shadow-4 coinview"
      >
        <q-header class="bg-white text-grey-8 q-pa-sm">
          <q-toolbar class="no-padding">
            <q-toolbar-title class="absolute full-width no-padding text-center">
              <div class="display-grid">
                <label class="text-subtitle1 text-weight-medium h-20">{{`Receive ${selectedCoin.symbol}`}}</label>
                <label class="text-subtitle2 text-grey-4">Share your address</label>
              </div>
            </q-toolbar-title>
            <q-btn round flat dense v-close-popup icon="west"/>
          </q-toolbar>
        </q-header>
        <q-page-container>
          <q-card class="column qr-card text-center q-mx-auto q-my-md q-pa-lg no-shadow" :style="`height: ${cardHeight}px;`">
            <q-space/>
            <div>
              <q-r-canvas :options="{data: accountName, cellSize: 8}"/>
            </div>
            <div>{{accountName}}</div>
            <q-space/>
            <q-space/>
            <div>Share address</div>
          </q-card>
        </q-page-container>
        <div class="text-center text-grey-6">Transactions may take a few minutes to complete</div>
      </q-layout>
    </q-card>
  </q-dialog>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import moment from 'moment';
import { QRCanvas } from 'qrcanvas-vue';

export default {
  props: ['showShareAddressDlg', 'selectedCoin'],
  data() {
    return {
      searchCoinName: '',
    }
  },
  components: {
    QRCanvas,
  },
  computed: {
    ...mapGetters('account', ['isAuthenticated', 'accountName']),
    searchCoins() {
      return this.coins.filter((coin) => {
        return coin.name.toLowerCase().includes(this.searchCoinName.toLowerCase())
            || coin.symbol.toLowerCase().includes(this.searchCoinName.toLowerCase());
      });
    },
    cardHeight() {
       return window.innerHeight - 150;
    },
    showDlg: {
      get() {
        return this.showShareAddressDlg;
      },
      set(value) {
        this.$emit('update:showShareAddressDlg', value);
      },
    },
  },
};
</script>

<style scoped>
.toolbar-title {
  position: absolute;
  text-align: center;
}
.display-grid {
  display: grid;
}
.h-20 {
  height: 20px;
}
.main-card {
  background-image: linear-gradient(white, #f0f0f0);
}
.qr-card {
  width: 85%;
  border-radius: 20px;
}
</style>