<template>
  <q-dialog
    class="main-background"
    v-model="showDlg"
    persistent
    :maximized="true"
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card
      class=" full-height main-background"
      style="max-width: auto; margin: auto; "
    >
      <q-layout
        view="hhh Lpr fFf"
        container
        class="shadow-4 coinview main-background-overlay"
      >
        <q-header class=" text-white q-pa-sm" style="background: #00000000">
          <q-toolbar class="no-padding">
            <q-toolbar-title class="absolute full-width no-padding text-center">
              <div class="display-grid">
                <label class="text-subtitle1 text-weight-medium h-20">
                  {{ type === "convert" ? "Convert from" : "Convert to" }}
                </label>
              </div>
            </q-toolbar-title>
            <q-btn
              round
              flat
              dense
              v-close-popup
              class="text-white closebBtn"
              icon="west"
            />
          </q-toolbar>
          <q-input
            v-model="searchCoinName"
            label="Search coin"
            dense
            class="round-sm q-pl-sm"
            standout="bg-transparent text-white"
            label-color="white"
            color="white"
            input-class="text-white"
          />
        </q-header>
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
                  index === searchCoins.findIndex(c => !c.suggested) &&
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
                    <img :src="coin.icon" />
                    <div
                      v-if="coin.network == 'tevm'"
                      class="flex absolute full-width full-height"
                    >
                      <img
                        class="flex q-ml-auto q-mt-auto"
                        alt="tEVM"
                        src="~assets/telosEVM_32.png"
                        style="width: 50%; height: 50%; margin-right: -10%; margin-bottom: -5%;"
                      />
                    </div>
                  </q-avatar>
                </q-item-section>

                <q-item-section style="justify-content: start; display: grid;">
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
                      >{{ `${getFixed(coin.amount, 8)} ${coin.symbol}` }}</label
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
      </q-layout>
    </q-card>
  </q-dialog>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import { vxm } from "../../../store";
import moment from "moment";

export default {
  props: ["showSelectCoinDlg", "coins", "selectedCoin", "type"],
  data() {
    return {
      searchCoinName: "",
      bancorModule: vxm.bancor
    };
  },
  computed: {
    ...mapGetters("account", ["isAuthenticated", "accountName"]),
    searchCoins() {
      return this.availableCoins.filter(coin => {
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
          .filter(coin => coin.amount > 0)
          .filter(
            coin =>
              convertibleTokens.findIndex(
                token => token.symbol === coin.symbol
              ) >= 0
          );
      }
      return this.coins.filter(
        coin =>
          convertibleTokens.findIndex(token => token.symbol === coin.symbol) >=
          0
      );
    },
    showDlg: {
      get() {
        return this.showSelectCoinDlg;
      },
      set(value) {
        this.$emit("update:showSelectCoinDlg", value);
      }
    }
  },
  methods: {
    selectCoin(coin) {
      this.$emit(`update:selectedCoin`, coin);
      this.showDlg = false;
    }
  },
  watch: {
    showSelectCoinDlg: function(val, oldVal) {
      if (val) {
        this.searchCoinName = "";
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

.closebBtn {
  border: 2px solid white;
}
</style>
