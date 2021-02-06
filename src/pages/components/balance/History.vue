<template>
  <q-dialog
    v-model="showDlg"
    persistent
    :maximized="true"
    transition-show="slide-left"
    transition-hide="slide-right"
  >
    <q-card v-if="selectedCoin" class="bg-white full-height" style="max-width: 800px; margin: auto;">
      <q-layout
        view="hhh Lpr fFf"
        container
        class="shadow-4 coinview"
      >
        <q-header class="bg-white text-grey-8 q-pa-sm">
          <q-toolbar class="no-padding">
            <q-toolbar-title class="absolute full-width no-padding text-center">
              <q-avatar size="20px">
                <img :src="selectedCoin.icon">
              </q-avatar>
              <label class="text-subtitle1 text-weight-medium h-20">
                {{selectedCoin.name}}
              </label>
            </q-toolbar-title>
            <q-btn round flat dense v-close-popup class="text-grey-6" icon="west"/>
          </q-toolbar>
          <div class="text-black text-center display-grid">
            <label class="text-h5 text-weight-medium text-blue-grey-10">${{getFixed(selectedCoin.amount * selectedCoin.price, 8)}}</label>
            <label class="text-caption text-grey-8">{{`${getFixed(selectedCoin.amount, 8)} ${selectedCoin.symbol}`}}</label>
          </div>
          <div class="text-center q-my-md" :style="`color: ${themeColor}; display: flex; opacity: 0.8;`">
            <q-space/>
            <div class="display-grid" style="width: 60px">
              <q-btn round flat dense stack size="sm" label="Send" icon="fas fa-sign-out-alt" @click="send"/>
            </div>
            <q-space/>
            <div class="display-grid" style="width: 60px">
              <q-btn round flat dense stack size="sm" label="Receive" icon="fas fa-sign-in-alt" @click="receive"/>
            </div>
            <q-space/>
          </div>
          <div
            v-if="selectedCoin.symbol === 'TLOS'"
            class="text-center q-my-sm"
            :style="`color: ${themeColor}; display: flex; opacity: 0.8;`"
          >
            <q-space/>
            <div class="display-grid" style="width: 60px">
              <q-btn round flat dense stack size="md" label="Buy" @click="buy"/>
            </div>
            <q-space/>
            <div class="display-grid" style="width: 60px">
              <q-btn round flat dense stack size="md" label="Sell" @click="sell"/>
            </div>
            <q-space/>
          </div>
          <q-input v-model="searchHistory" label="Search Transaction History" dense borderless class="bg-grey-2 round-sm q-pl-sm"/>
        </q-header>
        <q-page-container>
          <q-infinite-scroll @load="loadMoreHistory" :offset="100">
            <div v-for="(history, index) in searchHistories" :key="`${history.block_num}_${index}`">
              <q-item clickable v-ripple class="list-item">
                <q-item-section avatar>
                  <q-avatar size="35px" class="q-my-none">
                    <img :src="selectedCoin.icon">
                  </q-avatar>
                </q-item-section>

                <q-item-section style="justify-content: start; display: grid;">
                  <div class="text-black text-left display-grid">
                    <label class="text-subtitle2 text-weight-medium text-blue-grey-10 h-20 self-end wraplabel">{{historyData(history).actionName}}</label>
                    <label class="text-caption text-grey-5 text-weight-regular wraplabel">{{historyData(history).actionDetail}}</label>
                  </div>
                </q-item-section>

                <q-item-section side>
                  <div class="text-black text-right display-grid">
                    <label class="text-subtitle2 text-weight-medium text-blue-grey-10 h-20">{{`${historyData(history).coinAmount} ${selectedCoin.symbol}`}}</label>
                    <label class="text-caption text-grey-6">${{historyData(history).usdAmount}}</label>
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
  </q-dialog>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import moment from 'moment';

export default {
  props: ['showHistoryDlg', 'selectedCoin', 'showSendAmountDlg', 'showBuyAmountDlg', 'showShareAddressDlg'],
  data() {
    return {
      searchHistory: '',
      accountHistory: [],
      page: 0,
      pageLimit: 10,
      loadedAll: false,
    };
  },
  computed: {
    ...mapGetters('account', ['isAuthenticated', 'accountName']),
    showDlg: {
      get() {
        return this.showHistoryDlg;
      },
      set(value) {
        this.$emit('update:showHistoryDlg', value);
      },
    },
    searchHistories() {
      return this.accountHistory.filter((history) => {
        const historyData = this.historyData(history);
        return historyData.actionName.toLowerCase().includes(this.searchHistory.toLowerCase())
            || historyData.actionDetail.toLowerCase().includes(this.searchHistory.toLowerCase());
      });
    },
  },
  methods: {
    async loadMoreHistory(index, done) {
      if (this.loadedAll) return;
      const actionHistory = await this.$hyperion.get(
        `/v2/history/get_actions?limit=${this.pageLimit}&skip=${this.page}&account=${this.accountName}&filter=${this.selectedCoin.account}:*`
      );
      console.log(actionHistory);
      this.accountHistory.push(...(actionHistory.data.actions || []));
      this.page += this.pageLimit;
      if (actionHistory.data.actions.length === 0) {
        this.loadedAll = true;
      }
      done();
    },
    send() {
      this.$emit('update:showSendAmountDlg', true);
    },
    receive() {
      this.$emit('update:showShareAddressDlg', true);
    },
    buy() {
      this.$emit('update:showBuyAmountDlg', true);
    },
    sell() {
      // this.$emit('update:showShareAddressDlg', true);
    },
    historyData(history) {
      let actionName = '';
      let actionDetail = '';
      let coinAmount = 0;
      let usdAmount = 0;

      if (history.act.name === 'transfer') {
        if (history.act.data.from === this.accountName) {
          actionName = `Sent ${this.selectedCoin.name}`;
          actionDetail = `To ${history.act.data.to}`;
        } else {
          actionName = `Received ${this.selectedCoin.name}`;
          actionDetail = `From ${history.act.data.from}`;
        }
        coinAmount = history.act.data.amount;
      } else if (history.act.name === 'redeem') {
        actionName = `Withdraw ${this.selectedCoin.name}`;
        actionDetail = `To ${history.act.data.memo}`;
        coinAmount = Number(history.act.data.quantity.split(this.selectedCoin.symbol)[0]);
      } else if (history.act.name === 'sellram') {
        actionName = 'Sold Ram';
        actionDetail = `${history.act.data.bytes} bytes`;
      }
      usdAmount = this.getFixed(coinAmount * this.selectedCoin.price, 8);

      return {
        actionName,
        actionDetail,
        coinAmount,
        usdAmount,
      };
    },
  },
  watch: {
    showHistoryDlg: function(val, oldVal) {
      if (val) {
        this.searchHistoryName = '';
        this.page = 0;
        this.accountHistory = [];
        this.loadedAll = false;
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