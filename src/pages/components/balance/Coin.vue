<template>
  <div>
    <q-list>
      <q-item v-for="i in [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]" :key="i"
        clickable v-ripple class="list-item">
        <q-item-section avatar top>
          <q-avatar size="45px" class="q-my-sm">
            <img src="https://cdn.quasar.dev/img/boy-avatar.png">
          </q-avatar>
        </q-item-section>
        
        <q-item-section>
          <div class="text-black text-left display-grid">
            <label class="text-subtitle1 text-weight-medium text-blue-grey-10 h-20">Bitcoin</label>
            <label class="text-subtitle2 text-grey-5">BTC</label>
          </div>
        </q-item-section>
        
        <q-item-section side>
          <div class="text-black text-right display-grid">
            <label class="text-subtitle1 text-weight-medium text-blue-grey-10 h-20">$16.38</label>
            <label class="text-caption text-grey-6">0.00028906</label>
          </div>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

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