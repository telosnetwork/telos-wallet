<script lang="ts">
import { defineComponent } from 'vue';

import { EvmTokenInfo } from 'src/antelope/types';

import AppPage from 'components/evm/AppPage.vue';
import WalletPageHeader from 'pages/evm/wallet/WalletPageHeader.vue';
import WalletBalanceRow from 'pages/evm/wallet/WalletBalanceRow.vue';

export default defineComponent({
    name: 'WalletPage',
    components: {
        AppPage,
        WalletBalanceRow,
        WalletPageHeader,
    },
    data: () => ({
        tabs: ['balance', 'transactions'],
    }),
    computed: {
        tokens(): EvmTokenInfo[] {
            return [{
                'chainId': 41,
                'address': '0xaE85Bf723A9e74d6c663dd226996AC1b8d075AA9',
                'symbol': 'WTLOS',
                'name': 'Wrapped TLOS',
                'logoURI': 'https://raw.githubusercontent.com/telosnetwork/images/master/logos_2021/Symbol%202.svg',
                'decimals': 18,
                'tags': [],
                'balance': '6.1',
                'fullBalance': '6.1',
            }, {
                'chainId': 41,
                'address': '0xa9991e4daa44922d00a78b6d986cdf628d46c4dd',
                'symbol': 'STLOS',
                'name': 'Staked TLOS',
                'logoURI': 'https://raw.githubusercontent.com/telosnetwork/teloscan/master/public/stlos-logo.png',
                'decimals': 18,
                'tags': [],
                'balance': '3642.0243',
                'fullBalance': '3642.024318091460206147',
            }, {
                'chainId': 41,
                'address': '0xa9991e4daa44922d00a78b6d986cdf628d46c4dd',
                'symbol': 'SHIB',
                'name': 'Shiba',
                'logoURI': '',
                'decimals': 18,
                'tags': [],
                'balance': '555555786123.0032',
                'fullBalance': '555555786123.003241232',
            }];
        },
    },
});
</script>

<template>
<AppPage :tabs="tabs">
    <template v-slot:header>
        <WalletPageHeader/>
    </template>

    <template v-slot:balance>
        <div class="test">
            <WalletBalanceRow
                v-for="(token, index) in tokens"
                :key="`token-${index}`"
                :token="token"
                class="q-mb-xs"
            />
        </div>
    </template>

    <template v-slot:transactions>
        <p>txns tab</p>
    </template>
</AppPage>
</template>

<style lang="scss">
.test {
    max-width: 1000px;
    margin: auto;
}

.c-wallet-page {

}
</style>
