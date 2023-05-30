<script lang="ts">
import { defineComponent } from 'vue';
/*
we need three columns for the three different types of notifications:
- In progress
    - Sending tokens
    - Staking tokens
    - Unstaking tokens
    - Revoking awollance
- Success
    - Transfer tokens success
    - Revoking awollance success
    - Copied to clipboard success
- Error:
    - Transaction Error
    - Internet connection error
*/
export default defineComponent({
    name: 'NotificationDemos',
    components: {
    },
    data: () => ({
    }),
    computed: {
    },
    methods: {
        // InProgress -----
        notifyInProgress_sending() {
            // TODO: implement
        },
        notifyInProgress_staking() {
            // TODO: implement
        },
        notifyInProgress_unstaking() {
            // TODO: implement
        },
        notifyInProgress_revoking() {
            // TODO: implement
        },
        // Success -----
        notifySuccess_transfer() {
            // TODO: implement
        },
        notifySuccess_revoking() {
            // TODO: implement
        },
        notifySuccess_copied() {
            // TODO: implement
        },
        // Error -----
        notifyError_transaction() {
            // TODO: implement
        },
        notifyError_connection() {
            // TODO: implement
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
                <q-btn class="q-mt-sm q-mr-sm" color="negative" @click="notifyError_transaction">Transaction Error</q-btn>
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
