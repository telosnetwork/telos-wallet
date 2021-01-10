<template>
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
              <label class="text-subtitle1 text-weight-medium">dApps</label>
            </div>
          </q-toolbar-title>
        </q-toolbar>
        <q-input v-model="searchDappName" label="Search dApp" dense borderless class="bg-grey-2 round-sm q-pl-sm"/>
      </q-header>
      <q-page-container>
        <q-infinite-scroll @load="loadMoreDapps" :offset="100">
          <div v-for="dapp in searchDapps" :key="dapp.name">
            <q-item clickable v-ripple class="list-item">
              <q-item-section avatar>
                <q-avatar size="45px" class="q-my-sm justify-center">
                  <img :src="dapp.iconSmallUrl">
                </q-avatar>
              </q-item-section>

              <q-item-section style="justify-content: start; display: grid;">
                <div class="text-black text-left display-grid">
                  <label class="text-subtitle2 text-weight-medium text-blue-grey-10 h-20 self-end">{{dapp.name}}</label>
                  <label class="text-caption text-grey-5">{{dapp.teaser}}</label>
                </div>
              </q-item-section>

              <q-item-section side>
                <div class="text-black text-right display-grid">
                  <label class="text-subtitle2 text-weight-medium text-blue-grey-10 h-20">{{dapp.platform}}</label>
                  <label class="text-caption text-grey-6">{{dapp.categories.join(',')}}</label>
                </div>
              </q-item-section>
            </q-item>
          </div>
          <template v-if="!loadedAll" v-slot:loading>
            <div class="row justify-center q-my-md">
              <q-spinner-dots color="primary" size="40px" />
            </div>
          </template>
        </q-infinite-scroll>
      </q-page-container>
    </q-layout>
  </q-card>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import moment from 'moment';

export default {
  data() {
    return {
      dapps: [],
      searchDappName: '',
      page: 1,
      loadedAll: false,
    }
  },
  computed: {
    ...mapGetters('account', ['isAuthenticated', 'accountName']),
    searchDapps() {
      return this.dapps.filter((dapp) => {
        return dapp.name.toLowerCase().includes(this.searchDappName.toLowerCase())
            || dapp.teaser.toLowerCase().includes(this.searchDappName.toLowerCase());
      });
    },
  },
  methods: {
    async loadMoreDapps(index, done) {
      if (this.loadedAll) return;
      const response = await fetch(`https://api.stateofthedapps.com/dapps?page=${this.page}&sort=rank&order=asc`);
      const json = await response.json();
      this.dapps.push(...json.items);
      this.page += 1;
      if (json.items.length === 0) {
        this.loadedAll = true;
      }
      done();
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
</style>