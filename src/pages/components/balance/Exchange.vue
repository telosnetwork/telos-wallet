<template>
  <q-dialog
    v-model="showDlg"
    persistent
    :maximized="true"
    transition-show="slide-left"
    transition-hide="slide-right"
  >
    <q-card class="full-height main-card" style="max-width: 800px; margin: auto;">
      <q-layout
        view="hhh Lpr fFf"
        container
        class="shadow-4 coinview"
      >
        <q-header class="bg-white text-grey-8 q-pa-sm">
          <q-toolbar class="no-padding">
            <q-toolbar-title class="absolute full-width no-padding text-center">
              <q-btn-group class="full-width justify-center" push unelevated>
                <q-btn 
                  class="q-px-md"
                  push no-caps
                  label="Dollars"
                  :style="`background: ${exchangeType === 'dollars' ? 'rgb(250, 250, 250)' : 'rgb(240, 240, 240)'};
                          color: ${exchangeType === 'dollars' ? 'black' : 'lightgrey'};`"
                  @click="exchangeType = 'dollars'"
                />
                <q-btn
                  class="q-px-md"
                  push no-caps
                  label="Crypto"
                  :style="`background: ${exchangeType !== 'dollars' ? 'rgb(250, 250, 250)' : 'rgb(240, 240, 240)'};
                          color: ${exchangeType !== 'dollars' ? 'black' : 'lightgrey'};`"
                  @click="exchangeType = 'crypto'"
                />
              </q-btn-group>
            </q-toolbar-title>
            <q-btn round flat dense v-close-popup class="text-grey-6" icon="west"/>
          </q-toolbar>
        </q-header>
        <q-page-container class="q-mx-auto q-py-sm" style="max-width: 600px;">
          <q-card v-if="exchangeType === 'dollars'" class="column q-mx-lg q-mt-xl shadow-4 convert-card" style="height: 200px;">
            <q-space/>
            <q-item class="list-item full-width">
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
            </q-item>
            <q-space/>
            <q-item class="row list-item full-width q-px-none">
              <div class="col q-mx-lg">
                <q-item-section style="display: block;">
                  <div class="text-black display-grid">
                    <label class="text-subtitle1 text-weight-medium text-blue-grey-4">Convert</label>
                    <label
                      class="text-subtitle1 text-weight-medium wraplabel"
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
              </div>
              <q-separator vertical class="q-my-auto" style="width: 3px; height: 80%;"/>
              <div class="col q-mx-lg">
                <q-item-section style="display: block;">
                  <div class="text-black display-grid">
                    <label class="text-subtitle1 text-weight-medium text-blue-grey-4">To</label>
                    <label
                      class="text-subtitle1 text-weight-medium wraplabel"
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
              </div>
            </q-item>
            <q-space/>
          </q-card>
          <q-card v-else class="column q-mx-lg q-mt-xl shadow-4 convert-card" style="height: 200px;">
            <q-space/>
            <q-item class="list-item full-width q-pb-none" style="min-height: 28px;">
              <q-item-section>
                <div class="text-black display-grid" style="width: 200px;">
                  <label class="text-subtitle1 text-weight-medium text-blue-grey-4">Convert</label>
                </div>
              </q-item-section>

              <q-item-section side>
                <div class="text-black text-right display-grid">
                  <input 
                    ref="convertAmountElement" 
                    type="text" maxlength="8"
                    :class="`text-weight-regular text-grey-6 text-right no-border no-outline transparent`"
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
                <div class="text-black display-grid" style="width: 200px;">
                  <label
                    class="text-subtitle1 text-weight-medium"
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
                <div class="text-black text-right display-grid">
                  <label class="text-caption text-grey-6">${{ convertCoin ? getFixed(convertAmount * convertCoin.price, 2) : 0 }}</label>
                </div>
              </q-item-section>
            </q-item>
            <q-space/>
            <q-separator style="height: 2px;"/>
            <q-space/>
            <q-item class="list-item full-width q-pb-none" style="min-height: 28px;">
              <q-item-section>
                <div class="text-black display-grid" style="width: 200px;">
                  <label class="text-subtitle1 text-weight-medium text-blue-grey-4">To</label>
                </div>
              </q-item-section>

              <q-item-section side>
                <div class="text-black text-right display-grid">
                  <input 
                    ref="toAmountElement" 
                    type="text" maxlength="8"
                    :class="`text-weight-regular text-grey-6 text-right no-border no-outline transparent`"
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
                <div class="text-black display-grid" style="width: 200px;">
                  <label
                    class="text-subtitle1 text-weight-medium"
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
                  <label class="text-caption text-grey-6">${{ toCoin ? getFixed(toAmount * toCoin.price, 2) : 0 }}</label>
                </div>
              </q-item-section>
            </q-item>
            <q-space/>
          </q-card>
          <div v-if="convertCoin && toCoin && convertAmountValue && toAmountValue"
            class="q-mt-md text-subtitle2 text-weight-bold text-center"
            :style="`color: ${themeColor};`"
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
          <div class="q-mt-lg q-px-xl full-width">
            <q-btn
              class="text-grey-5 text-subtitle2 full-width"
              :style="`height: 50px; background: ${themeColor}; font-size: 20px;`"
              flat
              no-caps
              label="Convert"
              :disable="!convertButtonEnabled"
              @click="convertPressed()"
            />
          </div>
        </q-page-container>
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
          this.convertAmount = Math.max(0, num).toString();
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
          this.toAmount = reward.amount;
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
          this.toAmount = Math.max(0, num).toString();
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
          this.convertAmount = Math.min(this.convertCoin.amount, reward.amount).toString();
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
</style>