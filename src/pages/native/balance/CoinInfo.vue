<script>
import { mapGetters, mapActions } from 'vuex';
import tokenAvatar from 'components/TokenAvatar.vue';

const GETTING_STARTED_URL = 'https://www.telos.net/#getting-started';

export default {
    components: {
        TokenAvatar: tokenAvatar,
    },
    props: [
        'coins',
        'coinLoadedAll',
        'showHistoryDlg',
        'showBuyAmountDlg',
        'showDepositEVMDlg',
        'showWithdrawEVMDlg',
        'selectedCoin',
        'suggestTokens',
    ],
    computed: {
        availableCoins() {
            return this.coins.filter(
                coin =>
                    coin.amount > 0 ||
          this.suggestTokens
              .map(t => t.sym)
              .includes(coin.symbol.toLowerCase()),
            );
        },
    },
    methods: {
        clickPurchase() {
            window.open(GETTING_STARTED_URL);
            /*
      this.$emit(
        "update:selectedCoin",
        this.coins.find((coin) => coin.symbol === "TLOS")
      );
      this.$emit("update:showBuyAmountDlg", true);
       */
        },
        selectCoin(coin) {
            this.$emit('update:selectedCoin', coin);
            this.$emit('update:showHistoryDlg', true);
        },
        depositEvm() {
            this.$emit('update:showDepositEVMDlg', true);
        },
        withdrawEvm() {
            this.$emit('update:showWithdrawEVMDlg', true);
        },
    },
};
</script>

<template>
<div class="page-container">
    <q-infinite-scroll class="grid-container">
        <q-item
            v-for="(coin, index) in availableCoins"
            :key="`${coin.name}_${index}`"
            v-ripple
            flat
            clickable
            class="column"
            @click="selectCoin(coin)"
        ><div class="self-stretch list-item">
            <div class="row">
                <q-item-section flat avatar>
                    <q-avatar size="45px" class="q-my-sm">
                        <img
                            v-if="coin.network === 'tevm' || coin.name === 'Telos'"
                            src="/coins/TLOS.png"
                        >
                        <TokenAvatar :token="coin.icon" :avatarSize="45" />
                        <div
                            v-if="coin.network === 'tevm'"
                            class="flex absolute full-width full-height"
                        >
                            <img
                                class="flex q-ml-auto q-mt-auto evm-logo"
                                alt="tEVM"
                                src="~assets/evm/evm_logo.png"
                            >
                        </div>
                    </q-avatar>
                </q-item-section>
                <q-item-section class="coin-grid">
                    <div class="text-white text-left display-grid">
                        <label
                            class="text-subtitle1 text-weight-small text-white h-20 self-end wraplabel"
                        >{{ coin.name }}</label>
                        <label class="text-subtitle2 text-grey-5 wraplabel">{{
                            coin.symbol
                        }}</label>
                    </div>
                </q-item-section>
            </div>
            <div class="tevmBtnWrapper">
                <q-btn
                    v-if="coin.symbol === 'TLOS' && coin.network === 'tevm'"
                    class="tevmBtn"
                    flat
                    rounded
                    no-caps
                    @click.stop="withdrawEvm"
                >
                    <div class="q-pr-sm">EVM</div>
                    <img src="~assets/icons/networkArrows.svg" >
                </q-btn>
                <q-btn
                    v-if="
                        coin.symbol === 'TLOS' &&
                            coin.account === 'eosio.token' &&
                            coin.network !== 'tevm'
                    "
                    class="tevmBtn"
                    flat
                    rounded
                    no-caps
                    @click.stop="depositEvm"
                >
                    <img src="~assets/icons/networkArrows.svg" >
                    <div class="q-pl-sm">EVM</div>
                </q-btn>
            </div>
            <q-item-section>
                <div class="text-white text-right display-grid">
                    <label class="text-subtitle1 text-weight-small text-white h-20">{{
                        `${getFixed(
                            !coin.totalAmount ? coin.amount : coin.totalAmount,
                            8
                        )} ${coin.symbol}`
                    }}</label>
                    <label
                        v-if="coin.price !== 0"
                        class="text-caption text-grey-6"
                    >${{
                        getFixed(
                            !coin.totalAmount
                                ? coin.amount * coin.price
                                : coin.totalAmount * coin.price,
                            2
                        )
                    }}</label>
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

<style lang="scss" scoped>
.page-container {
    margin: auto;
}

.grid-container {
    display: grid;
    grid-template-rows: auto auto;
    margin: auto
}

.evm-logo {
    width: 50%;
    height: 50%;
    margin-right: -10%;
    margin-bottom: -5%;
}

.coin-grid {
    justify-content: start;
    display: grid
}

.list-item {
  border: 1px solid #fafafa00;
  border-left: none;
  border-right: none;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
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
