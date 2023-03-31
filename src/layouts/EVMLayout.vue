<script lang="ts">
import { defineComponent } from 'vue';
import { getAntelope } from 'src/antelope';

const accountStore = getAntelope().stores.account;

export default defineComponent({
    name: 'EVMLayout',
    components: {},
    computed: {
        yourAddress() {
            return accountStore.loggedAccount.account;
        },
    },
    methods: {
        logout() {
            accountStore.logout();
        },
    },
});
</script>

<template>
<q-layout view="hHh lpr fff" class="c-evm-layout">
    <q-page-container>
        <q-page class="q-pa-md flec flex-center column">
            <div class="row flex-center">
                <div class="col-12 col-sm-10 col-md-8 col-lg-6 c-authenticated-message text-center">
                    <p>You are authenticated with the address: {{ yourAddress }}</p>
                    <p>Welcome! This site is under construction.</p>
                    <br>
                    <br>
                    <q-btn label="Logout" color="primary" @click="logout()" />
                </div>
            </div>
        </q-page>
    </q-page-container>
</q-layout>
</template>

<style>
.c-evm-layout {
    position: relative;
    background: linear-gradient(0.4turn, #071033, #6039A4);
    height: 100vh;
    color: white;
}
</style>
