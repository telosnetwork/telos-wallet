<template>
  <q-dialog
    v-model="showDlg"
    :full-height="false"
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <div class="popupCard">
      <div class="exitBtn">
        <q-btn
          round
          flat
          dense
          v-close-popup
          class="text-grey-6"
          icon="close"
        />
      </div>
      <div class="popupHeading">
        <div />
        <div class="text-h5 text-weight-medium text-center q-mt-lg">
          Network Resources
        </div>
        <div />
      </div>
      <div class="text-center">
        <div class="text-subtitle2 text-grey-4 text-center q-mb-sm">
          Stake CPU and NET for processing transactions. RAM is used for storing
          data on the blockchain.
        </div>
        <div class="fit row wrap justify-center items-start content-center">
          <!-- CPU -->
          <div class="col">
            <div
              class="fit column wrap justify-center items-center content-center"
            >
              <q-circular-progress
                show-value
                font-size="12px"
                :value="usedCPU/totalCPU * 100"
                size="70px"
                :thickness="0.3"
                color="teal"
                track-color="grey-3"
                class="q-ma-md"
              >
                <div v-if="usedCPU/totalCPU * 100 > 1">
                  {{ (usedCPU/totalCPU * 100).toFixed(0) }}%
                </div>
                <div v-else>&lt; 1%</div>
              </q-circular-progress>

              <div>CPU</div>
              <div class="q-mt-sm">
                {{formatSec(usedCPU)}} /
                {{formatSec(totalCPU)}}
              </div>
              <div class="q-mt-sm">Total Staked:</div>
              <div>{{stakedTotalCPU}}</div>
            </div>
          </div>
          <!-- NET -->
          <div class="col">
            <div
              class="fit column wrap justify-center items-center content-center"
            >
              <q-circular-progress
                show-value
                font-size="12px"
                :value="usedNET/totalNET*100"
                size="70px"
                :thickness="0.3"
                color="teal"
                track-color="grey-3"
                class="q-ma-md"
              >
                <div v-if="usedNET/totalNET * 100 > 1">
                  {{ (usedNET/totalNET * 100).toFixed(0) }}%
                </div>
                <div v-else>&lt; 1%</div>
              </q-circular-progress>

              <div>NET</div>
              <div class="q-mt-sm">
                {{formatBytes(usedNET)}} / {{formatBytes(totalNET)}}
              </div>

              <div class="q-mt-sm">Total Staked:</div>
              <div>{{stakedTotalNET}}</div>
            </div>
          </div>
          <!-- RAM -->
          <div class="col">
            <div
              class="fit column wrap justify-center items-center content-center"
            >
              <q-circular-progress
                show-value
                font-size="12px"
                :value="usedRAM/totalRAM*100"
                size="70px"
                :thickness="0.3"
                color="teal"
                track-color="grey-3"
                class="q-ma-md"
              >
                {{ (usedRAM/totalRAM * 100).toFixed(0) }}%
              </q-circular-progress>

              <div>RAM</div>
              <div class="q-mt-sm">
                {{(formatBytes(usedRAM))}} / {{formatBytes(totalRAM)}}
              </div>
            </div>
          </div>
        </div>

        <div
          class="q-mt-md fit row wrap justify-center items-center content-center"
        >
          <q-select
            class="q-mr-sm"
            rounded
            v-model="selectedResource"
            :options="resourceOptions"
          />
          <q-input
            class="q-mr-sm"
            rounded
            v-model="amount"
            label="Amount in TLOS"
          />
          <q-btn
            @click="buyResources()"
            rounded
            color="primary"
            :label="selectedResource === 'RAM' ? 'Buy' : 'Stake'"
          />
        </div>
      </div>
    </div>
  </q-dialog>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import moment from "moment";
import { stakeRex } from "src/store/rex/actions";
import { format } from 'quasar'
// destructuring to keep only what is needed
const { capitalize, humanStorageSize } = format

