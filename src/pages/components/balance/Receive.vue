<template>
  <q-dialog
    v-model="showReceiveDlg"
      persistent
      :maximized="true"
      transition-show="slide-up"
      transition-hide="slide-down"
      @before-hide="$emit('updateShowReceiveDlg', false)"
    >
    <q-card class="bg-white full-height main-div">
      <q-layout
        view="hhh Lpr fFf"
        container
        class="shadow-4 coinview"
        :style="`margin-left: ${coinViewMargin}px; margin-right: ${coinViewMargin}px; width: auto;`"
      >
        <q-header class="bg-white text-grey-8 q-pa-sm">
          <q-toolbar class="no-padding">
            <q-toolbar-title class="absolute full-width no-padding text-center">
              <div class="display-grid">
                <label class="text-subtitle1 text-weight-medium h-20">Receive</label>
                <label class="text-subtitle2 text-grey-4">Select a coin</label>
              </div>
            </q-toolbar-title>
            <q-btn round flat dense v-close-popup icon="close"/>
          </q-toolbar>
          <q-input v-model="searchCoin" label="Search coin" dense borderless class="bg-grey-2 round-sm q-pl-sm"/>
        </q-header>
        <q-page-container>
          <q-item-label header>Suggested</q-item-label>
          <q-btn v-for="i in [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]" :key="i" outline no-caps color="grey-2" class="no-border full-width">
            <q-avatar
              size="45px"
              class="q-my-sm"
            >
              <img src="https://cdn.quasar.dev/img/boy-avatar.png">
            </q-avatar>
            <div class="text-black q-ml-md text-left display-grid">
              <label class="text-subtitle1 text-weight-medium text-blue-grey-10 h-20">
                Bitcoin
              </label>
              <label class="text-subtitle2 text-grey-5">
                BTC
              </label>
            </div>
            <q-space/>
            <div class="text-black q-ml-md text-right display-grid">
              <label class="text-subtitle1 text-weight-medium text-blue-grey-10 h-20">
                $16.38
              </label>
              <label class="text-caption text-grey-6">
                0.00028906
              </label>
            </div>
          </q-btn>
        </q-page-container>
      </q-layout>
    </q-card>
  </q-dialog>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import moment from 'moment';

export default {
  props: ['showReceiveDlg'],
  data() {
    return {
      searchCoin: '',
    }
  },
  model: {
    prop: 'showReceiveDlg',
    event: 'updateShowReceiveDlg',
  },
  computed: {
    ...mapGetters('account', ['isAuthenticated']),
    ...mapGetters('global', ['footerHeight', 'minSpace', 'maxSpace']),
  },
  methods: {
    ...mapActions('account', ['getUserProfile']),
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
</style>