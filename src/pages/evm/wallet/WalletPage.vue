<script lang="ts">
import { defineComponent } from 'vue';

import { EvmTokenInfo } from 'src/antelope/types';

import AppPage from 'components/evm/AppPage.vue';
import WalletPageHeader from 'pages/evm/wallet/WalletPageHeader.vue';
import WalletBalanceRow from 'pages/evm/wallet/WalletBalanceRow.vue';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { useChainStore } from 'src/antelope';

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
        chainTokens() {
            const tokens = [];

            const chainStore = useChainStore();
            const chainSettings = chainStore.currentChain.settings as EVMChainSettings;

            const chainHasStlos = !!chainSettings.getStlosContractAddress();
            const chainHasWtlos = !!chainSettings.getWtlosContractAddress();

            const {
                address,
                symbol,
                name,
                decimals,
                balance,
                fullBalance,
                logo,
            } = chainSettings.getSystemToken();

            const chainToken: EvmTokenInfo = {
                address,
                symbol,
                name,
                logoURI: logo,
                decimals,
                balance: balance ?? '0',
                fullBalance: fullBalance ?? '0',
            };

            tokens.push(chainToken);

            if (chainHasStlos) {
                // https://github.com/telosnetwork/telos-wallet/issues/179
                //     get stlos token info from store
                tokens.push({
                    address: '0xa9991e4daa44922d00a78b6d986cdf628d46c4dd',
                    symbol: 'STLOS',
                    name: 'Staked TLOS',
                    logoURI: 'https://raw.githubusercontent.com/telosnetwork/teloscan/master/public/stlos-logo.png',
                    decimals: 18,
                    balance: '3642.0243',
                    fullBalance: '3642.024318091460206147',
                });
            }

            if (chainHasWtlos) {
                // https://github.com/telosnetwork/telos-wallet/issues/179
                //     get wtlos token info from store
                tokens.push({
                    address: '0xaE85Bf723A9e74d6c663dd226996AC1b8d075AA9',
                    symbol: 'WTLOS',
                    name: 'Wrapped TLOS',
                    logoURI: 'https://raw.githubusercontent.com/telosnetwork/images/master/logos_2021/Symbol%202.svg',
                    decimals: 18,
                    balance: '6.1',
                    fullBalance: '6.1',
                });
            }

            return tokens;
        },
        nonChainTokens() {
            // https://github.com/telosnetwork/telos-wallet/issues/179
            //      get all user tokens here. filter out tlos and stlos if they appear in this list.
            const allNonChainTokens = [{
                address: '0x'.concat('0'.repeat(40)),
                symbol: 'SHTA',
                name: 'Shitcoin Alpha',
                logoURI: '',
                decimals: 18,
                balance: '350.0032',
                fullBalance: '350.0032',
            }, {
                address: '0x'.concat('0'.repeat(40)),
                symbol: 'SHTB',
                name: 'Shitcoin Beta',
                logoURI: '',
                decimals: 18,
                balance: '870123',
                fullBalance: '870123',
            }, {
                address: '0x'.concat('0'.repeat(40)),
                symbol: 'SHIB2',
                name: 'Shiba 2',
                logoURI: '',
                decimals: 18,
                balance: '10',
                fullBalance: '10',
            }, {
                address: '0x'.concat('0'.repeat(40)),
                symbol: 'SHIB',
                name: 'Shiba',
                logoURI: '',
                decimals: 18,
                balance: '555555786123.0032',
                fullBalance: '555555786123.003241232',
            }];

            const [tokensWithFiatValue, tokensWithoutFiatValue] =
                this.splitTokensBasedOnHasFiatValue(allNonChainTokens);

            return [...tokensWithFiatValue, ...tokensWithoutFiatValue];
        },
        allTokens() {
            return [
                ...this.chainTokens,
                ...this.nonChainTokens,
            ];
        },
    },
    methods: {
        // take all non-chain tokens and return a tuple of sorted arrays;
        // first is arrays with a fiat balance, second is those without
        splitTokensBasedOnHasFiatValue(tokens: EvmTokenInfo[]): [EvmTokenInfo[], EvmTokenInfo[]] {
            // https://github.com/telosnetwork/telos-wallet/issues/179
            //     replace tokenHasFiatValue and sortByFiatValue with real implementation which uses oracle
            let tokensWithFiatValue;
            let tokensWithNoFiatValue;

            const tokenHasFiatValue = (token: EvmTokenInfo) => ['SHTB', 'SHTA'].includes(token.symbol);

            const sortByFiatValue = (tokenOne: EvmTokenInfo, tokenTwo: EvmTokenInfo) => {
                if (tokenOne.symbol === 'SHTB') {
                    return 1;
                } else {
                    return -1;
                }
            };

            const sortByTokenBalance = (tokenOne: EvmTokenInfo, tokenTwo: EvmTokenInfo) => {
                if (+tokenOne.balance > +tokenTwo.balance) {
                    return -1;
                } else {
                    return 1;
                }
            };

            tokensWithFiatValue = tokens.filter(token => tokenHasFiatValue(token)).sort(sortByFiatValue);
            tokensWithNoFiatValue = tokens.filter(token => !tokenHasFiatValue(token)).sort(sortByTokenBalance);

            // always show all tokens with fiat values before all tokens without
            return [tokensWithFiatValue, tokensWithNoFiatValue];
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
                v-for="(token, index) in allTokens"
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
