<template>
  <q-dialog
    v-model="showDlg"
    persistent
    maximized
    transition-show="slide-left"
    transition-hide="slide-right"
  >
    <div v-if="selectedCoin" class="main-background">
      <q-layout view="hhh Lpr fFf" container class="main-background-overlay">
        <div class="dialogPage">
          <div class="dialogPageContent">
            <div class="dialogPageHeading">
              <div>
                <q-btn
                  round
                  flat
                  dense
                  v-close-popup
                  class="closebBtn"
                  icon="west"
                />
              </div>
              <div class="text-subtitle1 text-weight-medium text-center">
                {{ selectedCoin.name }}
              </div>
              <div />
            </div>

            <!-- Crypto History Container -->
            <q-page-container>
              <div class="text-white text-center display-grid">
                <!-- Crypto Image -->
                <div class="absolute" style=" left: 50%; margin-left:-3rem;">
                  <q-item-section avatar class="cryptoImg">
                    <q-avatar size="6rem">
                      <img :src="selectedCoin.icon" />
                    </q-avatar>
                  </q-item-section>
                  <img
                    class="avatarBackground"
                    src="~assets/avatarBackground.svg"
                  />
                </div>

                <!-- Crypto Amount -->
                <label
                  class="cryptoAmount text-h5 text-weight-small text-whhite"
                  >${{
                    getFixed(selectedCoin.amount * selectedCoin.price, 2)
                  }}</label
                >
                <label class="text-caption text-white">{{
                  `${getFixed(selectedCoin.amount, selectedCoin.precision)} ${
                    selectedCoin.symbol
                  }`
                }}</label>
              </div>
              <div class="sendActions row q-my-md">
                <q-btn
                  class="col"
                  flat
                  dense
                  stack
                  size="md"
                  no-caps
                  @click="send"
                >
                  <div class="column">
                    <img src="~assets/send.svg" />
                    Send
                  </div>
                </q-btn>

                <q-btn
                  class="col"
                  flat
                  dense
                  stack
                  size="md"
                  no-caps
                  @click="receive"
                >
                  <div class="column">
                    <img src="~assets/receive.svg" />
                    Receive
                  </div>
                </q-btn>

                <q-btn
                  class="col"
                  v-if="selectedCoin.symbol === 'TLOS'"
                  flat
                  dense
                  stack
                  size="md"
                  no-caps
                  @click="buy"
                >
                  <div class="column">
                    <img src="~assets/Purchase.svg" />
                    Buy
                  </div>
                </q-btn>

                <q-btn
                  class="col"
                  v-if="convertEnabled"
                  flat
                  dense
                  stack
                  size="md"
                  no-caps
                  @click="convert"
                >
                  <div class="column">
                    <img src="~assets/Convert.svg" />
                    Convert
                  </div>
                </q-btn>
              </div>
              <div class="q-pa-md">
                <q-input
                  v-model="searchHistory"
                  borderless
                  label-color="white"
                  color="white"
                  placeholder="Search Transaction History"
                  dense
                  input-style="color: white"
                  input-class="text-white"
                >
                  <template v-slot:append>
                    <img src="~/assets/icons/search.svg" />
                  </template>
                </q-input>
                <q-separator dark class="q-my-sm" />
              </div>
              <q-infinite-scroll @load="loadMoreHistory" :offset="100">
                <div
                  v-for="(history, index) in searchHistories"
                  :key="`${history.block_num}_${index}`"
                >
                  <q-item clickable v-ripple class="list-item">
                    <q-item-section avatar>
                      <q-avatar size="35px" class="q-my-none">
                        <img :src="selectedCoin.icon" />
                      </q-avatar>
                    </q-item-section>

                    <q-item-section
                      style="justify-content: start; display: grid;"
                    >
                      <div class="text-white text-left display-grid">
                        <label
                          class="text-subtitle2 text-weight-medium text-white h-20 self-end wraplabel"
                          >{{ historyData(history).actionName }}</label
                        >
                        <label
                          class="text-caption text-white text-weight-regular wraplabel"
                          >{{ historyData(history).actionDetail }}</label
                        >
                      </div>
                    </q-item-section>

                    <q-item-section side>
                      <div class="text-white text-right display-grid">
                        <label
                          class="text-subtitle2 text-weight-medium text-white h-20"
                          >{{
                            `${getFixed(historyData(history).coinAmount, 4)} ${
                              selectedCoin.symbol
                            }`
                          }}</label
                        >
                        <label class="text-caption text-white"
                          >${{
                            getFixed(historyData(history).usdAmount, 4)
                          }}</label
                        >
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
          </div>
        </div>
      </q-layout>
    </div>
  </q-dialog>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import moment from "moment";

