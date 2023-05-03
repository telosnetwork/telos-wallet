<script lang="ts">
import { defineComponent } from 'vue';

import { EvmToken } from 'src/antelope/types';

import AppPage from 'components/evm/AppPage.vue';
import WalletPageHeader from 'pages/evm/wallet/WalletPageHeader.vue';
import WalletBalanceRow from 'pages/evm/wallet/WalletBalanceRow.vue';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { useChainStore } from 'src/antelope';
import WalletTransactionsTab from 'pages/evm/wallet/WalletTransactionsTab.vue';
import { ethers } from 'ethers';

export default defineComponent({
    name: 'WalletPage',
    components: {
        WalletTransactionsTab,
        AppPage,
        WalletBalanceRow,
        WalletPageHeader,
    },
    data: () => ({
        tabs: ['balance', 'transactions'],
    }),
    computed: {
        chainTokens(): EvmToken[] {
            const tokens:EvmToken[] = [];

            const chainStore = useChainStore();
            const chainSettings = chainStore.currentChain.settings as EVMChainSettings;

            const chainHasStlos = !!chainSettings.getStlosContractAddress();
            const chainHasWtlos = !!chainSettings.getWtlosContractAddress();

            const {
                symbol,
                name,
                decimals,
                balance,
                fullBalance,
                logo,
            } = chainSettings.getSystemToken();

            const defaults = {
                chainId: +chainSettings.getChainId(),
                isNative: false,
                isSystem: false,
                price: 0,
                fiatBalance: '',
                balanceBn: ethers.BigNumber.from(0),
            };

            const chainToken: EvmToken = {
                ...defaults,
                tokenId: `${symbol}-system-${chainSettings.getChainId()}`,
                isSystem: true,
                address: '',
                symbol,
                name,
                logoURI: logo,
                decimals,
                balance: balance ?? '',
                fullBalance: fullBalance ?? '',
            };

            // system token is always the first in this.allTokens; this is used in the template
            // ( <WalletBalanceRow ... :token-is-tlos="index === 0"> ) to indicate to the Row component
            // that the token is the system token, as the system token has no address to
            // use in comparisons in the Row component. We don't want to rely on the lack of an address
            // in case some malformed data comes in, which would make it ambiguous which one is the system token
            // This information is used in the row component to determine what links to show in the overflow menu
            tokens.push(chainToken);

            if (chainHasStlos) {
                // https://github.com/telosnetwork/telos-wallet/issues/179
                //     get stlos token info from store
                tokens.push({
                    ...defaults,
                    tokenId: `STLOS-0xB4B01216a5Bc8F1C8A33CD990A1239030E60C905-${chainSettings.getChainId()}`,
                    address: '0xB4B01216a5Bc8F1C8A33CD990A1239030E60C905',
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
                    ...defaults,
                    tokenId: `WTLOS-0xD102cE6A4dB07D247fcc28F366A623Df0938CA9E-${chainSettings.getChainId()}`,
                    address: '0xD102cE6A4dB07D247fcc28F366A623Df0938CA9E',
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
        nonChainTokens(): EvmToken[] {
            // https://github.com/telosnetwork/telos-wallet/issues/179
            //      get all user tokens here. filter out wlos and stlos if they appear in this list.
            const chainStore = useChainStore();
            const chainSettings = chainStore.currentChain.settings as EVMChainSettings;
            const defaults = {
                chainId: +chainStore.currentChain.settings.getChainId(),
                isNative: false,
                isSystem: false,
                price: 0,
                fiatBalance: '',
                balanceBn: ethers.BigNumber.from(0),
            };

            return [{
                ...defaults,
                address: '0x'.concat('0'.repeat(40)),
                symbol: 'SHTA',
                tokenId: `SHTA-${'0x'.concat('0'.repeat(40))}-${chainSettings.getChainId()}`,
                name: 'Shitcoin Alpha',
                logoURI: '',
                decimals: 18,
                balance: '350.0032',
                fullBalance: '350.0032',
            }, {
                ...defaults,
                address: '0x'.concat('0'.repeat(40)),
                symbol: 'SHTB',
                tokenId: `SHTB-${'0x'.concat('0'.repeat(40))}-${chainSettings.getChainId()}`,
                name: 'Shitcoin Beta',
                logoURI: '',
                decimals: 18,
                balance: '870123.0000',
                fullBalance: '870123.0000',
            }, {
                ...defaults,
                address: '0x'.concat('0'.repeat(40)),
                symbol: 'SHIB2',
                tokenId: `SHIB2-${'0x'.concat('0'.repeat(40))}-${chainSettings.getChainId()}`,
                name: 'Shiba 2',
                logoURI: '',
                decimals: 18,
                balance: '10',
                fullBalance: '10',
            }, {
                ...defaults,
                address: '0x'.concat('0'.repeat(40)),
                symbol: 'SHIB',
                tokenId: `SHIB-${'0x'.concat('0'.repeat(40))}-${chainSettings.getChainId()}`,
                name: 'Shiba',
                logoURI: '',
                decimals: 18,
                balance: '555555786123.0032',
                fullBalance: '555555786123.003241232',
            }].filter(token => !!token.address); // the only token with no address is TLOS
        },
        allTokens() {
            const allTokens = [
                ...this.chainTokens,
                ...this.nonChainTokens,
            ];

            const [tokensWithFiatValue, tokensWithoutFiatValue] = this.splitTokensBasedOnHasFiatValue(allTokens);

            return [
                ...tokensWithFiatValue,
                ...tokensWithoutFiatValue,
            ];
        },
    },
    methods: {
        // take all non-chain tokens and return a tuple of sorted arrays;
        // first is arrays with a fiat balance, second is those without
        // the first array is sorted based on fiat value, the second is sorted based on token balance
        splitTokensBasedOnHasFiatValue(tokens: EvmToken[]): [EvmToken[], EvmToken[]] {
            // https://github.com/telosnetwork/telos-wallet/issues/179
            //     replace tokenHasFiatValue and sortByFiatValue with real implementation which uses oracle
            let tokensWithFiatValue;
            let tokensWithNoFiatValue;

            const tokenHasFiatValue = (token: EvmToken) => ['SHTB', 'SHTA'].includes(token.symbol);

            const sortByFiatValue = (tokenOne: EvmToken, tokenTwo: EvmToken) => {
                if (tokenOne.symbol === 'SHTB') {
                    return 1;
                } else {
                    return -1;
                }
            };

            const sortByTokenBalance = (tokenOne: EvmToken, tokenTwo: EvmToken) => {
                const balanceOne = +(tokenOne?.balance ?? 0);
                const balanceTwo = +(tokenTwo?.balance ?? 0);

                if (balanceOne > balanceTwo) {
                    return -1;
                } else {
                    return 1;
                }
            };

            tokensWithFiatValue   = tokens.filter(token => tokenHasFiatValue(token)).sort(sortByFiatValue);
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
        <WalletTransactionsTab />
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
