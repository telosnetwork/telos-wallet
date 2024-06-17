<script>
import { mapGetters } from 'vuex';
import tokenAvatar from 'components/native/TokenAvatar.vue';
import { getHyperion } from 'src/boot/api';

const GETTING_STARTED_URL = 'https://www.telos.net/buy';

export default {
    components: {
        TokenAvatar: tokenAvatar,
    },
    props: [
        'showHistoryDlg',
        'selectedCoin',
        'showSendAmountDlg',
        'showBuyAmountDlg',
        'showShareAddressDlg',
        'showRexStakeDlg',
    ],
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
    },
    methods: {
        async loadMoreHistory(index, done) {
            if (this.loadedAll) {
                return;
            }
            const actionHistory = await getHyperion().get(
                `/v2/history/get_actions?limit=${this.pageLimit}&skip=${this.page}&account=${this.accountName}&filter=${this.selectedCoin.account}:*`,
            );
            this.accountHistory.push(...(actionHistory.data.actions.
                filter(a => 'quantity' in a.act.data &&
                    a.act.data.quantity.split(' ')[1] ===this.selectedCoin.symbol) || []));
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
            window.open(GETTING_STARTED_URL);
            //this.$emit("update:showBuyAmountDlg", true);
        },
        sell() {
            // this.$emit('update:showShareAddressDlg', true);
        },
        stakeRex() {
            this.$emit('update:showRexStakeDlg', true);
        },
        openExplorer(history) {
            var url = `${process.env.NETWORK_EXPLORER}/transaction/${history.trx_id}`;
            var win = window.open(url, '_blank');
            win.focus();
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
                coinAmount = Number(
                    history.act.data.quantity.split(this.selectedCoin.symbol)[0],
                );
            } else if (history.act.name === 'sellram') {
                actionName = 'Sold Ram';
                actionDetail = `${history.act.data.bytes} bytes`;
            } else {
                actionName = history.act.name;
                coinAmount = Number(
                    history.act.data.quantity.split(this.selectedCoin.symbol)[0],
                );
            }
            usdAmount = this.getFixed(coinAmount * this.selectedCoin.price, 2);

            return {
                actionName,
                actionDetail,
                coinAmount,
                usdAmount,
            };
        },
    },
    watch: {
        showHistoryDlg: function (val, oldVal) {
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

<template>
<q-dialog
    v-model="showDlg"
    persistent
    maximized
    transition-show="slide-left"
    transition-hide="slide-right"
>
    <div v-if="selectedCoin" class="main-background native-font-color">
        <q-layout view="hhh Lpr fFf" container class="main-background-overlay">
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
                            {{ selectedCoin.name }}
                        </div>
                        <div ></div>
                    </div>

                    <!-- Crypto History Container -->
                    <q-page-container>
                        <div class="text-white text-center display-grid">
                            <!-- Crypto Image -->
                            <div class="absolute crypto-image-container">
                                <q-item-section avatar class="cryptoImg">
                                    <q-avatar size="6rem">
                                        <div
                                            v-if="selectedCoin.name == 'Telos EVM'"
                                            class="flex absolute full-width full-height"
                                        >
                                            <img
                                                class="flex q-ml-auto"
                                                alt="tEVM"
                                                src='/branding/telos-scan.png'
                                            >
                                        </div>
                                        <div
                                            v-else-if="selectedCoin.name == 'Telos'"
                                            class="flex absolute full-width full-height"
                                        >
                                            <img
                                                class="flex q-ml-auto"
                                                alt="tEVM"
                                                src='/branding/telos.png'
                                            >
                                        </div>
                                        <TokenAvatar v-else :token="selectedCoin.icon" :avatarSize="100" />
                                    </q-avatar>
                                </q-item-section>
                                <img
                                    class="avatarBackground"
                                    src="~assets/background/avatarBackground.svg"
                                >
                            </div>

                            <!-- Crypto Amount -->
                            <label
                                class="cryptoAmount text-h5 text-weight-small text-whhite"
                            >${{
                                getFixed(
                                    (!selectedCoin.totalAmount
                                        ? selectedCoin.amount
                                        : selectedCoin.totalAmount) * selectedCoin.price,
                                    2
                                )
                            }}</label>

                            <div
                                v-if="selectedCoin.rexBalance !== undefined"
                                class="fit column wrap justify-end items-end content-center"
                            >
                                <label class="text-caption text-white">
                                    {{$t('components.total')}}:
                                    {{
                                        `${getFixed(
                                            !selectedCoin.totalAmount
                                                ? selectedCoin.amount
                                                : selectedCoin.totalAmount,
                                            selectedCoin.precision
                                        )} ${selectedCoin.symbol}`
                                    }}</label>
                                <label
                                    class="text-caption text-white"
                                >{{$t('components.liquid')}}:
                                    {{
                                        `${getFixed(
                                            selectedCoin.amount,
                                            selectedCoin.precision
                                        )} ${selectedCoin.symbol}`
                                    }}</label>
                                <label class="text-caption text-white q-ml-sm">
                                    REX:
                                    {{
                                        `${getFixed(
                                            selectedCoin.rexBalance,
                                            selectedCoin.precision
                                        )} ${selectedCoin.symbol}`
                                    }}</label>
                            </div>
                        </div>

                        <div
                            class="sendActions fit row justify-center items-center content-center q-my-md"
                        >
                            <q-btn
                                class=""
                                flat
                                dense
                                stack
                                size="md"
                                no-caps
                                @click="send"
                            >
                                <div class="column">
                                    <img src="~assets/coin/send.svg" >
                                    {{$t('components.send')}}
                                </div>
                            </q-btn>

                            <q-btn
                                class=""
                                flat
                                dense
                                stack
                                size="md"
                                no-caps
                                @click="receive"
                            >
                                <div class="column">
                                    <img src="~assets/coin/receive.svg" >
                                    {{$t('components.receive')}}
                                </div>
                            </q-btn>

                            <q-btn
                                v-if="selectedCoin.symbol === 'TLOS'"
                                class=""
                                flat
                                dense
                                stack
                                size="md"
                                no-caps
                                @click="buy"
                            >
                                <div class="column">
                                    <img src="~assets/coin/Purchase.svg" >
                                    {{$t('components.buy')}}
                                </div>
                            </q-btn>

                            <q-btn
                                v-if="
                                    selectedCoin.account === 'eosio.token' &&
                                        selectedCoin.symbol === 'TLOS'
                                "
                                class=""
                                flat
                                dense
                                stack
                                size="md"
                                no-caps
                                @click="stakeRex"
                            >
                                <div class="column">
                                    <img src="/nav/earn_selected.svg" >
                                    {{$t('components.stake')}}
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
                                    <img src="~/assets/icons/search.svg" >
                                </template>
                            </q-input>
                            <q-separator dark class="q-my-sm" />
                        </div>

                        <q-infinite-scroll
                            v-if="selectedCoin.name !== 'Telos EVM'"
                            :offset="100"
                            @load="loadMoreHistory"
                        >
                            <div
                                v-for="(history, index) in searchHistories"
                                :key="`${history.block_num}_${index}`"
                            >
                                <q-item
                                    v-ripple
                                    clickable
                                    class="list-item"
                                    @click=openExplorer(history)
                                >
                                    <q-item-section avatar>
                                        <q-avatar size="35px" class="q-my-none">
                                            <TokenAvatar
                                                :token="selectedCoin.icon"
                                                :avatarSize="35"
                                            />
                                        </q-avatar>
                                    </q-item-section>

                                    <q-item-section class="history-grid">
                                        <div class="text-white text-left display-grid">
                                            <label
                                                class="text-subtitle2 text-weight-medium text-white h-20 self-end wraplabel"
                                            >{{ historyData(history).actionName }}</label>
                                            <label
                                                class="text-caption text-white text-weight-regular wraplabel"
                                            >{{ historyData(history).actionDetail }}</label>
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
                                            }}</label>
                                            <label
                                                class="text-caption text-white"
                                            >${{
                                                getFixed(historyData(history).usdAmount, 4)
                                            }}</label>
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

<style lang="scss" scoped>
.sendActions {
  // color: #3fa6f5;
  opacity: 0.8;
  button:not(.rexbtn) {
    padding: 0.5rem;
    background-color: #ffffff1a;
    margin: 0.1rem;
    border-radius: 0;
    img {
      padding-bottom: 5px;
    }
  }
}

.rexbtn {
  padding: 0.5rem;
  background-color: #ffffff1a;
  //   margin: 0.1rem;
  border-radius: 0;
  img {
    padding-bottom: 5px;
  }
}
// .list-item {

//   border-left: none;
//   border-right: none;
//   border-bottom-left-radius: unset;
//   border-bottom-left-radius: unset;
// }
// .display-grid {
//   display: grid;
// }
// .h-20 {
//   height: 20px;
// }
// .wraplabel {
//   white-space: nowrap;
//   overflow: hidden;
//   text-overflow: ellipsis;
// }

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

.dialogPage {
  background-image: none;
}

.crypto-image-container {
    left: 50%;
    margin-left: -3rem
}

.evm-logo {
    width: 50%;
    height: 50%;
    margin-right: -10%;
    margin-bottom: -5%;
}

.history-grid {
    justify-content: start;
    display: grid
}
</style>
