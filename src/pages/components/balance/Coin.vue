<template>
  <div>
    <q-list>
      <q-item v-for="coin in coins"
        :key="coin.name"
        clickable
        v-ripple
        class="list-item"
      >
        <q-item-section avatar top>
          <q-avatar size="45px" class="q-my-sm">
            <img :src="coin.icon">
          </q-avatar>
        </q-item-section>
        
        <q-item-section>
          <div class="text-black text-left display-grid">
            <label class="text-subtitle1 text-weight-medium text-blue-grey-10 h-20">{{coin.name}}</label>
            <label class="text-subtitle2 text-grey-5">{{coin.symbol}}</label>
          </div>
        </q-item-section>
        
        <q-item-section side>
          <div class="text-black text-right display-grid">
            <label class="text-subtitle1 text-weight-medium text-blue-grey-10 h-20">{{`${coin.amount} ${coin.symbol}`}}</label>
            <label class="text-caption text-grey-6">${{coin.amount * coin.price}}</label>
          </div>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  props: ['coins'],
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
</style>