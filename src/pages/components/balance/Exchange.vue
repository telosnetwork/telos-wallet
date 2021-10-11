<template>
  <q-dialog
    class="main-background"
    v-model="showDlg"
    persistent
    :maximized="true"
    transition-show="slide-left"
    transition-hide="slide-right"
  >
    <q-card class="full-height main-card main-background" style="max-width: auto; margin: auto; background: linear-gradient(to bottom, #020039, #2a3f7e 200%)">
      <q-layout
        view="hhh Lpr fFf"
        container
        class="shadow-4 coinview main-background-overlay"
      >
<!-- Top Dollar/Crypto buttons -->
        <q-header class="text-white q-pa-sm" style="background: #00000000">
          <q-toolbar class="no-padding">
            <q-toolbar-title class="absolute full-width no-padding text-center">
              <q-btn-group class=" full-width justify-center" push unelevated>
                <q-btn 
                  class="q-px-md"
                  push no-caps
                  label="Dollars"
                  :style="`background: ${exchangeType === 'dollars' ? '#FFFFFF22' : '#FFFFFF22'};
                          color: ${exchangeType === 'dollars' ? 'white' : 'grey'};`"
                  @click="exchangeType = 'dollars'"
                />
                <q-btn
                  class="q-px-md"
                  push no-caps
                  label="Crypto"
                  :style="`background: ${exchangeType !== 'dollars' ? '#FFFFFF22' : '#FFFFFF22'};
                          color: ${exchangeType !== 'dollars' ? 'white' : 'grey'};`"
                  @click="exchangeType = 'crypto'"
                />
              </q-btn-group>
            </q-toolbar-title>
            <q-btn round flat dense v-close-popup class=" closebBtn text-white" icon="west"/>
          </q-toolbar>
        </q-header>

<!-- Equal Amount-->
        <q-item class="list-item full-width equalAmount">
              <div class="text-black display-grid full-width">
                <label ref="widthElement" style="display: fit-content; visibility: hidden; position: absolute; font-size: 45px;">
                  {{ dollarsAmount }}
                </label>
                <div class="flex flex-center full-width">
                  <label class="text-weight-regular text-white q-mr-none" style="font-size: 1.4rem;">
                    $
                  </label>
                  <input
                    type="text" maxlength="8"
                    class="text-weight-regular text-white text-center no-border q-pa-none no-outline transparent"
                    :style="`font-size: 45px; width: ${inputWidth}px;`"
                    v-model="dollarsAmount"
                    @focus="dollarsAmount = (dollarsAmount === '0' ? '' : dollarsAmount)"
                    @blur="dollarsAmount = Number(dollarsAmount === '' ? '0' : dollarsAmount).toString()"
                  />
                </div>
                <label class="text-subtitle1 text-center text-white">Equivalent to</label>
              </div>
            </q-item>

<!-- Dollar currency converter -->
        <q-page-container  flat class="q-mx-auto q-py-sm" style="max-width: 600px">
          <q-card v-if="exchangeType === 'dollars'" class=" card column q-mx-lg q-mt-xl convert-card" style="height: 200px; background: none">
            <!-- <q-space/> -->
            <!-- <q-item class="list-item full-width">
              <div class="text-black display-grid full-width">
                <label ref="widthElement" style="display: fit-content; visibility: hidden; position: absolute; font-size: 45px;">
                  {{ dollarsAmount }}
                </label>
                <div class="flex flex-center full-width">
                  <label class="text-weight-regular text-grey-6 q-mr-none" style="font-size: 45px;">
                    $
                  </label>
                  <input
                    type="text" maxlength="8"
                    class="text-weight-regular text-grey-6 text-center no-border q-pa-none no-outline transparent"
                    :style="`font-size: 45px; width: ${inputWidth}px;`"
                    v-model="dollarsAmount"
                    @focus="dollarsAmount = (dollarsAmount === '0' ? '' : dollarsAmount)"
                    @blur="dollarsAmount = Number(dollarsAmount === '' ? '0' : dollarsAmount).toString()"
                  />
                </div>
                <label class="text-subtitle1 text-center text-grey-6">Equivalent to ...</label>
              </div>
            </q-item> -->
            <!-- <q-space/> -->
            <q-item class="row list-item full-width q-px-none">
              <div class="col q-mx-lg text-center">
                <q-item-section style="display: block;">
                  <div class="text-white display-grid">
                    <label class="text-white text-subtitle1 text-weight-medium text-white">Convert</label>
                    
                    <q-container class="flex-center relative row" style="display:flex; margin-top: -4rem;">
                      <img class="dollarBgimg1 flex-center" src="~assets/dollarBgImg.svg"  style="display: inline; width: 100%">
                      <img class="avatarBackground1" src="~assets/dollarRectBg.svg">
                      <img v-if="convertCoin" class="cryptoImg1" :src="convertCoin.icon">
                    </q-container>
                    <label
                        class="text-white flex-center text-subtitle1 text-weight-medium wraplabel cursor-pointer"
                        :style="`color: ${themeColor}; display: inline-flex; z-index: 1; margin-top: -4rem;`"
                        @click="showSelectCoinDlg = true; dlgType = 'convert';"
                      >
                        <q-item-section v-if="convertCoin" avatar class="q-pr-sm" style="min-width: unset;">
                          <!-- <q-avatar size="25px"> -->
                            <!-- <img :src="convertCoin.icon"> -->
                          <!-- </q-avatar> -->
                        </q-item-section>
                        {{
                          convertCoin ?
                          convertCoin.name :
                          'Choose coin'
                        }}
                      </label>
                  </div>
                </q-item-section>
              </div>
              <q-separator vertical class="q-my-auto" style="width: 0px; height: 80%;" />
              <div class="col q-mx-lg text-center">
                <q-item-section style="display: block;">
                  <div class="text-white display-grid">
                    <label class="text-white text-subtitle1 text-weight-medium text-white">To</label>
                    <q-container class="flex-center relative row" style="display:flex; margin-top: -4rem;">
                          <img class="dollarBgimg1 flex-center" src="~assets/dollarBgImg.svg"  style="display: inline; width: 100%;">
                          <img class="avatarBackground1" src="~assets/dollarRectBg.svg">
                          <img v-if="toCoin" class="cryptoImg1" :src="toCoin.icon">                   
                    </q-container>
                    <label
                      class="text-white flex-center text-subtitle1 text-weight-medium wraplabel cursor-pointer"
                      :style="`color: ${themeColor}; display: inline-flex; z-index: 1; margin-top: -4rem;`"
                      @click="showSelectCoinDlg = true; dlgType = 'to';"
                    >
                      <q-item-section v-if="toCoin" avatar class="q-pr-sm" style="min-width: unset;">
                        <!-- <q-avatar size="25px"> -->
                          <!-- <img :src="toCoin.icon"> -->
                        <!-- </q-avatar> -->
                      </q-item-section>
                      {{
                        toCoin ?
                        toCoin.name :
                        'Choose coin'
                      }}
                    </label>
                  </div>
                </q-item-section>
              </div>
            </q-item>
            <q-space/>
          </q-card>

<!-- Crypto Amount Converter -->
          
          <q-card v-else class="column q-mx-lg q-mt-xl convert-card" style="height: 200px; background: #fafafa00;">
            <q-space/>
            <q-item class="list-item full-width q-pb-none" style="min-height: 28px;">
              <q-item-section>
                <div class="text-white display-grid" style="width: 200px;">
                  <label class="text-subtitle1 text-weight-medium">Convert</label>
                </div>
              </q-item-section>

              <q-item-section side>
                <div class="text-white text-right display-grid">
                  <input 
                    ref="convertAmountElement" 
                    type="text" maxlength="8"
                    :class="`text-weight-regular text-white text-right no-border no-outline transparent`"
                    :style="`font-size: 30px; min-width: 100px; max-width: 200px; height: 48px;`"
                    v-model="convertAmount"
                    @focus="convertAmount = (convertAmount === '0' ? '' : convertAmount)"
                    @blur="convertAmount = Number(convertAmount === '' ? '0' : convertAmount).toString()"
                  />
                </div>
              </q-item-section>
            </q-item>
            <q-item class="list-item full-width q-pt-none" style="min-height: 28px;">
              <q-item-section>
                <div class="text-white display-grid" style="width: 200px;">
                  <label
                    class="text-white text-subtitle1 text-weight-medium cursor-pointer"
                    :style="`color: ${themeColor}; display: inline-flex; z-index: 1;`"
                    @click="showSelectCoinDlg = true; dlgType = 'convert';"
                  >
                    <q-item-section v-if="convertCoin" avatar class="q-pr-sm" style="min-width: unset;">
                      <q-avatar size="25px">
                        <img :src="convertCoin.icon">
                      </q-avatar>
                    </q-item-section>
                    {{
                      convertCoin ?
                      convertCoin.name :
                      'Choose coin'
                    }}
                  </label>
                  
                </div>
                
              </q-item-section>

              <q-item-section side>
                <div class="text-white text-right display-grid">
                  <label class="text-caption text-white">${{ convertCoin ? getFixed(convertAmount * convertCoin.price, 2) : 0 }}</label>
                </div>
              </q-item-section>
            </q-item>
            <q-space/>
            <q-separator style="height: 0.3px;" color="white"/>
            <q-space/>
            <q-item class="list-item full-width q-pb-none" style="min-height: 28px;">
              <q-item-section>
                <div class="text-white display-grid" style="width: 200px;">
                  <label class="text-subtitle1 text-weight-medium text-white">To</label>
                </div>
              </q-item-section>
              <q-item-section side>
                <div class="text-white text-right display-grid">
                  <input 
                    ref="toAmountElement" 
                    type="text" maxlength="8"
                    :class="`text-weight-regular text-white text-right no-border no-outline transparent`"
                    :style="`font-size: 30px; min-width: 100px; max-width: 200px; height: 48px;`"
                    v-model="toAmount"
                    @focus="toAmount = (toAmount === '0' ? '' : toAmount)"
                    @blur="toAmount = Number(toAmount === '' ? '0' : toAmount).toString()"
                  />
                </div>
              </q-item-section>
            </q-item>
            <q-item class="list-item full-width q-pt-none" style="min-height: 28px;">
              <q-item-section>
                <div class="text-white display-grid" style="width: 200px;">
                  <label
                    class="text-white text-subtitle1 text-weight-medium cursor-pointer"
                    :style="`color: ${themeColor}; display: inline-flex; z-index: 1;`"
                    @click="showSelectCoinDlg = true; dlgType = 'to';"
                  >
                    <q-item-section v-if="toCoin" avatar class="q-pr-sm" style="min-width: unset;">
                      <q-avatar size="25px">
                        <img :src="toCoin.icon">
                      </q-avatar>
                    </q-item-section>
                    {{
                      toCoin ?
                      toCoin.name :
                      'Choose coin'
                    }}
                  </label>
                </div>
              </q-item-section>

              <q-item-section side>
                <div class="text-black text-right display-grid">
                  <label class="text-caption text-white">${{ toCoin ? getFixed(toAmount * toCoin.price, 2) : 0 }}</label>
                </div>
              </q-item-section>
            </q-item>
            <q-separator style="height: 1px;" color="white"/>
            <q-space/>
          </q-card>


          <div v-if="convertCoin && toCoin && convertAmountValue && toAmountValue"
            class="q-mt-md text-subtitle2 text-weight-bold text-center"
            :style="`color: white; margin-top: 50px`"
          >
            <span>
              {{ unitReward }}
            </span>
            <div>
              {{ `1 ${convertCoin.symbol} = $${getFixed(this.toCoin.price * this.reward, 4)} USD` }}
            </div>
            <div v-if="fee !== null">
              Fee: {{ getFixed(fee, 4) }}
            </div>
            <div
              v-if="slippage !== null"
              :class="slippageHigh ? 'text-warning' : ''"
              :style="slippageHigh ? '' : 'color: ${themeColor};'"
            >
              {{ displayedSlippage }}
            </div>
          </div>
        </q-page-container>


<!-- Convert Button -->
          <div class="convertBtn flex-center" style="display: block;">
            <q-btn
              class="flex-center text-white text-subtitle2 convertBtn1"
              :style="`height: auto; background: linear-gradient(120deg, #1DD1FE, #8946DF); font-size: 20px;`"
              flat
              no-caps
              label="Convert"
              :disable="!convertButtonEnabled"
              @click="convertPressed()"
            />
          </div>
      </q-layout>
    </q-card>
    <SelectCoin :showSelectCoinDlg.sync="showSelectCoinDlg" :coins="coins" :selectedCoin.sync="selectedCoin" :type="dlgType" />
  </q-dialog>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import moment from 'moment';
import SelectCoin from './SelectCoin';
import { vxm } from "../../../store";

export default {
  props: ['showExchangeDlg', 'selectedConvertCoin', 'coins'],
  components: {
    SelectCoin,
  },
  data() {
    return {
      exchangeType: 'dollars',
      dollarsAmount: '0',
      convertAmount: '0',
      toAmount: '0',
      slippage: 0,
      fee: 0,
      reward: 0,
      convertCoin: null,
      toCoin: null,
      selectedCoin: null,
      convertible: false,
      showSelectCoinDlg: false,
      dlgType: 'convert',
      inputWidth: 30,
      bancorModule: vxm.bancor,
    };
  },
  computed: {
    ...mapGetters('account', ['isAuthenticated', 'accountName']),
    showDlg: {
      get() {
        return this.showExchangeDlg;
      },
      set(value) {
        this.$emit('update:showExchangeDlg', value);
      },
    },
    dollarsAmountValue() {
      return Number(this.dollarsAmount.replace(/\s/g, ''));
    },
    convertAmountValue() {
      return Number(this.convertAmount.replace(/\s/g, ''));
    },
    toAmountValue() {
      return Number(this.toAmount.replace(/\s/g, ''));
    },
    unitReward() {
      return `1 ${this.convertCoin.symbol} = ${this.getFixed(this.reward, this.toCoin.precision > 6 ? 6 : this.toCoin.precision)} ${this.toCoin.symbol}`;
    },
    displayedSlippage() {
      return `Slippage: ${this.getFixed(this.slippage, 2)}%`;
    },
    slippageHigh() {
      return Number(this.slippage) > 0.2;
    },
    convertButtonEnabled() {
      if (!this.convertCoin || !this.toCoin) {
        return false;
      }
      if (!this.convertible) {
        return false;
      }
      if (this.exchangeType === 'dollars' && this.dollarsAmountValue === 0) {
        return false;
      }
      if (this.exchangeType !== 'dollars' && this.convertAmountValue === 0) {
        return false;
      }
      return true;
    }
  },
  methods: {
    async validateDollarAmount(val) {
      if (this.convertCoin && this.dollarsAmountValue > this.convertCoin.amount * this.convertCoin.price) {
        this.dollarsAmount = (this.convertCoin.amount * this.convertCoin.price).toString().substring(0, 8);
      } else if (val.charAt(val.length-1) !== '.') {
        const cleanStr = val.replace(/\s/g, '');
        const num = parseFloat(cleanStr) || 0;
        const maxValue = Math.max(0, num);
        if (this.dollarsAmountValue !== maxValue) {
          this.dollarsAmount = Math.max(0, num).toString();
        }
      }
      if (this.convertCoin && this.toCoin) {
        this.validateConvertAmount((this.dollarsAmountValue / this.convertCoin.price).toString());
      }
    },
    async validateConvertAmount(val) {
      if (this.convertCoin && this.convertAmountValue > this.convertCoin.amount) {
        this.convertAmount = (this.convertCoin.amount).toString().substring(0, 8);
      } else if (val.charAt(val.length-1) !== '.') {
        const cleanStr = val.replace(/\s/g, '');
        const num = parseFloat(cleanStr) || 0;
        const maxValue = Math.max(0, num);
        if (this.convertAmountValue !== maxValue) {
          this.convertAmount = this.getFixed(Math.max(0, num), this.convertCoin.precision).replace(',', '');
        }
      }
      if (this.convertCoin && this.toCoin) {
        try {
          const reward = await this.bancorModule.getReturn({
            from: {
              id: `${this.convertCoin.account}-${this.convertCoin.symbol}`,
              amount: this.convertAmount
            },
            toId: `${this.toCoin.account}-${this.toCoin.symbol}`
          });
          if (reward.slippage) {
            this.slippage = reward.slippage;
          }
          if (reward.fee) {
            this.fee = reward.fee;
          }
          this.toAmount = this.getFixed(Number(reward.amount), this.toCoin.precision).replace(',', '');
          this.reward = this.toAmountValue / this.convertAmountValue;
          this.convertible = true;
        } catch (e) {
          this.$q.notify({
            type: 'dark',
            message: e.message,
          });
          this.convertible = false;
        }
      }
    },
    async validateToAmount(val) {
      if (val.charAt(val.length-1) !== '.') {
        const cleanStr = val.replace(/\s/g, '');
        const num = parseFloat(cleanStr) || 0;
        const maxValue = Math.max(0, num);
        if (this.toAmountValue !== maxValue) {
          this.toAmount = this.getFixed(Math.max(0, num), this.toCoin.precision).replace(',', '');
        }
      }
      if (this.convertCoin && this.toCoin) {
        try {
          const reward = await this.bancorModule.getCost({
            fromId: `${this.convertCoin.account}-${this.convertCoin.symbol}`,
            to: {
              id: `${this.toCoin.account}-${this.toCoin.symbol}`,
              amount: this.toAmount
            }
          });
          if (reward.slippage) {
            this.slippage = reward.slippage;
          }
          if (reward.fee) {
            this.fee = reward.fee;
          }
          this.convertAmount = this.getFixed(Math.min(this.convertCoin.amount, reward.amount), this.convertCoin.precision).replace(',', '');
          this.reward = this.toAmountValue / this.convertAmountValue;
          this.convertible = true;
        } catch (e) {
          this.$q.notify({
            type: 'dark',
            message: e.message,
          });
          this.convertible = false;
        }
      }
    },
    onUpdate(stepIndex, steps) {
      console.log(stepIndex, steps);
    },
    async convertPressed() {
      try {
        const result = await this.bancorModule.convert({
          from: {
            id: `${this.convertCoin.account}-${this.convertCoin.symbol}`,
            amount: this.convertAmount,
          },
          to: {
            id: `${this.toCoin.account}-${this.toCoin.symbol}`,
            amount: this.toAmount,
          },
          onUpdate: this.onUpdate
        });

        this.$q.notify({
          type: 'primary',
          message: `${this.convertCoin.symbol} is converted into ${this.toCoin.symbol}`,
        });
        this.showDlg = false;
      } catch (e) {
        this.$q.notify({
          type: 'negative',
          message: e.message,
        });
      }
    },
  },
  watch: {
    showExchangeDlg: function(val, oldVal) {
      if (val) {
        this.exchangeType = 'dollars';
        this.dollarsAmount = '0';
        this.convertAmount = '0';
        this.toAmount = '0';
        this.showSelectCoinDlg = false;
        this.dlgType = 'convert';
        this.convertCoin = this.selectedConvertCoin;
        this.toCoin = null;
      }
    },
    exchangeType: function (val, oldVal) {
      if (val === 'dollars' && this.convertCoin) {
        this.dollarsAmount = this.getFixed(this.convertAmount * this.convertCoin.price, 2);
      }
    },
    dollarsAmount: async function(val, oldVal) {
      setInterval(() => {
        const widthElement = this.$refs.widthElement;
        this.inputWidth = widthElement ? widthElement.clientWidth + 5 : 50;
      }, 1);

      if (this.dollarsAmount != oldVal) {
        await this.validateDollarAmount(val);
      }
    },
    convertAmount: async function(val, oldVal) {
      if(this.$refs.convertAmountElement !== window.document.activeElement) {
        return;
      }
      if (this.convertAmount != oldVal) {
        await this.validateConvertAmount(val);
      }
    },
    toAmount: async function(val, oldVal) {
      if(this.$refs.toAmountElement !== window.document.activeElement) {
        return;
      }
      if (this.toAmount != oldVal) {
        this.validateToAmount(val);
      }
    },
    selectedCoin: async function(val, oldVal) {
      if (val) {
        if (this.dlgType === 'convert') {
          this.convertCoin = val;
          if (this.exchangeType === 'dollars') {
            await this.validateDollarAmount(this.dollarsAmount);
          } else {
            await this.validateConvertAmount(this.convertAmount);
          }
        } else {
          this.toCoin = val;
          if (this.exchangeType === 'dollars') {
            await this.validateDollarAmount(this.dollarsAmount);
          } else {
            await this.validateToAmount(this.toAmount);
          }
        }
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
  border: none;
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
.main-card {
  background-image: linear-gradient(white, #f0f0f0);
}
.convert-card {
  border-radius: 25px;
}

.equalAmount{
  margin-top: 5rem;
  margin-bottom: -5rem;
}

.convertBtn{
  /* position:relative; */
  width: 100%;
  margin-top: 2rem;
  margin-bottom: 1rem;
}

.convertBtn1{
  /* position:relative; */
  width: 400px;
  left: 50%;  
  transform: translate(-200px);
}

.dollarBgimg1{
  align-content: center;
  height: auto;
  width: 15rem;
  align-content: center;
  align-self: center;
}

.dollarBgimg2{
  align-content: center;
  width: 12rem;
  height: auto;
  align-content: center;
  align-self: center;
}

.cryptoImg1{
  position: absolute;
  width: 2rem;
  height: 2rem;
  
}
.cryptoImg2{
  position: absolute;
  width: 3rem;
  height: 3rem;
}

.avatarBackground1{
  position: absolute;
  width: 3rem;
  height: 3rem;
  
  /* margin-bottom: -1rem; */
}
.avatarBackground2{
  position: absolute;
  width: 4rem;
  height: 4rem;
  margin-top: 0rem;
  margin-left: 0rem;
  /* margin-bottom: -1rem; */
}

.card{
  box-shadow:  0 0px 0px rgb(0 0 0 / 0);
}

.q-card{
  box-shadow:  0 0px 0px rgb(0 0 0 / 0);
}

.closebBtn{
  border: 2px solid white;
}

.main-background {
  background: #020039;
}

.main-background-overlay {
   background:  url("~assets/MainBG.svg");
   background-repeat: no-repeat;
   background-size: cover;
}
</style>