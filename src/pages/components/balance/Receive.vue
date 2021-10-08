<template>
  <q-dialog
    v-model="showDlg"
    persistent
    :maximized="true"
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="full-height" style="max-width: 800px; margin: auto; ">
      <q-layout
        view="hhh Lpr fFf"
        container
        class="shadow-4 coinview"
        :style="`background: linear-gradient(to bottom, #130C3F, #8946DF 200%)`"
      >
        <q-header class=" text-white q-pa-sm" style="background: #180F46" >
          <q-toolbar class="no-padding">
            <q-toolbar-title class="absolute full-width no-padding text-center">
              <div class="display-grid">
                <label class="text-subtitle1 text-weight-medium h-20">Receive</label>
                <label class="text-subtitle2 text-grey-4">Select a coin</label>
              </div>
            </q-toolbar-title>
            <q-btn round flat dense v-close-popup class="text-white closebBtn" icon="close"/>
          </q-toolbar>
          <q-input v-model="searchCoinName" label="Search coin" dense borderless class="bg-grey-2 round-sm q-pl-sm"/>
        </q-header>
        <q-page-container>
          <q-list>
            <div v-for="(coin, index) in searchCoins" :key="`${coin.name}_${index}`">
              <q-item-label v-if="index === 0 && coin.suggested" header style="">Suggested</q-item-label>
              <q-item-label v-if="index === searchCoins.findIndex(c => !c.suggested) && !coin.suggested" header>All coins</q-item-label>
              <q-item clickable v-ripple class="list-item" @click="selectCoin(coin)">
                <q-item-section avatar>
                  <q-avatar size="45px" class="q-my-sm">
                    <img :src="coin.icon">
                  </q-avatar>
                </q-item-section>

                <q-item-section style="justify-content: start; display: grid;">
                  <div class="text-white text-left display-grid">
                    <label class="text-subtitle1 text-weight-small text-white h-20 self-end wraplabel">{{coin.name}}</label>
                    <label class="text-subtitle2 text-white wraplabel">{{coin.symbol}}</label>
                  </div>
                </q-item-section>

                <q-item-section side>
                  <div class="text-black text-right display-grid">
                    <label class="text-subtitle1 text-weight-small text-white h-20">{{`${getFixed(coin.amount, 8)} ${coin.symbol}`}}</label>
                    <label class="text-caption text-grey-6">${{getFixed(coin.amount * coin.price, 2)}}</label>
                  </div>
                </q-item-section>
              </q-item>
            </div>
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
  props: ['showReceiveDlg', 'coins', 'selectedCoin', 'showShareAddressDlg'],
  data() {
    return {
      searchCoinName: '',
    }
  },
  computed: {
    ...mapGetters('account', ['isAuthenticated', 'accountName']),
    searchCoins() {
      return this.coins.filter((coin) => {
        return coin.name.toLowerCase().includes(this.searchCoinName.toLowerCase())
            || coin.symbol.toLowerCase().includes(this.searchCoinName.toLowerCase());
      });
    },
    showDlg: {
      get() {
        return this.showReceiveDlg;
      },
      set(value) {
        this.$emit('update:showReceiveDlg', value);
      },
    },
  },
  methods: {
    selectCoin(coin) {
      this.$emit(`update:showShareAddressDlg`, true);
      this.$emit(`update:selectedCoin`, coin);
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
  /* border: 1px solid #fafafa; */
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

.receiveGrid{
  background-color: #00000000;
  border-top-left-radius: 15px;
  border-top-right-radius: 15px;
  border-bottom-left-radius: unset;
  border-bottom-left-radius: unset;

}

.closebBtn{
  border: 2px solid white;
}
</style>