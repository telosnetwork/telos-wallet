<template>
  <div style="margin: auto">
    <q-infinite-scroll
      style="display: grid; grid-template-rows: auto auto; margin: auto"
    >
      <q-item
        flat
        v-for="(coin, index) in availableCoins"
        :key="`${coin.name}_${index}`"
        clickable
        v-ripple
        class="column "
        @click="selectCoin(coin)"
        ><div class="self-stretch list-item">
          <div class="row">
            <q-item-section flat avatar>
              <q-avatar size="45px" class="q-my-sm">
                <img
                  v-if="coin.network === 'tevm' || coin.name === 'Telos'"
                  src="~assets/TLOS.png"
                />
                <img v-else :src="coin.icon" />
                <div
                  v-if="coin.network == 'tevm'"
                  class="flex absolute full-width full-height"
                >
                  <img
                    class="flex q-ml-auto q-mt-auto"
                    alt="tEVM"
                    src="~assets/evm_logo.png"
                    style="width: 50%; height: 50%; margin-right: -10%; margin-bottom: -5%;"
                  />
                </div>
              </q-avatar>
            </q-item-section>
            <q-item-section style="justify-content: start; display: grid;">
              <div class="text-white text-left display-grid">
                <label
                  class="text-subtitle1 text-weight-small text-white h-20 self-end wraplabel"
                  >{{ coin.name }}</label
                >
                <label class="text-subtitle2 text-grey-5 wraplabel">{{
                  coin.symbol
                }}</label>
              </div>
            </q-item-section>
          </div>
          <div class="tevmBtnWrapper">
            <q-btn
              class="tevmBtn"
              flat
              rounded
              no-caps
              @click.stop="withdrawEvm"
              v-if="coin.symbol === 'TLOS' && coin.network === 'tevm'"
            >
              <div class="q-pr-sm">EVM</div>
              <img src="~assets/icons/networkArrows.svg" />
            </q-btn>
            <q-btn
              class="tevmBtn"
              flat
              rounded
              no-caps
              @click.stop="depositEvm"
              v-if="coin.symbol === 'TLOS' && coin.network !== 'tevm'"
            >
              <img src="~assets/icons/networkArrows.svg" />
              <div class="q-pl-sm">EVM</div>
            </q-btn>
          </div>
          <q-item-section>
            <div class="text-white text-right display-grid">
              <label class="text-subtitle1 text-weight-small text-white h-20">{{
                `${getFixed(coin.amount, 8)} ${coin.symbol}`
              }}</label>
              <label class="text-caption text-grey-6"
                >${{ getFixed(coin.amount * coin.price, 2) }}</label
              >
            </div>
          </q-item-section>
        </div>
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
import { mapGetters, mapActions } from "vuex";

export default {
  props: [
    "coins",
    "coinLoadedAll",
    "showHistoryDlg",
    "showExchangeDlg",
    "showBuyAmountDlg",
    "showDepositEVMDlg",
    "showWithdrawEVMDlg",
    "selectedCoin",
    "suggestTokens"
  ],
  computed: {
    availableCoins() {
      return this.coins.filter(
        coin =>
          coin.amount > 0 ||
          this.suggestTokens.includes(coin.symbol.toLowerCase())
      );
    }
  },
  methods: {
    clickPurchase() {
      this.$emit(
        "update:selectedCoin",
        this.coins.find(coin => coin.symbol === "TLOS")
      );
      this.$emit("update:showBuyAmountDlg", true);
    },
    clickExchange() {
      this.$emit("update:showExchangeDlg", true);
    },
    selectCoin(coin) {
      this.$emit("update:selectedCoin", coin);
      this.$emit("update:showHistoryDlg", true);
    },
    depositEvm() {
      this.$emit("update:showDepositEVMDlg", true);
    },
    withdrawEvm() {
      this.$emit("update:showWithdrawEVMDlg", true);
    }
  }
};
</script>

<style lang="scss" scoped>
.list-item {
  border: 1px solid #fafafa00;
  border-left: none;
  border-right: none;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
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

div.scroll {
  overflow: auto;
}

div.scroll::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 0px rgba(184, 18, 18, 0.3);
  border-radius: 1px;
  background-color: #00000000;
}

div.scroll:-webkit-scrollbar {
  width: 1px;
  background-color: #7802ff;
}

div.scroll::-webkit-scrollbar-thumb {
  border-radius: 1px;
  -webkit-box-shadow: inset 0 0 6px rgba(6, 103, 160, 0.3);
  background-color: rgb(223, 0, 0);
}
.tevmBtnWrapper {
  justify-self: center;
  display: flex;
  align-items: center;
}
.tevmBtn {
  background: rgba($white, 0.1);
  &:hover {
    background: rgba($white, 0.2);
  }
}
</style>
