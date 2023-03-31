<script lang="ts">
import { defineComponent } from 'vue';
import AppPage from 'components/evm/AppPage.vue';

export default defineComponent({
    name: 'WalletPage',
    components: {
        AppPage,
    },
    data: () => ({
        tabs: ['balance', 'transactions'],
    }),

});
</script>

<template>
<AppPage :tabs="tabs">
    <template v-slot:header>
        <div class="c-wallet-page__TEMPORARY">wallet page header stuff</div>
    </template>

    <template v-slot:balance>
        <p class="text-black">balance tab</p>
    </template>

    <template v-slot:transactions>
        <p class="text-black">txns tab</p>
    </template>
</AppPage>
</template>

<style lang="scss">
.c-wallet-page {
    // used to demonstrate header space - to be removed on page implementation
    &__TEMPORARY {
        height: 300px;
        width: 100%;
        text-align: center;
        color: black;
    }
}
</style>
