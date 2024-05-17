<script>
import { mapGetters, mapActions } from 'vuex';
import tokenAvatar from 'components/native/TokenAvatar.vue';

const GETTING_STARTED_URL = 'https://www.telos.net/buy';

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
        ...mapGetters('account', ['data']),
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
        coinIsTelosNative(coin) {
            return coin.symbol === 'TLOS' && coin.account === 'eosio.token' && coin.network !== 'tevm';
        },
        formatLiquidBalance(balance) {
            const [amount, symbol] = balance?.split(' ') ?? ['0', 'TLOS'];
            return `${this.getFixed(amount, 4)} ${symbol}`;
        },
        getLiquidBalance(balance) {
            const [amount] = balance?.split(' ') ?? ['0'];
            return Number(amount);
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
                            v-if="coin.name === 'Telos'"
                            src="/branding/telos.png"
                        >
                        <img
                            v-if="coin.network === 'tevm'"
                            alt="tEVM"
                            src="/branding/telos-scan.png"
                        >
                        <TokenAvatar :token="coin.icon" :avatarSize="45" />
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
                    v-if="coinIsTelosNative(coin)"
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
                    <label class="text-subtitle1 text-weight-small text-white h-20">
                        <template v-if="coinIsTelosNative(coin) && data">
                            {{ formatLiquidBalance(data.core_liquid_balance) }}
                        </template>
                        <template v-else>
                            {{
                                `${getFixed(
                                    !coin.totalAmount ? coin.amount : coin.totalAmount,
                                    8
                                )} ${coin.symbol}`
                            }}
                        </template>
                    </label>
                    <label
                        v-if="coin.price !== 0"
                        class="text-caption text-grey-6"
                    >
                        $
                        <template v-if="coinIsTelosNative(coin) && data">
                            {{ getFixed(coin.price * getLiquidBalance(data.core_liquid_balance), 2) }}
                        </template>
                        <template v-else>
                            {{
                                getFixed(
                                    !coin.totalAmount
                                        ? coin.amount * coin.price
                                        : coin.totalAmount * coin.price,
                                    2
                                )
                            }}
                        </template>
                    </label>
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
