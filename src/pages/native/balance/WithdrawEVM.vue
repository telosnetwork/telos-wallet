<script>
import { mapGetters, mapActions } from 'vuex';
import { getAntelope } from 'src/antelope';
const MINIMUM_RAM_BYTES = 1000;

export default {
    name: 'WithdrawEVM',
    emits: ['updateBalances'],
    props: ['showWithdrawEVMDlg', 'evmTLOSBalance'],
    data() {
        return {
            withdrawAmount: '0',
            displayAddress: false,
            ant : getAntelope(),
        };
    },
    computed: {
        ...mapGetters('account', ['isAuthenticated', 'accountName', 'evmAddress']),
        showDlg: {
            get() {
                return this.showWithdrawEVMDlg;
            },
            set(value) {
                this.$emit('update:showWithdrawEVMDlg', value);
            },
        },
    },
    methods: {
        ...mapActions('account', [
            'setEvmState',
        ]),
        inputBlur() {
            if (isNaN(this.withdrawAmount)) {
                this.withdrawAmount = '0';
            } else {
                this.withdrawAmount = Number(this.withdrawAmount).toString();
            }
        },
        displayEvmAddress() {

            this.ant.config.notifyWarningWithAction(this.$t('components.evm_address_disclaimer'), {
                label: this.ant.config.localizationHandler(this.$t('components.evm_disclaimer_confirmation')),
                handler: () => {
                    // user confirms they understand the single use-case for the generated evm address
                    this.displayAddress = true;
                },
            });
        },
        copyAddress() {
            navigator.clipboard.writeText(this.evmAddress);
            this.ant.config.notifySuccessCopyHandler();
        },
        async generateAddress(){
            const accountInfo = await this.$store.$api.getAccount(this.accountName);

            if (accountInfo.ram_quota - accountInfo.ram_usage <= MINIMUM_RAM_BYTES){ // If account (often newly created account) does not have sufficient RAM, notify user
                this.$errorNotification(this.$t('resources.insufficient_ram'));
                return;
            }
            const actions = [];
            if (!this.evmAddress) {
                actions.push({
                    account: 'eosio.evm',
                    name: 'create',
                    data: {
                        account: this.accountName.toLowerCase(),
                        data: 'create',
                    },
                });
            }
            try {
                const transaction = await this.$store.$api.signTransaction(
                    actions,
                    this.$t('components.create_evm_for', { account: this.accountName }),
                );
                await this.setEvmState();
                this.$successNotification(this.$t('components.created_evm_for', { account: this.accountName }));
            } catch (error) {
                this.$errorNotification(error);
            }
        },
        async withdraw() {
            let amount = parseFloat(this.withdrawAmount);
            if (amount > parseFloat(this.evmTLOSBalance)) {
                this.$errorNotification(this.$t('components.cannot_withdraw', { balance:this.evmTLOSBalance }));
                return;
            }

            let quantityStr = `${amount.toFixed(4)} TLOS`;
            let actions = [];

            actions.push({
                account: 'eosio.evm',
                name: 'withdraw',
                data: {
                    to: this.accountName.toLowerCase(),
                    quantity: quantityStr,
                },
            });

            try {
                const transaction = await this.$store.$api.signTransaction(
                    actions,
                    this.$t('components.deposit_to_evm', { quantity:quantityStr }),
                );
                this.$emit('updateBalances');
                this.showDlg = false;
                this.$successNotification(this.$t('components.is_withdrawn_from_evm', { quantity:quantityStr }));
            } catch (error) {
                this.$errorNotification(error);
            }
        },
    },
};
</script>

<template>
<q-dialog
    v-model="showDlg"
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
            <div class="text-h5 text-weight-medium text-center q-mt-lg ">
                {{$t('components.evm_withdraw')}}
            </div>
            <div ></div>
        </div>
        <div class="popupBody text-center">
            <div class="text-center text-subtitle2 text-grey-4">
                {{$t('components.withdraw_1')}}<br >{{$t('components.withdraw_2')}}
            </div>
            <div
                v-if="displayAddress"
            >
                <q-btn
                    class="purpleGradient addressCopyBtn"
                    no-caps
                    rounded
                    icon="content_copy"
                    :label="evmAddress"
                    @click="copyAddress"
                />
            </div>
            <div v-if="evmAddress && !displayAddress">
                <q-btn
                    class="purpleGradient generateAccountBtn"
                    no-caps
                    rounded
                    label="Display Linked EVM Address"
                    @click="displayEvmAddress"
                />
            </div>
            <div v-if="!evmAddress" class="row justify-center">
                <div
                    class="note"
                >
                    {{$t('components.evm_address_not_found')}}
                </div>
            </div>
            <div v-if="!evmAddress" class="row justify-center">
                <q-btn
                    class="purpleGradient generateAccountBtn"
                    no-caps
                    rounded
                    label="Generate Linked EVM address"
                    @click="generateAddress"
                />
            </div>
            <div class="text-center q-mt-md">
                <div class="inputAmount row items-center ">
                    <input
                        v-model="withdrawAmount"
                        type="text"
                        class="col text-weight-regular text-right no-border no-outline transparent text-white"
                        autofocus="true"
                        @focus="withdrawAmount = withdrawAmount === '0' ? '' : withdrawAmount"
                        @blur="inputBlur"
                    >
                    <label class="text-weight-regular q-ml-sm text-left">
                        TLOS
                    </label>
                </div>
                <div class="" @click="withdrawAmount=evmTLOSBalance">Max: {{ evmTLOSBalance || '0' }}</div>
            </div>
            <div class="row justify-center q-mt-md q-mb-lg">
                <q-btn
                    :disabled="!(evmTLOSBalance > 0) && !evmAddress"
                    class="purpleGradient withdrawBtn"
                    no-caps
                    rounded
                    :label="$t('components.withdraw')"
                    @click="withdraw"
                />
            </div>
        </div>
    </div>
</q-dialog>
</template>

<style lang="scss" scoped>

.exitBtn {
    position: absolute;
}
.withdrawBtn {
    flex-basis: 15rem;
    height: 3rem;
}
.generateAccountBtn, .addressCopyBtn {
  flex-basis: 15rem;
  height: 3rem;
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.addressCopyBtn{
    font-size: 18px;
    word-break: break-all;
    height: fit-content;
}

</style>


