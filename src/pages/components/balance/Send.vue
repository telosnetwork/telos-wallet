<template>
  <q-dialog class="main-background"
    v-model="showDlg"
    persistent
    :maximized="true"
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="full-height main-background" style="max-width: auto; margin: auto;">
      <q-layout
        view="hhh Lpr fFf"
        container
        class="shadow-4 coinview main-background-overlay"
      >
<!-- Header -->
        <q-header class="text-white q-pa-sm" style="background: #00000000" >
          <q-toolbar class="no-padding">
            <q-toolbar-title class="absolute full-width no-padding text-center">
              <div class="display-grid ">
                <label class="text-subtitle1 text-weight-medium h-20 text-white">Send</label>
                <label class="text-subtitle2 text-white">Select a coin</label>
              </div>
            </q-toolbar-title>

<!-- Back Button -->
            <q-btn round flat dense v-close-popup class="text-white closebBtn" icon="west"/>
          
          </q-toolbar>
          <q-input 
          v-model="searchCoinName" 
          label="Search coin" 
          dense
          class="round-sm q-pl-sm" 
          standout="bg-transparent text-white" 
          label-color="white" S
          color="white" 
          input-class="text-white"/>
        </q-header>
        <q-page-container>
          <q-list>
            <div v-for="(coin, index) in searchCoins" :key="`${coin.name}_${index}`">
              <q-item-label v-if="index === 0 && coin.suggested" header class="text-subtitle1 text-weight-medium text-white">Suggested</q-item-label>
              <q-item-label v-if="index === searchCoins.findIndex(c => !c.suggested) && !coin.suggested" header>All coins</q-item-label>
              <q-item clickable v-ripple class="list-item" @click="selectCoin(coin)">
                <q-item-section avatar>
                  <q-avatar size="45px" class="q-my-sm">
                    <img :src="coin.icon">
                  </q-avatar>
                </q-item-section>

                <q-item-section style="justify-content: start; display: grid;">
                  <div class="text-white text-left display-grid">
                    <label class="text-subtitle1 text-weight-medium text-white h-20 self-end wraplabel">{{coin.name}}</label>
                    <label class="text-subtitle2 text-white wraplabel">{{coin.symbol}}</label>
                  </div>
                </q-item-section>

                <q-item-section side>
                  <div class="text-white text-right display-grid">
                    <label class="text-subtitle1 text-weight-medium text-white h-20">{{`${getFixed(coin.amount, 8)} ${coin.symbol}`}}</label>
                    <label class="text-caption text-white">${{getFixed(coin.amount * coin.price, 2)}}</label>
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
  props: ['showSendDlg', 'coins', 'selectedCoin', 'showSendAmountDlg'],
  data() {
    return {
      searchCoinName: '',
    }
  },
  computed: {
    ...mapGetters('account', ['isAuthenticated', 'accountName']),
    searchCoins() {
      return this.availbleCoins.filter((coin) => {
        return coin.name.toLowerCase().includes(this.searchCoinName.toLowerCase())
            || coin.symbol.toLowerCase().includes(this.searchCoinName.toLowerCase());
      });
    },
    availbleCoins() {
      return this.coins.filter(coin => coin.amount > 0);
    },
    showDlg: {
      get() {
        return this.showSendDlg;
      },
      set(value) {
        this.$emit('update:showSendDlg', value);
      },
    },
  },
  methods: {
    selectCoin(coin) {
      this.$emit('update:showSendAmountDlg', true);
      this.$emit(`update:selectedCoin`, coin);
    },
  },
  watch: {
    showSendDlg: function(val, oldVal) {
      if (val) {
        this.searchCoinName = '';
      } else {
        this.$emit('update:selectedCoin', null);
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

.closebBtn{
  border: 2px solid white;
}

.main-background {
  background: #020039;
}

.main-background-overlay {
   background:  url("~assets/MainBG.svg");
   background-repeat: no-repeat;
   background-size: cover;
}
</style>