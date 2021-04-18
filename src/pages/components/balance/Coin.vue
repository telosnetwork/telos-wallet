<template>
  <div>
    <q-infinite-scroll>
      <q-item-label header class="text-left text-grey-5">ACTIONS</q-item-label>
      <q-item
        clickable
        v-ripple
        class="list-item"
        @click="clickPurchase()"
      >
        <q-item-section avatar>
          <q-avatar size="45px" class="q-my-sm">
            <img src="~assets/telos-buy.png">
          </q-avatar>
        </q-item-section>
        
        <q-item-section style="justify-content: start; display: grid;">
          <div class="text-black text-left display-grid">
            <label class="text-subtitle1 text-weight-medium text-blue-grey-10 h-20 self-end wraplabel">Purchase crypto</label>
            <label class="text-subtitle2 text-grey-5 wraplabel">Purchase TLOS</label>
          </div>
        </q-item-section>
      </q-item>
      <q-item
        clickable
        v-ripple
        class="list-item"
        @click="clickExchange()"
      >
        <q-item-section avatar>
          <q-avatar size="45px" class="q-my-sm">
            <img src="~assets/telos-swap.png">
          </q-avatar>
        </q-item-section>
        
        <q-item-section style="justify-content: start; display: grid;">
          <div class="text-black text-left display-grid">
            <label class="text-subtitle1 text-weight-medium text-blue-grey-10 h-20 self-end wraplabel">Convert</label>
            <label class="text-subtitle2 text-grey-5 wraplabel">From one crypto to another</label>
          </div>
        </q-item-section>
      </q-item>
      <q-item-label header class="text-left text-grey-5">BALANCE</q-item-label>
      <q-item v-for="(coin, index) in availbleCoins"
        :key="`${coin.name}_${index}`"
        clickable
        v-ripple
        class="list-item"
        @click="selectCoin(coin)"
      >
        <q-item-section avatar>
          <q-avatar size="45px" class="q-my-sm">
            <img :src="coin.icon">
          </q-avatar>
        </q-item-section>
        
        <q-item-section style="justify-content: start; display: grid;">
          <div class="text-black text-left display-grid">
            <label class="text-subtitle1 text-weight-medium text-blue-grey-10 h-20 self-end wraplabel">{{coin.name}}</label>
            <label class="text-subtitle2 text-grey-5 wraplabel">{{coin.symbol}}</label>
          </div>
        </q-item-section>
        
        <q-item-section side>
          <div class="text-black text-right display-grid">
            <label class="text-subtitle1 text-weight-medium text-blue-grey-10 h-20">{{`${getFixed(coin.amount, coin.precision)} ${coin.symbol}`}}</label>
            <label class="text-caption text-grey-6">${{getFixed(coin.amount * coin.price, 2)}}</label>
          </div>
        </q-item-section>
      </q-item>
      <template v-if="!coinLoadedAll" v-slot:loading>
        <div class="row justify-center q-my-md">
          <q-spinner-dots color="primary" size="40px" />
        </div>
      </template>
    </q-infinite-scroll>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  props: ['coins', 'coinLoadedAll', 'showHistoryDlg', 'showExchangeDlg', 'showBuyAmountDlg', 'selectedCoin', 'suggestTokens'],
  computed: {
    availbleCoins() {
      return this.coins.filter(coin => coin.amount > 0 || this.suggestTokens.includes(coin.symbol.toLowerCase()));
    },
  },
  methods: {
    clickPurchase() {
      this.$emit('update:selectedCoin', this.coins.find(coin => coin.symbol === 'TLOS'));
      this.$emit('update:showBuyAmountDlg', true);
    },
    clickExchange() {
      this.$emit('update:showExchangeDlg', true);
    },
    selectCoin(coin) {
      this.$emit('update:selectedCoin', coin);
      this.$emit('update:showHistoryDlg', true);
    },
  }
};
</script>

<style scoped>
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