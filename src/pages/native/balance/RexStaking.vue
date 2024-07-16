<script>
import { useChainStore } from 'src/antelope';
import { mapGetters, mapActions } from 'vuex';
import axios from 'axios';

export default {
    props: ['showRexStakeDlg', 'haveEVMAccount', 'selectedCoin'],
    data() {
        return {
            amount: 0,
            staking: true,
            tokenAmount: 0,
            tokenRexBalance: 0,
            rpc: null,
            apyString: 'Earn up to 13% APY',
        };
    },
    computed: {
        ...mapGetters('account', ['isAuthenticated', 'accountName']),
        showDlg: {
            get() {
                return this.showRexStakeDlg;
            },
            set(value) {
                this.$emit('update:showRexStakeDlg', value);
            },
        },
    },
    methods: {
        ...mapActions('rex', ['getRexBalance']),

        async getTokenAmount() {
            return Number(
                (
                    await this.rpc.get_currency_balance('eosio.token', this.accountName, 'TLOS')
                )[0]?.split(' ')[0] ?? '0',
            );
        },

        inputBlur() {
            if (isNaN(this.amount)) {
                this.amount = '0';
            } else {
                this.amount = Number(this.amount).toString();
            }
        },

        async stakeRex() {
            let quantityStr = `${Number(this.amount).toFixed(4)} TLOS`;
            const actions = [
                {
                    account: 'eosio',
                    name: 'deposit',
                    data: {
                        owner: this.accountName,
                        amount: quantityStr,
                    },
                },
                {
                    account: 'eosio',
                    name: 'buyrex',
                    data: {
                        from: this.accountName,
                        amount: quantityStr,
                    },
                },
            ];
            const transaction = await this.$store.$api.signTransaction(
                actions,
                `Deposit ${this.amount} TLOS to REX`,
            );
        },

        async unstakeRex() {
            let quantityStr = `${Number(this.amount).toFixed(4)} TLOS`;
            let accountInfo = await this.$store.$api.getAccount(this.accountName);
            let totalRex = Number(accountInfo.rex_info.rex_balance.split(' ')[0]);
            let portionToUnstake = Number(this.amount) / this.tokenRexBalance;
            let rexToUnstake = (totalRex * portionToUnstake).toFixed(4);

            //   TODO check maturities
            const actions = [
                {
                    account: 'eosio',
                    name: 'sellrex',
                    data: {
                        from: this.accountName,
                        rex: `${rexToUnstake} REX`,
                    },
                },
                {
                    account: 'eosio',
                    name: 'withdraw',
                    data: {
                        owner: this.accountName,
                        amount: quantityStr,
                    },
                },
            ];
            const transaction = await this.$store.$api.signTransaction(
                actions,
                this.$t('components.withdraw_from_rex', {
                    amount: quantityStr,
                }),
            );
        },

        async setApy() {
            try{
                const telosApi = axios.create({
                    baseURL: useChainStore().currentChain.settings.getApiEndpoint(),
                });
                const apy = (await telosApi.get('apy/native')).data;
                const earn = this.$t('components.earn');
                this.apyString = `${earn} ${apy}% APY`;
            }catch(e) {
                console.error(e);
            }
        },

        async tryStake() {
            try {
                await this.stakeRex();
                this.tokenAmount = await this.getTokenAmount();
                this.$successNotification(this.$t('components.is_staked_to_REX', { amount:this.amount }));
                this.amount = '0';
            } catch (error) {
                console.error(error);
                this.$errorNotification(error);
            }
        },

        async tryUnstake() {
            try {
                await this.unstakeRex();
                this.tokenRexBalance = await this.getRexBalance(this.accountName);
                this.$successNotification(this.$t('components.is_withdrawn_from_REX', { amount:this.amount }));
                this.amount = '0';
                this.amount = '0';
            } catch (error) {
                console.error(error);
                this.$errorNotification(error);
            }
        },
    },
    watch: {
        showRexStakeDlg(val){
            if (val){
                this.staking = true;
            }
        },
    },
    async mounted() {
        await this.setApy();
        this.tokenRexBalance = await this.getRexBalance(this.accountName);
        this.rpc = this.$store.$api.getRpc();
        this.tokenAmount = await this.getTokenAmount();
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
            <div class="text-h5 text-weight-medium text-center q-mt-lg">{{$t('components.staking_rex')}}</div>
            <div ></div>
        </div>
        <div class="text-center">
            <div class="text-subtitle2 text-grey-4 text-center q-mb-sm">
                {{ apyString }}
            </div>
            <q-btn-toggle
                v-model="staking"
                color="dark"
                toggle-color="dark"
                toggle-text-color="white"
                text-color="grey-7"
                rounded
                no-caps
                :options="[
                    { label: 'Stake', value: true },
                    { label: 'Unstake', value: false },
                ]"
            />
            <div v-if="staking" class="q-mt-md" @click="amount = tokenAmount">
                {{$t('components.available')}}: {{ tokenAmount }}
                {{ "TLOS" }}
            </div>
            <div v-if="!staking" class="q-mt-md" @click="amount = tokenRexBalance">
                {{$t('components.deposited')}}: {{ tokenRexBalance }}
                {{ "TLOS" }}
            </div>
            <div class="text-center q-mt-md">
                <div class="inputAmount row items-center">
                    <input
                        v-model="amount"
                        type="text"
                        class="col text-weight-regular text-right no-border no-outline transparent text-white"
                        autofocus="true"
                        @focus="amount = amount === '0' ? '' : amount"
                        @blur="inputBlur"
                    >
                    <label class="text-weight-medium q-ml-sm text-left"> TLOS </label>
                </div>
            </div>
            <div class="q-my-md">
                <q-btn
                    class="q-mx-xs"
                    color="secondary"
                    outline
                    rounded
                    label="25%"
                    @click="
                        amount = (
                            staking ? tokenAmount * 0.25 : tokenRexBalance * 0.25
                        ).toFixed(4)
                    "
                />
                <q-btn
                    class="q-mx-xs"
                    color="secondary"
                    outline
                    rounded
                    label="50%"
                    @click="
                        amount = (
                            staking ? tokenAmount * 0.5 : tokenRexBalance * 0.5
                        ).toFixed(4)
                    "
                />
                <q-btn
                    class="q-mx-xs"
                    color="secondary"
                    outline
                    rounded
                    label="75%"
                    @click="
                        amount = (
                            staking ? tokenAmount * 0.75 : tokenRexBalance * 0.75
                        ).toFixed(4)
                    "
                />
                <q-btn
                    class="q-mx-xs"
                    color="secondary"
                    outline
                    rounded
                    label="100%"
                    @click="
                        amount = (staking ? tokenAmount : tokenRexBalance * 1).toFixed(4)
                    "
                />
            </div>
            <div class="row justify-center">
                <q-btn
                    class="purpleGradient depositBtn"
                    no-caps
                    rounded
                    :label="staking ? 'Stake Now' : 'Unstake Now'"
                    @click="staking ? tryStake() : tryUnstake()"
                />
            </div>
            <div v-if="staking" class="q-mt-sm">
                {{$t('components.lock_4_days')}}
            </div>
        </div>
    </div>
</q-dialog>
</template>

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

.exitBtn {
  position: absolute;
}
</style>
