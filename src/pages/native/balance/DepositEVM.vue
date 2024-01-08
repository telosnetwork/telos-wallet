<script>
import { mapGetters, mapActions } from 'vuex';

export default {
    name: 'WithdrawEVM',
    emits: ['updateBalances', 'addEvmNetwork'],
    props: ['showDepositEVMDlg', 'nativeTLOSBalance'],
    data() {
        return {
            depositAmount: '0',
            recipientAddress: '',
            recipientAddressExists: true,
        };
    },
    computed: {
        ...mapGetters('account', ['isAuthenticated', 'accountName']),
        showDlg: {
            get() {
                return this.showDepositEVMDlg;
            },
            set(value) {
                this.$emit('update:showDepositEVMDlg', value);
            },
        },
        noDepositInputAmount(){
            return (parseFloat(this.depositAmount) > 0) ? null: true;
        },
    },
    methods: {
        ...mapActions('account', [
            'setEvmState',
        ]),
        addEvmNetwork() {
            let params = [];
            if (this.chainName !== 'telos') {
                params = [
                    {
                        chainId: '0x29',
                        chainName: 'Telos EVM Testnet',
                        nativeCurrency: {
                            name: 'Telos',
                            symbol: 'TLOS',
                            decimals: 4,
                        },
                        rpcUrls: ['https://testnet.telos.net/evm'],
                        blockExplorerUrls: ['https://testnet.teloscan.io'],
                    },
                ];
            } else {
                params = [
                    {
                        chainId: '0x28',
                        chainName: 'Telos EVM Mainnet',
                        nativeCurrency: {
                            name: 'Telos',
                            symbol: 'TLOS',
                            decimals: 4,
                        },
                        rpcUrls: ['https://mainnet.telos.net/evm'],
                        blockExplorerUrls: ['https://teloscan.io'],
                    },
                ];
            }

            window.ethereum
                .request({ method: 'wallet_addEthereumChain', params })
                .then(() => console.debug('Success'))
                .catch(error => console.error('Error', error.message));
        },
        inputBlur() {
            if (isNaN(this.depositAmount)) {
                this.depositAmount = '0';
            } else {
                this.depositAmount = Number(this.depositAmount).toString();
            }
        },
        async checkRecipientExist() {
            try {
                const _ = await this.$store.$evmApi.telos.getEthAccount(
                    this.recipientAddress.toLowerCase(),
                );
                this.recipientAddressExists = true;
            } catch (error) {
                this.recipientAddressExists = false;
            }
        },
        async deposit() {
            let amount = parseFloat(this.depositAmount);
            if (amount > parseFloat(this.nativeTLOSBalance)) {
                this.$errorNotification(this.$t('components.cant_deposit_more', { balance: this.nativeTLOSBalance }));
                return;
            }

            let quantityStr = `${amount.toFixed(4)} TLOS`;
            let actions = [];
            let memo = '';
            memo = this.recipientAddress.toLowerCase();
            await this.checkRecipientExist();
            if (!this.recipientAddressExists) {
                actions.push({
                    account: process.env.EVM_CONTRACT,
                    name: 'openwallet',
                    data: {
                        account: this.accountName.toLowerCase(),
                        address: this.recipientAddress.slice(2),
                    },
                });
            }

            actions.push({
                account: 'eosio.token',
                name: 'transfer',
                data: {
                    from: this.accountName.toLowerCase(),
                    to: 'eosio.evm',
                    quantity: quantityStr,
                    memo: memo,
                },
            });

            try {
                const transaction = await this.$store.$api.signTransaction(
                    actions,
                    this.$t('components.deposit_to_evm', { quantity: quantityStr }),
                );

                this.$emit('updateBalances');

                this.depositAmount = '0';
                this.recipientAddress = '';
                this.recipientAddressExists = true;
                this.showDlg = false;

                this.$successNotification(this.$t('components.deposited_to_evm', { quantity: quantityStr }));
            } catch (error) {
                this.$errorNotification(error);
            }
        },
    },
    watch: {
        showDepositEVMDlg() {
            if (this.showDlg) {
                this.$emit('addEvmNetwork');
            };
        },
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
                {{$t('components.evm_deposit')}}
            </div>
            <div ></div>
        </div>
        <div class="text-center">
            <div class="text-subtitle2 text-grey-4 text-center">
                {{$t('components.deposit_1')}}<br >{{$t('components.deposit_2')}}
            </div>
            <div class="text-center q-mt-md">
                <div class="inputAmount row items-center">
                    <input
                        v-model="depositAmount"
                        type="text"
                        class="col text-weight-regular text-right no-border no-outline transparent text-white"
                        autofocus="true"
                        @focus="
                            depositAmount = depositAmount === '0' ? '' : depositAmount
                        "
                        @blur="inputBlur"
                    >
                    <label class="text-weight-medium q-ml-sm text-left"> TLOS </label>
                </div>
                <div
                    class="depositAddressToggle"
                    @click="depositAmount = nativeTLOSBalance"
                >
                    {{$t('components.max')}}: {{ nativeTLOSBalance }}
                </div>
            </div>
            <div class="depositInput row justify-center">
                <q-input
                    v-model="recipientAddress"
                    label="Recipient (Metamask Address)"
                    rounded
                    outlined
                    class="q-pt-md col-11"
                    standout="bg-transparent text-white"
                    label-color="white"
                    color="white"
                    input-class="text-white"
                    :rules="[
                        (val) =>
                            (val.slice(0, 2) === '0x' && val.length === 42) ||
                            'Invalid address',
                    ]"
                    @input="checkRecipientExist"
                    @focus="checkRecipientExist"
                />
            </div>
            <div class="row justify-center">
                <q-btn
                    :disabled="noDepositInputAmount || !recipientAddress"
                    class="purpleGradient depositBtn"
                    no-caps
                    rounded
                    label="Deposit"
                    @click="deposit"
                />
            </div>

            <div class="row justify-center">
                <div
                    class="lightBlue depositAddressToggle q-mt-xs"
                    @click="addEvmNetwork"
                >
                    {{$t('components.add_evm_network')}}
                </div>
            </div>
            <div class="row justify-center q-mt-md">
                <q-card-section class="q-pt-sm text-warning">
                    {{$t('components.dont_send_to_exchanges')}}
                </q-card-section>
            </div>
        </div>
    </div>
</q-dialog>
</template>


<style lang="scss" scoped>
.depositAddressToggle {
  font-size: .8rem;
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
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.exitBtn {
  position: absolute;
}

.q-input{
  font-size: .75rem;
}
</style>
