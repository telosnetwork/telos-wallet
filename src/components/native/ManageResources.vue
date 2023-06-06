<script>
import { mapGetters } from 'vuex';
import { format } from 'quasar';
// destructuring to keep only what is needed
const { capitalize, humanStorageSize } = format;

export default {
    props: ['showManageResourcesDlg'],
    data() {
        return {
            amount: '',
            selectedResource: 'RAM', //ram,cpu,net
            resourceOptions: ['RAM', 'CPU', 'NET'],
            accountInfo: undefined,
        };
    },
    computed: {
        ...mapGetters('account', ['isAuthenticated', 'accountName']),
        showDlg: {
            get() {
                return this.showManageResourcesDlg;
            },
            set(value) {
                this.$emit('update:showManageResourcesDlg', value);
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
                return '0 TLOS';
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
                return '0 TLOS';
            }
        },
    },
    methods: {
        async buyResources() {
            let actions = [];
            if (this.selectedResource === 'RAM') {
                actions.push({
                    account: 'eosio',
                    name: 'buyram',
                    data: {
                        payer: this.accountName.toLowerCase(),
                        receiver: this.accountName.toLowerCase(),
                        quant: String(parseFloat(this.amount).toFixed(4)) + String(' TLOS'),
                    },
                });
            }

            if (this.selectedResource === 'CPU' || this.selectedResource === 'NET') {
                let NETtoBuy = this.selectedResource === 'NET' ? this.amount : 0;
                let CPUtoBuy = this.selectedResource === 'CPU' ? this.amount : 0;
                actions.push({
                    account: 'eosio',
                    name: 'delegatebw',
                    data: {
                        from: this.accountName.toLowerCase(),
                        receiver: this.accountName.toLowerCase(),
                        stake_net_quantity: String(parseFloat(NETtoBuy).toFixed(4)) + String(' TLOS'),
                        stake_cpu_quantity: String(parseFloat(CPUtoBuy).toFixed(4)) + String(' TLOS'),
                        transfer: false,
                    },
                });
            }

            try {
                const transaction = await this.$store.$api.signTransaction(
                    actions,
                    this.$t('resources.buying_resources'),
                );
                this.$successNotification(this.$t('resources.resources_bought'));
                this.accountInfo = await this.$store.$api.getAccount(
                    this.accountName.toLowerCase(),
                );
                this.$emitter.emit('resources_bought');
            } catch (error) {
                this.$errorNotification(error);
            }
        },

        formatSec(secs) {
            if (secs !== undefined) {
                if (secs > 1000 && secs < 1000000) {
                    return `${(secs / 1000).toFixed(2)}ms`;
                } else if (secs > 1000000) {
                    return `${(secs / 1000000).toFixed(2)}s`;
                } else {
                    return secs;
                }
            }
        },

        formatBytes(bytes) {
            return humanStorageSize(bytes);
        },
    },
    watch: {
        async accountName(newAccountName) {
            if (this.isAuthenticated) {
                this.accountInfo = await this.$store.$api.getAccount(this.accountName);
            }
        },
    },
    async mounted() {
        if (this.isAuthenticated) {
            this.accountInfo = await this.$store.$api.getAccount(this.accountName);
        }
    },
};
</script>

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
                v-close-popup
                round
                flat
                dense
                class="text-grey-6"
                icon="close"
            />
        </div>
        <div class="popupHeading">
            <div ></div>
            <div class="text-h5 text-weight-medium text-center q-mt-lg">
                {{$t('resources.title')}}
            </div>
            <div ></div>
        </div>
        <div class="text-center">
            <div class="text-subtitle2 text-grey-4 text-center q-mb-sm">
                {{$t('resources.intro')}}
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
                            :value="(usedCPU / totalCPU) * 100"
                            size="70px"
                            :thickness="0.3"
                            color="grey"
                            track-color="grey-3"
                            class="q-ma-md"
                        >
                            <div v-if="(usedCPU / totalCPU) * 100 > 1">
                                <div class="col">
                                    <div>{{ ((usedCPU / totalCPU) * 100).toFixed(0) }}%</div>
                                    <div>{{$t('resources.used')}}</div>
                                </div>
                            </div>
                            <div v-else>
                                &lt; 1%
                                <div>{{$t('resources.used')}}</div>
                            </div>
                        </q-circular-progress>

                        <div>CPU</div>
                        <div class="q-mt-sm">
                            {{ formatSec(usedCPU) }} /
                            {{ formatSec(totalCPU) }}
                        </div>
                        <div class="q-mt-sm">{{$t('resources.total_staked')}}:</div>
                        <div>{{ stakedTotalCPU }}</div>
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
                            :value="(usedNET / totalNET) * 100"
                            size="70px"
                            :thickness="0.3"
                            color="teal"
                            track-color="grey-3"
                            class="q-ma-md"
                        >
                            <div v-if="(usedNET / totalNET) * 100 > 1">
                                <div class="col">
                                    <div>{{ ((usedNET / totalNET) * 100).toFixed(0) }}%</div>
                                    <div>{{$t('resources.used')}}</div>
                                </div>
                            </div>
                            <div v-else>
                                &lt; 1%
                                <div>{{$t('resources.used')}}</div>
                            </div>
                        </q-circular-progress>

                        <div>NET</div>
                        <div class="q-mt-sm">
                            {{ formatBytes(usedNET) }} / {{ formatBytes(totalNET) }}
                        </div>

                        <div class="q-mt-sm">{{$t('resources.total_staked')}}:</div>
                        <div>{{ stakedTotalNET }}</div>
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
                            :value="(usedRAM / totalRAM) * 100"
                            size="70px"
                            :thickness="0.3"
                            color="purple"
                            track-color="grey-3"
                            class="q-ma-md"
                        >
                            <div class="col">
                                <div>{{ ((usedRAM / totalRAM) * 100).toFixed(0) }}%</div>
                                <div>{{$t('resources.used')}}</div>
                            </div>
                        </q-circular-progress>

                        <div>RAM</div>
                        <div class="q-mt-sm">
                            {{ formatBytes(usedRAM) }} / {{ formatBytes(totalRAM) }}
                        </div>
                    </div>
                </div>
            </div>

            <div
                class="q-mt-sm q-gutter-y-md fit column wrap justify-center items-center content-center"
            >
                <q-select
                    v-model="selectedResource"
                    dark
                    options-dark
                    :options="resourceOptions"
                    class="resource-input"
                />
                <q-input
                    v-model="amount"
                    dark
                    darklabel-color="white"
                    color="white"
                    input-style="color: white"
                    input-class="text-white"
                    label="Amount in TLOS"
                    class="resource-input"
                />
                <q-btn
                    rounded
                    class="purpleGradient buy-button"
                    size="lg"
                    :label="selectedResource === 'RAM' ? $t('resources.buy') : $t('resources.add')"
                    @click="buyResources()"
                />
            </div>
        </div>
    </div>
</q-dialog>
</template>

<style lang="scss" scoped>
.resource-input {
    width: 20em;
}

.buy-button {
    width: 15em;
}

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
.exitBtn {
  position: absolute;
  // right: 0px;
}
</style>
