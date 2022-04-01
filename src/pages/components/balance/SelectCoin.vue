<template>
  <q-dialog
    v-model="showDlg"
    persistent
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <div class="main-background">
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
              {{ type === "convert" ? "Convert from" : "Convert to" }}
            </div>
            <div />
          </div>
          <div class="q-px-md q-mt-md">
            <q-input
              v-model="searchCoinName"
              borderless
              label-color="white"
              color="white"
              placeholder="Search coin"
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
          <q-page-container>
            <q-list>
              <div
                v-for="(coin, index) in searchCoins"
                :key="`${coin.name}_${index}`"
              >
                <q-item-label
                  v-if="index === 0 && coin.suggested"
                  header
                  style="color: white"
                  >Suggested</q-item-label
                >
                <q-item-label
                  v-if="
                    index === searchCoins.findIndex((c) => !c.suggested) &&
                    !coin.suggested
                  "
                  header
                  >All coins</q-item-label
                >
                <q-item
                  clickable
                  v-ripple
                  class="list-item"
                  @click="selectCoin(coin)"
                >
                  <q-item-section avatar>
                    <q-avatar size="45px" class="q-my-sm">
                      <token-avatar :token="coin.icon" :avatarSize="45" />
                      <div
                        v-if="coin.network == 'tevm'"
                        class="flex absolute full-width full-height"
                      >
                        <img
                          class="flex q-ml-auto q-mt-auto"
                          alt="tEVM"
                          src="~assets/evm/evm_logo.png"
                          style="
                            width: 50%;
                            height: 50%;
                            margin-right: -10%;
                            margin-bottom: -5%;
                          "
                        />
                      </div>
                    </q-avatar>
                  </q-item-section>
                  <q-item-section style="justify-content: start; display: grid">
                    <div class="text-white text-left display-grid">
                      <label
                        class="text-subtitle1 text-weight-medium text-white h-20 self-end wraplabel"
                        >{{ coin.name }}</label
                      >
                      <label class="text-subtitle2 text-white wraplabel">{{
                        coin.symbol
                      }}</label>
                    </div>
                  </q-item-section>
                  <q-item-section side>
                    <div class="text-white text-right display-grid">
                      <label
                        class="text-subtitle1 text-weight-medium text-white h-20"
                        >{{
                          `${getFixed(coin.amount, 8)} ${coin.symbol}`
                        }}</label
                      >
                      <label class="text-caption text-white"
                        >${{ getFixed(coin.amount * coin.price, 2) }}</label
                      >
                    </div>
                  </q-item-section>
                </q-item>
              </div>
            </q-list>
          </q-page-container>
        </div>
      </div>
    </div>
  </q-dialog>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import { vxm } from "../../../store";
import moment from "moment";
import tokenAvatar from "src/components/TokenAvatar";

export default {
  props: ["showSelectCoinDlg", "coins", "selectedCoin", "type"],
  components: {
    tokenAvatar,
  },
  data() {
    return {
      searchCoinName: "",
      bancorModule: vxm.bancor,
    };
  },
  computed: {
    ...mapGetters("account", ["isAuthenticated", "accountName"]),
    searchCoins() {
      return this.availableCoins.filter((coin) => {
        return (
          coin.name.toLowerCase().includes(this.searchCoinName.toLowerCase()) ||
          coin.symbol.toLowerCase().includes(this.searchCoinName.toLowerCase())
        );
      });
    },
    availableCoins() {
      const { convertibleTokens } = this.bancorModule;
      if (this.type === "convert") {
        return this.coins
          .filter((coin) => coin.amount > 0)
          .filter(
            (coin) =>
              convertibleTokens.findIndex(
                (token) => token.symbol === coin.symbol
              ) >= 0
          );
      }
      return this.coins.filter(
        (coin) =>
          convertibleTokens.findIndex(
            (token) => token.symbol === coin.symbol
          ) >= 0
      );
    },
    showDlg: {
      get() {
        return this.showSelectCoinDlg;
      },
      set(value) {
        this.$emit("update:showSelectCoinDlg", value);
      },
    },
  },
  methods: {
    selectCoin(coin) {
      this.$emit(`update:selectedCoin`, coin);
      this.showDlg = false;
    },
  },
  watch: {
    showSelectCoinDlg: function (val, oldVal) {
      if (val) {
        this.searchCoinName = "";
      } else {
        this.$emit("update:selectedCoin", null);
      }
    },
  },
};
</script>

<style scoped>
/* .list-item {
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
} */
</style>
