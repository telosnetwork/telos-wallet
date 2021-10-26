<template>
  <q-dialog
    v-model="showDlg"
    persistent
    maximized
    transition-show="slide-left"
    transition-hide="slide-right"
  >
    <div v-if="selectedCoin" class="main-background">
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
            <label class="cryptoAmount text-h5 text-weight-small text-whhite"
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
          <div
            class="text-center q-my-md q-mx-xl"
            :style="`color: #3FA6F5; display: flex; opacity: 0.8;`"
          >
            <q-space />

            <div class="display-grid" style="width: 60px">
              <q-btn
                round
                flat
                dense
                stack
                size="sm"
                label="Send"
                icon="fas fa-sign-out-alt"
                @click="send"
              />
            </div>

            <q-space />
            <q-separator vertical />
            <q-space />

            <div class="display-grid" style="width: 60px">
              <q-btn
                round
                flat
                dense
                stack
                size="sm"
                label="Receive"
                icon="fas fa-sign-in-alt"
                @click="receive"
              />
            </div>

            <q-space />
            <q-separator v-if="selectedCoin.symbol === 'TLOS'" vertical />
            <q-space v-if="selectedCoin.symbol === 'TLOS'" />

            <div
              v-if="selectedCoin.symbol === 'TLOS'"
              class="display-grid"
              style="width: 60px"
            >
              <q-btn
                round
                flat
                dense
                stack
                size="sm"
                label="Buy"
                icon="far fa-credit-card"
                @click="buy"
              />
            </div>

            <q-space v-if="selectedCoin.symbol === 'TLOS'" />
            <q-separator v-if="convertEnabled" vertical />
            <q-space v-if="convertEnabled" />

            <div v-if="convertEnabled" class="display-grid" style="width: 60px">
              <q-btn
                round
                flat
                dense
                stack
                size="sm"
                label="Convert"
                icon="fas fa-sync"
                @click="convert"
              />
            </div>

            <q-space v-if="convertEnabled" />
          </div>
          <q-input
            v-model="searchHistory"
            label="Search Transaction History"
            dense
            borderless
            class="round-sm q-pl-sm"
            standout="text-white"
            label-color="white"
            color="white"
            input-class="text-white"
          />

          <!-- Crypto History Container -->
          <div>
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
          </div>
        </div>
      </div>
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

<style scoped>
.toolbar-title {
  position: absolute;
  text-align: center;
}
.list-item {
  /* border: 1px solid #fafafa; */
  border-left: none;
  border-right: none;
  border-top-left-radius: 30px;
  border-top-right-radius: 30px;
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
</style>