export default {
  props: [
    "showHistoryDlg",
    "selectedCoin",
    "showSendAmountDlg",
    "showBuyAmountDlg",
    "showShareAddressDlg",
    "showExchangeDlg"
  ],
  data() {
    return {
      searchHistory: "",
      accountHistory: [],
      page: 0,
      pageLimit: 10,
      loadedAll: false
    };
  },
  computed: {
    ...mapGetters("account", ["isAuthenticated", "accountName"]),
    showDlg: {
      get() {
        return this.showHistoryDlg;
      },
      set(value) {
        this.$emit("update:showHistoryDlg", value);
      }
    },
    searchHistories() {
      return this.accountHistory.filter(history => {
        const historyData = this.historyData(history);
        return (
          historyData.actionName
            .toLowerCase()
            .includes(this.searchHistory.toLowerCase()) ||
          historyData.actionDetail
            .toLowerCase()
            .includes(this.searchHistory.toLowerCase())
        );
      });
    },
    convertEnabled() {
      return true;
    }
  },
  methods: {
    async loadMoreHistory(index, done) {
      if (this.loadedAll) {
        return;
      }
      const actionHistory = await this.$hyperion.get(
        `/v2/history/get_actions?limit=${this.pageLimit}&skip=${this.page}&account=${this.accountName}&filter=${this.selectedCoin.account}:*`
      );
      this.accountHistory.push(...(actionHistory.data.actions || []));
      this.page += this.pageLimit;
      if (actionHistory.data.actions.length === 0) {
        this.loadedAll = true;
      }
      done();
    },
    send() {
      this.$emit("update:showSendAmountDlg", true);
    },
    receive() {
      this.$emit("update:showShareAddressDlg", true);
    },
    buy() {
      this.$emit("update:showBuyAmountDlg", true);
    },
    convert() {
      this.$emit("update:showExchangeDlg", true);
    },
    sell() {
      // this.$emit('update:showShareAddressDlg', true);
    },
    historyData(history) {
      let actionName = "";
      let actionDetail = "";
      let coinAmount = 0;
      let usdAmount = 0;

      if (history.act.name === "transfer") {
        if (history.act.data.from === this.accountName) {
          actionName = `Sent ${this.selectedCoin.name}`;
          actionDetail = `To ${history.act.data.to}`;
        } else {
          actionName = `Received ${this.selectedCoin.name}`;
          actionDetail = `From ${history.act.data.from}`;
        }
        coinAmount = history.act.data.amount;
      } else if (history.act.name === "redeem") {
        actionName = `Withdraw ${this.selectedCoin.name}`;
        actionDetail = `To ${history.act.data.memo}`;
        coinAmount = Number(
          history.act.data.quantity.split(this.selectedCoin.symbol)[0]
        );
      } else if (history.act.name === "sellram") {
        actionName = "Sold Ram";
        actionDetail = `${history.act.data.bytes} bytes`;
      }
      usdAmount = this.getFixed(coinAmount * this.selectedCoin.price, 2);

      return {
        actionName,
        actionDetail,
        coinAmount,
        usdAmount
      };
    }
  },
  watch: {
    showHistoryDlg: function(val, oldVal) {
      if (val) {
        this.searchHistoryName = "";
        this.page = 0;
        this.accountHistory = [];
        this.loadedAll = false;
      } else {
        this.$emit("update:selectedCoin", null);
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.sendActions {
  // color: #3fa6f5;
  opacity: 0.8;
  button {
    padding: 0.5rem;
    background-color: #ffffff1a;
    margin: 0.1rem;
    border-radius: 0;
    img {
      padding-bottom: 5px;
    }
  }
}
.toolbar-title {
  position: absolute;
  text-align: center;
}
.list-item {
  /* border: 1px solid #fafafa; */
  border-left: none;
  border-right: none;
  // border-top-left-radius: 30px;
  // border-top-right-radius: 30px;
  border-bottom-left-radius: unset;
  border-bottom-left-radius: unset;
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

.cryptoImg {
  position: absolute;
  width: 6rem;
  height: 6rem;
  margin-top: 2rem;
}

.avatarBackground {
  display: flex;
  position: relative;
  left: 50%;
  margin-left: -4rem;
  margin-top: 0.5rem;
  /* margin-bottom: -1rem; */
}

.cryptoAmount {
  margin-top: 10rem;
}

.searchBar {
  width: auto;
  margin-left: 2rem;
  margin-right: 2rem;
  background-color: #462584;
  text-decoration-color: white;
}

.cryptoInfo {
  border-top-left-radius: 30px;
  border-top-right-radius: 30px;
  border-bottom-left-radius: unset;
  border-bottom-left-radius: unset;
}
.dialogPage {
  background-image: none;
}
</style>
