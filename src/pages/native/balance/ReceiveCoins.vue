<script>
import { mapGetters } from 'vuex';
import tokenAvatar from 'components/native/TokenAvatar.vue';

export default {
    props: ['showReceiveDlg', 'coins', 'selectedCoin', 'showShareAddressDlg'],
    components: {
        TokenAvatar: tokenAvatar,
    },
    data() {
        return {
            searchCoinName: '',
        };
    },
    computed: {
        ...mapGetters('account', ['isAuthenticated', 'accountName']),
        searchCoins() {
            return this.coins.filter(coin => (
                coin.name.toLowerCase().includes(this.searchCoinName.toLowerCase()) ||
                coin.symbol.toLowerCase().includes(this.searchCoinName.toLowerCase())
            ));
        },
        showDlg: {
            get() {
                return this.showReceiveDlg;
            },
            set(value) {
                this.$emit('update:showReceiveDlg', value);
            },
        },
    },
    methods: {
        selectCoin(coin) {
            this.$emit('update:showShareAddressDlg', true);
            this.$emit('update:selectedCoin', coin);
        },
    },
};
</script>

<template>
<q-dialog
    v-model="showDlg"
    persistent
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
>
    <div class="main-background dialogWrapper native-font-color">
        <div class="dialogPage">
            <div class="dialogPageContent">
                <div class="dialogPageHeading">
                    <div>
                        <q-btn
                            v-close-popup
                            round
                            flat
                            dense
                            class="closebBtn"
                            icon="west"
                        />
                    </div>
                    <div class="text-subtitle1 text-weight-medium text-center">
                        {{$t('components.receive')}}
                    </div>
                    <div ></div>
                </div>
                <div class="text-subtitle2 text-grey-4 text-center q-pb-md">
                    {{$t('components.select_a_coin')}}
                </div>
                <div class="q-pa-md">
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
                            <img src="~/assets/icons/search.svg" >
                        </template>
                    </q-input>
                    <q-separator dark class="q-my-sm" />
                </div>
                <div
                    v-for="(coin, index) in searchCoins"
                    :key="`${coin.name}_${index}`"
                >
                    <q-item-label
                        v-if="index === 0 && coin.suggested"
                        header
                    >{{$t('components.suggested')}}</q-item-label>
                    <q-item-label
                        v-if="
                            index === searchCoins.findIndex((c) => !c.suggested) &&
                                !coin.suggested
                        "
                        header
                    >{{$t('components.all_coins')}}</q-item-label>
                    <q-item
                        v-ripple
                        clickable
                        class="list-item"
                        @click="selectCoin(coin)"
                    >
                        <q-item-section avatar>
                            <q-avatar size="45px" class="q-my-sm">
                                <div
                                    v-if="coin.symbol === 'TLOS' && coin.network !== 'tevm'"
                                    class="flex absolute full-width full-height"
                                >
                                    <img
                                        class="flex q-ml-auto q-mt-auto evm-logo"
                                        alt="tEVM"
                                        src='/branding/telos.png'
                                    >
                                </div>
                                <div
                                    v-else-if="coin.symbol === 'TLOS' && coin.network === 'tevm'"
                                    class="flex absolute full-width full-height"
                                >
                                    <img
                                        class="flex q-ml-auto q-mt-auto evm-logo"
                                        alt="tEVM"
                                        src='/branding/telos-scan.png'
                                    >
                                </div>
                                <TokenAvatar v-else :token="coin.icon" :avatarSize="45" />
                            </q-avatar>
                        </q-item-section>
                        <q-item-section class="coin-info">
                            <div class="text-white text-left display-grid">
                                <label
                                    class="text-subtitle1 text-weight-small text-white h-20 self-end wraplabel"
                                >{{ coin.name }}</label>
                                <label class="text-subtitle2 text-white wraplabel">{{
                                    coin.symbol
                                }}</label>
                            </div>
                        </q-item-section>
                        <q-item-section side>
                            <div class="text-white text-right display-grid">
                                <label
                                    class="text-subtitle1 text-weight-small text-white h-20"
                                >{{ `${getFixed(coin.amount, 8)} ${coin.symbol}` }}</label>
                                <label
                                    class="text-caption text-white"
                                >${{ getFixed(coin.amount * coin.price, 2) }}</label>
                            </div>
                        </q-item-section>
                    </q-item>
                </div>
            </div>
        </div>
    </div>
</q-dialog>
</template>

<style scoped>
.evm-logo {
    width: 50%;
    height: 50%;
    margin-right: -10%;
    margin-bottom: -5%;
}

.coin-info {
    justify-content: start;
    display: grid
}

/* .list-item {
  border: 1px solid #fafafa00;
  border-left: none;
  border-right: none;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
} */
/* .display-grid {
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
