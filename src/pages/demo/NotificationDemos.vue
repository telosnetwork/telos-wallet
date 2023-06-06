<script lang="ts">
import { getAntelope } from 'src/antelope';
import { defineComponent } from 'vue';

const ant = getAntelope();

export default defineComponent({
    name: 'NotificationDemos',
    components: {
    },
    data: () => ({
        version: 0,
    }),
    computed: {
    },
    methods: {
        // InProgress -----
        notifyInProgress_sending() {
            console.debug('notifyInProgress_sending()');
            const quantity = '123.0427 TLOS';
            const address = '0x8a7C...3b0F';
            (this as any).$notifyNeutralMessage(
                this.$t('notification.neutral_message_sending', { quantity, address }),
            );
        },
        notifyInProgress_staking() {
            console.debug('notifyInProgress_staking()');
            const quantity = '123.0427 TLOS';
            (this as any).$notifyNeutralMessage(
                this.$t('notification.neutral_message_staking', { quantity }),
            );
        },
        notifyInProgress_unstaking() {
            console.debug('notifyInProgress_unstaking()');
            const quantity = '123.0427 TLOS';
            (this as any).$notifyNeutralMessage(
                this.$t('notification.neutral_message_unstaking', { quantity }),
            );
        },
        notifyInProgress_revoking() {
            console.debug('notifyInProgress_revoking()');
            const symbol = 'ETH';
            const address = '0x8a7C...3b0F';
            (this as any).$notifyNeutralMessage(
                this.$t('notification.neutral_message_revoking', { symbol, address }),
            );
        },
        // Success -----
        notifySuccess_transfer() {
            (this as any).$notifySuccessTransaction('https://www.teloscan.io/tx/0x4ee306e0046f3adb37d2943e1954835cbaa85a21e57046c5229b7fbb7f504e94');
        },
        notifySuccess_revoking() {
            const address = '0x8a7C...3b0F';
            const symbol = 'ETH';
            (this as any).$notifySuccessMessage(
                this.$t('notification.success_message_revoking', { address, symbol }),
            );
        },
        notifySuccess_copied() {
            console.debug('notifySuccess_copied()');
            (this as any).$notifySuccessCopy();
        },
        // Error -----
        notifyError_user_rejected() {
            console.debug('notifyError_user_rejected()');
            (this as any).$notifyFailure(this.$t('antelope.evm.error_user_rejected'));
        },
        notifyError_numeric_fault() {
            console.debug('notifyError_numeric_fault()');
            (this as any).$notifyFailure(this.$t('antelope.evm.error_numeric_fault'),
                {
                    code: 4001,
                    message: 'A numeric operation failed',
                    data: {
                        originalError: {
                            code: 3,
                            data: {
                                message: 'A numeric operation failed',
                            },
                            message: 'A numeric operation failed',
                        },
                    },
                },
            );
        },
        notifyError_call_exception() {
            console.debug('notifyError_call_exception()');
            (this as any).$notifyFailure(this.$t('antelope.evm.error_call_exception'),
                {
                    code: 4001,
                    message: 'An error occurred while calling the smart contract function',
                    data: {
                        originalError: {
                            code: 3,
                            data: {
                                message: 'An error occurred while calling the smart contract function',
                            },
                        },
                        contract: {
                            address: '0x8a7C3423b0F6eCfA4A56e6aD8A6F8Bd8dC8eE8f4',
                        },
                    },
                },
            );
        },
        notifyError_connection() {
            console.debug('notifyError_connection()');
            (this as any).$notifyDisconnected();
        },
    },
    watch: {
    },
});
</script>

<template>
<div class="row">
    <div class="col-12 col-md-10 col-lg-8">
        <h3>Notifications</h3>
        <hr >
        <div class="row">
            <div class="col-4">
                <h3>In Progress</h3>
            </div>
            <div class="col-4">
                <h3>Success</h3>
            </div>
            <div class="col-4">
                <h3>Error</h3>
            </div>
        </div>
        <div class="row">
            <div class="col-4 column items-start">
                <q-btn class="q-mt-sm q-mr-sm" color="primary" @click="notifyInProgress_sending">Sending tokens</q-btn>
                <q-btn class="q-mt-sm q-mr-sm" color="primary" @click="notifyInProgress_staking">Staking tokens</q-btn>
                <q-btn class="q-mt-sm q-mr-sm" color="primary" @click="notifyInProgress_unstaking">Unstaking tokens</q-btn>
                <q-btn class="q-mt-sm q-mr-sm" color="primary" @click="notifyInProgress_revoking">Revoking awollance</q-btn>
            </div>
            <div class="col-4 column items-start">
                <q-btn class="q-mt-sm q-mr-sm" color="positive" @click="notifySuccess_transfer">Transfer tokens success</q-btn>
                <q-btn class="q-mt-sm q-mr-sm" color="positive" @click="notifySuccess_revoking">Revoking awollance success</q-btn>
                <q-btn class="q-mt-sm q-mr-sm" color="positive" @click="notifySuccess_copied">Copied to clipboard success</q-btn>
            </div>
            <div class="col-4 column items-start">
                <q-btn class="q-mt-sm q-mr-sm" color="negative" @click="notifyError_user_rejected">User rejected</q-btn>
                <q-btn class="q-mt-sm q-mr-sm" color="negative" @click="notifyError_numeric_fault">Numeric fault</q-btn>
                <q-btn class="q-mt-sm q-mr-sm" color="negative" @click="notifyError_call_exception">Call exception</q-btn>
                <q-btn class="q-mt-sm q-mr-sm" color="negative" @click="notifyError_connection">Internet connection error</q-btn>
            </div>
        </div>
    </div>
    <hr>
</div>
</template>

<style lang="scss">
.c-notify-demos {

}
</style>