export default {
  props: ["showManageResourcesDlg", "haveEVMAccount", "selectedCoin"],
  data() {
    return {
      amount: 0,
      selectedResource: 'RAM', //ram,cpu,net
      resourceOptions: [
        "RAM", "CPU", "NET"
      ],
      accountInfo: []
    };
  },
  computed: {
    ...mapGetters("account", ["isAuthenticated", "accountName"]),
    showDlg: {
      get() {
        return this.showManageResourcesDlg;
      },
      set(value) {
        this.$emit("update:showManageResourcesDlg", value);
      },
    },

    totalRAM() {
        if (this.accountInfo) {
          return this.accountInfo.ram_quota;
        } else {
            return 0;
        }
    },
    availRAM() {
        if (this.accountInfo) {
            return this.accountInfo.ram_quota - this.accountInfo.ram_usage;
        } else {
            return 0;
        }
    },
    usedRAM() {
        if (this.accountInfo) {
            return this.accountInfo.ram_usage;
        } else {
            return 0;
        }
    },

    totalCPU() {
        if (this.accountInfo) {
            return this.accountInfo.cpu_limit.max;
        } else {
            return 0;
        }
    },
    availCPU() {
        if (this.accountInfo) {
            return this.accountInfo.cpu_limit.available;
        } else {
            return 0;
        }
    },
    usedCPU() {
        if (this.accountInfo) {
            return this.accountInfo?.cpu_limit?.used;
        } else {
            return 0;
        }
    },
    stakedTotalCPU() {
        if (this.accountInfo) {
            return this.accountInfo.total_resources.cpu_weight;
        } else {
            return "0 TLOS";
        }
    },

    totalNET() {
        if (this.accountInfo) {
            return this.accountInfo.net_limit.max;
        } else {
            return 0;
        }
    },
    availNET() {
        if (this.accountInfo) {
            return this.accountInfo.net_limit.available;
        } else {
            return 0;
        }
    },
    usedNET() {
        if (this.accountInfo) {
            return this.accountInfo.net_limit.used;
        } else {
            return 0;
        }
    },
    stakedTotalNET() {
        if (this.accountInfo) {
            return this.accountInfo.total_resources.net_weight;
        } else {
            return "0 TLOS";
        }
    },

  },
  methods: {
    ...mapActions("rex", ["getRexBalance"]),

    inputBlur() {
      if (isNaN(this.amount)) this.amount = "0";
      else this.amount = Number(this.amount).toString();
    },

    async buyResources() {

      let actions = [];
      if (this.selectedResource == "RAM") {
        actions.push({
          account: "eosio",
          name: "buyram",
          data: {
            payer: this.accountName.toLowerCase(),
            receiver: this.accountName.toLowerCase(),
            quant:
              String(parseFloat(this.amount).toFixed(4)) + String(" TLOS")
          }
        });
      }

      if (this.selectedResource === "CPU" || this.selectedResource === "NET") {
        let NETtoBuy = this.selectedResource === "NET" ? this.amount : 0;
        let CPUtoBuy = this.selectedResource === "CPU" ? this.amount : 0;
        actions.push({
          account: "eosio",
          name: "delegatebw",
          data: {
            from: this.accountName.toLowerCase(),
            receiver: this.accountName.toLowerCase(),
            stake_net_quantity:
              String(parseFloat(NETtoBuy).toFixed(4)) + String(" TLOS"),
            stake_cpu_quantity:
              String(parseFloat(CPUtoBuy).toFixed(4)) + String(" TLOS"),
            transfer: false
          }
        });
      }

      try {
        const transaction = await this.$store.$api.signTransaction(
          actions,
          `Buying resources`
        );
        this.$q.notify({
          type: "primary",
          message: `Resources bought`
        });
        this.accountInfo = await this.$store.$api.getAccount(
          this.accountName.toLowerCase()
        );
        this.$root.$emit("resources_bought");
      } catch (error) {
        this.$errorNotification(error);
      }
    },

    formatSec(secs) {
        if (secs !== undefined) {
            if (secs > 1000 && secs < 1000000) {
                return `${(secs/1000).toFixed(2)} ms`;
            } else if (secs > 1000000) {
                return `${(secs/1000000).toFixed(2)} s`;
            } else {
                return secs;
            }
        }
    },

    formatBytes(bytes) {
        return humanStorageSize(bytes)
    }
  },
  watch: {},
  async mounted() {
    this.accountInfo = await this.$store.$api.getAccount(this.accountName);
    console.log(this.accountInfo)
  },
};
</script>

<style lang="scss" scoped>
.depositAddressToggle {
  cursor: pointer;
}
.lightBlue {
  color: $lightBlue;
}
.note {
  max-width: 25rem;
}
.depositBtn {
  flex-basis: 15rem;
  height: 3rem;
}
// .popupCard {
//   position: relative;
// }
.exitBtn {
  position: absolute;
  // right: 0px;
}
</style>
