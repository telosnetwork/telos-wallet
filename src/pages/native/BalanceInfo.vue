<script>
import BigNumber from 'bignumber.js';
import { mapGetters, mapActions } from 'vuex';
import CoinInfo from '~/pages/native/balance/CoinInfo';
import CollectablesGallery from '~/pages/native/balance/CollectablesGallery';
import SendCoins from '~/pages/native/balance/SendCoins';
import SendAmount from '~/pages/native/balance/SendAmount';
import ReceiveCoins from '~/pages/native/balance/ReceiveCoins';
import BuyAmount from '~/pages/native/balance/BuyAmount';
import ShareAddress from '~/pages/native/balance/ShareAddress';
import QRScanner from '~/pages/native/balance/QRScanner';
import CoinHistory from '~/pages/native/balance/CoinHistory';
import DepositEVM from '~/pages/native/balance/DepositEVM';
import WithdrawEVM from '~/pages/native/balance/WithdrawEVM';
import RexStaking from '~/pages/native/balance/RexStaking';
import { copyToClipboard } from 'quasar';
import { getHyperion } from 'src/boot/api';
import { useChainStore } from 'src/antelope';


const GETTING_STARTED_URL = 'https://www.telos.net/buy';

export default {
    props: ['loadedCoins', 'loadedNftTokens', 'balanceTab'],
    components: {
        CoinInfo,
        CollectablesGallery,
        SendCoins,
        SendAmount,
        ReceiveCoins,
        BuyAmount,
        ShareAddress,
        QRScanner,
        CoinHistory,
        DepositEVM,
        WithdrawEVM,
        RexStaking,
    },
    data() {
        return {
            coins: [
                {
                    account: 'eosio.token',
                    name: 'Telos',
                    symbol: 'TLOS',
                    amount: 0,
                    price: 0.0,
                    precision: 4,
                    suggested: true,
                },
                {
                    account: 'eosio.token',
                    name: 'Telos EVM',
                    symbol: 'TLOS',
                    amount: 0,
                    price: 0.0,
                    precision: 4,
                    suggested: true,
                    network: 'tevm',
                },
            ],
            nftTokenItems: {},
            nftTokenTags: new Set(),
            nftScopes: [0, 0],
            displayAmount: 0,
            nftTagLoading: false,
            coinLoadedAll: false,
            nftTokenLoadedAll: false,
            panning: false,
            coinViewHeight: 0,
            tab: this.balanceTab,
            interval: null,
            tokenInterval: null,
            selectedCoin: null,
            showSendDlg: false,
            showSendAmountDlg: false,
            showReceiveDlg: false,
            showShareAddressDlg: false,
            showBuyAmountDlg: false,
            showQRScannerDlg: false,
            showHistoryDlg: false,
            showDepositEVMDlg: false,
            showWithdrawEVMDlg: false,
            showEVMWarning: false,
            showEVMBridgeWarning: true,
            showEVMBridgeWarningTitle: true,
            showEVMAddress: false,
            showRexStakeDlg: false,
            tEVMWithdrawing: false,
            avatar: '',
        };
    },
    computed: {
        ...mapGetters('account', ['isAuthenticated', 'accountName', 'evmAddress', 'evmBalance']),
        ...mapGetters('global', [
            'footerHeight',
            'minSpace',
            'maxSpace',
            'supportTokens',
            'suggestTokens',
            'pTokenNetworks',
        ]),
        totalAmount() {
            return this.coins
                .map(
                    coin =>
                        (coin?.totalAmount === undefined ? coin.amount : coin.totalAmount) * coin.price,
                )
                .reduce((a, b) => a + b, 0);
        },
        telosBalance() {
            return this.coins.find(coin => coin.symbol === 'TLOS' && coin.account === 'eosio.token').totalAmount;
        },
        availableHeight() {
            return (
                window.innerHeight - (this.isAuthenticated ? this.footerHeight : 0)
            );
        },
        coinViewMargin() {
            return (this.availableHeight - this.coinViewHeight - this.minSpace) * 0.1;
        },
        balanceTextSize() {
            return Math.min(35, (this.availableHeight - this.coinViewHeight) * 0.25);
        },
        accountNameStyle() {
            return {
                opacity: Math.max(0, (this.balanceTextSize - 15) * 0.05),
                height: Math.max(0, (this.balanceTextSize - 15) * 1),
            };
        },
        qrcodeOpacity() {
            return 1 - Math.max(0, (this.balanceTextSize - 15) * 0.1);
        },
        chainName() {
            return useChainStore().currentChain.settings.getNetwork();
        },
        nftAccounts() {
            return useChainStore().currentChain.settings.getNftAccounts();
        },
        shortenedEvmAddress() {
            const address = this.evmAddress;
            return `${address.slice(0, 12)}..${address.slice(-12)}`;
        },
    },
    methods: {
        ...mapActions('account', ['accountExists', 'getUserProfile', 'setEvmState']),
        ...mapActions('rex', ['getRexBalance']),
        ...mapActions('resources', ['getTotalResources']),

        copyStrToClipboard(str) {
            copyToClipboard(str).then(() => {
                this.$successNotification(this.$t('balance.copied_ok'));
            });
        },
        async loadUserProfile() {
            if (
                !this.$store.state.account.profiles.hasOwnProperty(this.accountName)
            ) {
                await this.getUserProfile(this.accountName);
            }
            const accountProfile = this.$store.state.account.profiles[this.accountName];
            if (!accountProfile) {
                return;
            }

            this.avatar = accountProfile.avatar;
        },
        async switchTab() {
            this.$emit('update:balanceTab', this.tab);
            if (
                this.isAuthenticated &&
                this.tab === 'collectables' &&
                this.nftTokenTags.size === 0
            ) {
                this.loadUserProfile();
                await this.loadNftTokenItems();
                this.loadNftTokenTags();
            }
        },
        clickPurchase() {
            this.selectedCoin = this.coins.find(coin => coin.symbol === 'TLOS');
            window.open(GETTING_STARTED_URL);
        },
        handlePan({ evt, ...info }) {
            this.coinViewHeight -= info.delta.y;
            if (info.isFirst) {
                this.panning = true;
            } else if (info.isFinal) {
                this.panning = false;
            }
        },
        async loadCoinList() {
            try {
                const coins = await this.$store.$api.getTableRows({
                    code: 'tokenmanager',
                    limit: '1000',
                    scope: 'tokenmanager',
                    table: 'tokens',
                });

                coins.rows.forEach((token) => {
                    const [precision, symbol] = token.token_symbol.split(',');
                    const account = token.contract_account;
                    if (account === 'eosio.token' && symbol === 'TLOS') {
                        return;
                    }

                    const name = token.token_name;
                    const icon = token.logo_sm;
                    const amount = 0;
                    const price = 0;

                    this.coins.push({
                        account,
                        name,
                        symbol,
                        amount,
                        price,
                        icon,
                        precision,
                    });
                });
            } catch (error) {
                console.error('Error loading coins:', error);
            }
        },
        async loadPrices() {
            const tlosUsdDataPoints = await this.$store.$api.getTableRows({
                code: 'delphioracle',
                limit: '1000',
                scope: 'tlosusd',
                table: 'datapoints',
            });

            const tlosPrice = tlosUsdDataPoints.rows[0].median / 10000;
            this.coins[0].price = tlosPrice;
            this.coins[1].price = tlosPrice;
        },
        async updateTelosCoin(coin) {
            const rpc = this.$store.$api.getRpc();
            console.assert(coin.account === 'eosio.token', coin);
            console.assert(coin.symbol === 'TLOS', coin);
            console.assert(coin.name === 'Telos', coin);
            rpc.get_currency_balance('eosio.token', this.accountName, 'TLOS').then((raw) => {
                try {
                    coin.amount = Number(raw[0].split(' ')[0]);
                    coin.totalAmount = coin.amount + coin.rexBalance + coin.resources;
                } catch (e) {
                    console.error('error: ', e);
                }
            });

            this.getRexBalance(this.accountName).then((value) => {
                coin.rexBalance = value || 0;
                coin.totalAmount = coin.amount + coin.rexBalance + coin.resources;
            });

            this.getTotalResources(this.accountName).then((value) => {
                coin.resources = value || 0;
                coin.totalAmount = coin.amount + coin.rexBalance + coin.resources;
            });
        },
        async loadUserTokens() {
            const hyperion = getHyperion();
            const userCoins = await hyperion.get(
                `/v2/state/get_tokens?account=${this.accountName}&limit=1000`,
            );
            if (userCoins.status === 200) {
                userCoins.data.tokens.forEach((token) => {
                    if (token.symbol === undefined) {
                        return;
                    }
                    if (token.precision === undefined) {
                        token.precision = 0;
                    }
                    this.coins.forEach(async (coin) => {
                        if (
                            !coin.network &&
                            coin.symbol.toLowerCase() === token.symbol.toLowerCase() &&
                            coin.account === token.contract
                        ) {

                            // This patch fixes #46 (because /v2/state/get_tokens currently does not return the TLOS balance)
                            if (coin.account === 'eosio.token' && coin.symbol === 'TLOS' && coin.name === 'Telos') {
                                coin.rexBalance = coin.rexBalance || 0;
                                coin.resources = coin.resources || 0;
                                coin.amount = coin.amount || 0;
                                coin.totalAmount = coin.totalAmount || 0;
                                this.updateTelosCoin(coin);
                            } else {
                                coin.amount = token.amount || 0;
                                coin.totalAmount = coin.amount || 0;
                            }
                            coin.precision = token.precision;
                        }
                    });
                    // if token not in coins, add it
                    if (
                        !this.coins.find(
                            coin =>
                                coin.symbol.toLowerCase() === token.symbol.toLowerCase() &&
                                coin.account === token.contract,
                        )
                    ) {
                        this.coins.push({
                            account: token.contract,
                            name: `${token.symbol} (${token.contract})`,
                            symbol: token.symbol,
                            amount: token.amount || 0,
                            price: 0,
                            precision: token.precision || 4,
                            icon: `${token.contract}-${token.symbol}`,
                        });
                    }
                    this.coins.forEach((coin) => {
                        if (coin.symbol === 'TLOS' && coin.account === 'eosio.token') {
                            coin.icon = '/coins/TLOS.png';
                        }
                    });
                });
            }

            this.coins.forEach(async (coin) => {
                if (coin.network === 'tevm') {
                    coin.amount = this.evmBalance;
                }
            });

            const sortCoin = function (suggestTokens) {
                return function (a, b) {
                    const aSymbol = a.symbol.toLowerCase();
                    const bSymbol = b.symbol.toLowerCase();
                    const aContract = a.account.toLowerCase();
                    const bContract = b.account.toLowerCase();

                    // eosio.token
                    if (aContract === bContract && aContract === 'eosio.token') {
                        // if evm
                        if (a.network) {
                            return 1;
                        } else {
                            return -1;
                        }
                    }

                    if (aSymbol === 'tlos' && a.account === 'eosio.token') {
                        return -1;
                    } else if (bSymbol === 'tlos' && b.account === 'eosio.token') {
                        return 1;
                    }

                    if (
                        !suggestTokens.map(t => t.sym).includes(aSymbol) ||
                        !suggestTokens.map(t => t.sym).includes(bSymbol)
                    ) {
                        if (
                            suggestTokens.map(t => t.sym).includes(aSymbol) &&
                            suggestTokens.map(t => t.contract).includes(aContract)
                        ) {
                            return -1;
                        }
                        if (
                            suggestTokens.map(t => t.sym).includes(bSymbol) &&
                            suggestTokens.map(t => t.contract).includes(bContract)
                        ) {
                            return 1;
                        }
                    }
                    let aAmount = a.amount * a.price + (a.amount > 0 ? 1 : 0);
                    let bAmount = b.amount * b.price + (b.amount > 0 ? 1 : 0);
                    return bAmount - aAmount;
                };
            };
            this.coins = this.coins.sort(sortCoin(this.suggestTokens));
            this.$emit('update:loadedCoins', this.coins);
        },
        async loadNftTokenItems() {
            for (const account of this.nftAccounts) {
                await this.loadNftTokenItemssPerAccount(account);
            }
        },
        async loadNftTokenItemssPerAccount(nftAccount) {
            let more = true;
            let next_key = 10000;
            while (more === true) {
                let lower_bound = BigNumber(this.$nameToUint64(this.accountName)).times(
                    '1e16',
                );
                let upper_bound = lower_bound.plus(next_key);
                const tagData = await this.$store.$api.getTableRows({
                    code: nftAccount,
                    index_position: 3,
                    json: true,
                    key_type: 'i128',
                    limit: '10000',
                    reverse: false,
                    scope: nftAccount,
                    show_payer: false,
                    table: 'items',
                    table_key: '',
                    lower_bound: lower_bound.toFixed(),
                    upper_bound: upper_bound.toFixed(),
                });
                if (tagData.more === false) {
                    more = false;
                } else {
                    next_key = tagData.next_key;
                }

                if (this.nftTokenItems[nftAccount]) {
                    let moreNFTs = tagData.rows.filter(
                        row => row.owner === this.accountName,
                    );
                    this.nftTokenItems[nftAccount] = this.nftTokenItems[nftAccount].concat(moreNFTs);
                } else {
                    this.nftTokenItems[nftAccount] = tagData.rows.filter(
                        row => row.owner === this.accountName,
                    );
                }
            }
        },
        async loadNftTokenTags() {
            for (const account of this.nftAccounts) {
                if (this.nftTokenItems[account]) {
                    await this.loadNftTokenTagsPerAccount(account);
                }
            }
        },
        async loadNftTokenTagsPerAccount(nftAccount) {
            if (this.nftTagLoading) {
                return;
            }
            this.nftTagLoading = true;
            const index = this.nftAccounts.findIndex(
                account => account === nftAccount,
            );
            let foundFirstData = false;
            let count = 10;

            while (count > 0) {
                if (this.nftScopes[index] >= this.nftTokenItems[nftAccount].length) {
                    break;
                }
                const tagData = await this.$store.$api.getTableRows({
                    code: nftAccount,
                    index_position: 1,
                    json: true,
                    key_type: '',
                    limit: 9999,
                    lower_bound: null,
                    reverse: false,
                    scope: `${
                        this.nftTokenItems[nftAccount][this.nftScopes[index]].serial
                    }`,
                    show_payer: false,
                    table: 'tags',
                    table_key: '',
                    upper_bound: null,
                });
                if (tagData.rows.length === 0) {
                    if (foundFirstData) {
                        break;
                    }
                    this.nftScopes[index] += 1;
                } else {
                    if (nftAccount === 'tlos.tbond') {
                        if (
                            tagData.rows.find(row => row.tag_name === 'title') !== undefined &&
                            tagData.rows.find(row => row.tag_name === 'image') !== undefined
                        ) {
                            const title = tagData.rows.find(
                                row => row.tag_name === 'title',
                            ).content;
                            const image = tagData.rows.find(
                                row => row.tag_name === 'image',
                            ).content;
                            this.nftTokenTags.add({
                                title: title,
                                image: image,
                            });
                        }
                    } else if (nftAccount === 'marble.code') {
                        if (
                            tagData.rows.find(row => row.tag_name === 'data') !== undefined
                        ) {
                            const data = JSON.parse(
                                tagData.rows.find(row => row.tag_name === 'data').content,
                            );
                            this.nftTokenTags.add({
                                title: data.ti,
                                image: data.dt,
                            });
                        } else if (
                            tagData.rows.find(row => row.tag_name === 'json.hash') !== undefined
                        ) {
                            // Get dstor data
                            let hash = tagData.rows.find(
                                row => row.tag_name === 'json.hash',
                            ).content;
                            let response = await fetch(
                                `https://api.dStor.cloud/ipfs/${hash}`,
                            );
                            const data = await response.json();
                            this.nftTokenTags.add({
                                title: data.ti,
                                image: data.dt,
                            });
                        }
                    } else if (nftAccount === 'marbletessst') {
                        if (
                            tagData.rows.find(row => row.tag_name === 'data') !== undefined
                        ) {
                            const data = JSON.parse(
                                tagData.rows.find(row => row.tag_name === 'data').content,
                            );
                            this.nftTokenTags.add({
                                title: data.ti,
                                image: data.dt,
                            });
                        }
                    }
                    this.$emit('update:loadedNftTokens', this.nftTokenTags);
                    foundFirstData = true;
                    this.nftScopes[index] += 1;
                    count -= 1;
                }
            }
            this.nftTagLoading = false;
        },
        getCurrenttEVMBalance() {
            if (this.evmBalance) {
                const balanceStr = this.evmBalance.toString();
                return parseFloat(BigNumber(balanceStr).div(1e18).toFixed(4)) || 0;
            }
            return 0;
        },
        async withdrawEVM() {
            const quantityStr = `${this.getFixed(
                this.getCurrenttEVMBalance(),
                4,
            ).replace(',', '')} ${'TLOS'}`;
            let actions = [];
            actions.push({
                account: process.env.EVM_CONTRACT,
                name: 'withdraw',
                data: {
                    to: this.accountName.toLowerCase(),
                    quantity: quantityStr,
                },
            });

            try {
                const transaction = await this.$store.$api.signTransaction(
                    actions,
                    `Withdraw ${quantityStr} from ${this.evmAddress}`,
                );
                this.$successNotification(this.$t('components.withdrew_from_evm', {
                    quantity: quantityStr,
                    address: this.evmAddress,
                }));
            } catch (error) {
                this.$errorNotification(error);
            }
            this.updateBalances();
            this.tEVMWithdrawing = false;
        },
        async updateBalances() {
            if (!this.isAuthenticated) {
                return;
            }
            this.loadUserTokens();
            this.loadUserProfile();
            this.setEvmState();
            await this.loadNftTokenItems();
            this.loadNftTokenTags();
        },
        setShowEVMBridgeWarning(value) {
            this.showEVMBridgeWarning = value;
            this.showEVMBridgeWarningTitle = value;
            localStorage.setItem('showEVMBridgeWarning', value);
        },
    },
    created: async function () {
        this.interval = setInterval(() => {
            if (!this.panning) {
                const approxViewHeight = Math.min(
                    this.availableHeight - this.minSpace,
                    Math.max(this.availableHeight - this.maxSpace, this.coinViewHeight),
                );
            }
            this.displayAmount = this.totalAmount - (this.totalAmount - this.displayAmount) * 0.98;
            if (window.time && Date.now() / 1000 - window.time > 10 * 60) {
                location.reload();
            }
        }, 5);

        if (this.loadedCoins.length > 0) {
            this.coins = this.loadedCoins;
            this.coinLoadedAll = true;
        } else {
            this.coins.length = 2;
            await this.loadCoinList();
            await this.loadPrices();

            if (this.isAuthenticated) {
                this.loadUserTokens();
            }
        }

        this.coinLoadedAll = true;
        this.tokenInterval = setInterval(async () => {
            this.updateBalances();
            window.time = Date.now() / 1000;
        }, 5000);


        this.showEVMBridgeWarningTitle = this.$q.screen.lt.md;
    },
    beforeMount() {
        this.coinViewHeight = window.innerHeight - this.footerHeight - this.maxSpace;
    },
    async mounted() {
        const showEVMBridgeWarning = localStorage.getItem('showEVMBridgeWarning');
        if (showEVMBridgeWarning === 'false') {
            this.showEVMBridgeWarning = false;
            this.showEVMBridgeWarningTitle = false;
        }
        this.loadUserProfile();
        this.$emitter.on('successfully_sent', (sendAmount, toAddress) => {
            this.showSendAmountDlg = false;
            this.showSendDlg = false;
        });
        this.$emitter.on(
            'qrcode_scanned',
            ({ accountName, coinName, networkType }) => {
                if (!this.selectedCoin) {
                    this.$root.qrcode_accountName = accountName;
                    this.$root.qrcode_networkType = networkType;
                    this.selectedCoin = this.coins.find(coin => coin.name === coinName);
                    this.showSendAmountDlg = true;
                }
            },
        );
        this.$emitter.on('show_qrscanner', () => {
            this.showQRScannerDlg = true;
        });
        if (this.isAuthenticated) {
            this.loadUserProfile();
            await this.loadNftTokenItems();
            this.loadNftTokenTags();
        }
    },
    beforeUnmount() {
        if (this.interval) {
            clearInterval(this.interval);
        }
        if (this.tokenInterval) {
            clearInterval(this.tokenInterval);
        }
        this.coins = [];
    },
    watch: {
        async accountName() {
            if (this.isAuthenticated) {
                this.updateBalances();
            }
        },
        balanceTab(val){
            this.tab = val;
        },
    },
};
</script>

<template>
<div class="row justify-center">
    <div class="balance-info-page-container">
        <div>
            <div class="text-center">
                <!-- Account Name -->
                <div
                    class="text-white q-mt-xl"
                    :style="`opacity: ${accountNameStyle.opacity};`"
                >
                    {{ accountName }}
                </div>

                <!-- Account Amount -->
                <div class="full-width items-center balance-div row">
                    <div class="full-width"></div>
                    <div class="full-width balance-text">
                        <label
                            class="text-white items-center"
                            :style="`font-size: ${balanceTextSize}px; font-weight: 200; font-size: 50px; white-space: nowrap;`"
                        >
                            $ {{ getFixed(displayAmount, 0) }}.{{
                                displayAmount.toFixed(2).slice(-2)
                            }}
                        </label>
                        <div>
                            <q-icon name="o_info" size="sm" />
                            <q-tooltip>{{ $t('balance.balance_fiat_tooltip') }}</q-tooltip>
                        </div>
                    </div>
                    <div v-if="typeof telosBalance === 'number'"  class="full-width">
                        {{ getFixed(telosBalance, 4) }} TLOS
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="row q-mt-lg q-mb-md">
                    <q-btn
                        class="col balanceBtn purpleGradient text-subtitle2 flex-center"
                        flat
                        rounded
                        no-caps
                        :label="$t('components.send')"
                        @click="showSendDlg = true"
                    />
                    <div class="qrBtn q-mx-xs" @click="showQRScannerDlg = true">
                        <img src="~assets/icons/qr_scan.svg" >
                    </div>
                    <q-btn
                        class="col balanceBtn purpleGradient text-subtitle2 flex-center"
                        flat
                        rounded
                        no-caps
                        :label="$t('components.receive')"
                        @click="showReceiveDlg = true"
                    />
                </div>

                <!-- Convert and Purchace -->
                <div class="row justify-between q-mb-md">
                    <div class="purchaceBtn" @click="clickPurchase()">
                        {{$t('balance.purchase')}}
                        <img src="~assets/coin/Purchase.svg" class="q-ml-xs" >
                    </div>
                </div>
            </div>

            <div v-if="showEVMBridgeWarning" class="q-pa-sm">
                <q-banner
                    rounded
                    :inline-actions="!$q.screen.lt.md || showEVMBridgeWarningTitle"
                    class="bg-purple-8 text-white"
                    @click="showEVMBridgeWarningTitle = false"
                >

                    <template v-slot:avatar>
                        <q-icon
                            name="info"
                            color="white"
                            size="sm"
                            class="avatar-icon"
                        />
                    </template>
                    <span
                        v-if="showEVMBridgeWarningTitle"
                        class="text-h6"
                    >
                        Bridging your TLOS
                    </span>
                    <span v-else class="text-subtitle1">
                        To transfer your TLOS tokens across blockchains, first send them to the Telos EVM network
                        <span class="to_evm">(click on >>> EVM),</span> then connect to
                        <a
                            href="https://bridge.telos.net/bridge"
                            target="_blank"
                            class="text-white"
                        >bridge.telos.net</a>
                        to complete your transfer.
                    </span>

                    <template v-slot:action>
                        <q-btn
                            flat
                            round
                            icon="close"
                            @click="setShowEVMBridgeWarning(false)"
                        />
                    </template>
                </q-banner>
            </div>

            <q-tabs
                v-model="tab"
                :value="balanceTab"
                content-class="balance-tabs--content"
                class="shadow-2 no-shadow balance-tabs"
                @click="switchTab"
            >
                <q-tab
                    key="coins"
                    no-caps
                    name="coins"
                    label="Coins"
                    class="coin-tab"
                />
                <q-tab
                    key="coins"
                    no-caps
                    name="collectables"
                    label="Collectables"
                    class="coin-tab"
                />
            </q-tabs>
            <q-tab-panels
                v-model="tab"
                flat
                class="balance-tabs--panels"
            >
                <q-tab-panel
                    flat
                    name="coins"
                    label="Coins"
                    class="no-padding balance-tabs--coins-panel"
                >
                    <CoinInfo
                        v-model:showHistoryDlg="showHistoryDlg"
                        v-model:showDepositEVMDlg="showDepositEVMDlg"
                        v-model:showWithdrawEVMDlg="showWithdrawEVMDlg"
                        v-model:showBuyAmountDlg="showBuyAmountDlg"
                        v-model:selectedCoin="selectedCoin"
                        flat
                        :coins="coins"
                        :coinLoadedAll="coinLoadedAll"
                        :suggestTokens="suggestTokens"
                    />
                </q-tab-panel>
                <q-tab-panel name="collectables" label="Collectibles" :style="'background:  #00000000'">
                    <CollectablesGallery
                        :nftTokenTags="nftTokenTags"
                        :nftTokenLoadedAll="nftTokenLoadedAll"
                        :coinViewHeight="coinViewHeight"
                        :loadNftTokenTags="loadNftTokenTags"
                    />
                </q-tab-panel>
            </q-tab-panels>
        </div>
        <div
            class="q-pr-none text-white absolute full-width"
            :style="`bottom: ${footerHeight}px;`"
        ></div>
        <div
            v-if="tEVMWithdrawing"
            class="justify-center absolute flex full-width full-height spinner"
        >
            <q-spinner-dots class="q-my-auto" color="primary" size="40px" />
        </div>
    </div>
    <CoinHistory
        v-model:showHistoryDlg="showHistoryDlg"
        v-model:selectedCoin="selectedCoin"
        v-model:showSendAmountDlg="showSendAmountDlg"
        v-model:showShareAddressDlg="showShareAddressDlg"
        v-model:showBuyAmountDlg="showBuyAmountDlg"
        v-model:showRexStakeDlg="showRexStakeDlg"
    />
    <SendCoins
        v-model:showSendDlg="showSendDlg"
        v-model:selectedCoin="selectedCoin"
        v-model:showSendAmountDlg="showSendAmountDlg"
        :coins="coins"
    />
    <DepositEVM
        v-model:showDepositEVMDlg="showDepositEVMDlg"
        v-model:nativeTLOSBalance="coins[0].amount"
        @updateBalances="updateBalances"
    />
    <WithdrawEVM
        v-model:showWithdrawEVMDlg="showWithdrawEVMDlg"
        v-model:evmTLOSBalance="coins[1].amount"
        @updateBalances="updateBalances"
    />
    <ReceiveCoins
        v-model:showReceiveDlg="showReceiveDlg"
        v-model:selectedCoin="selectedCoin"
        v-model:showShareAddressDlg="showShareAddressDlg"
        :coins="coins"
    />
    <SendAmount
        v-model:showSendAmountDlg="showSendAmountDlg"
        v-model:selectedCoin="selectedCoin"
        :showHistoryDlg="showHistoryDlg"
    />
    <BuyAmount
        v-model:showBuyAmountDlg="showBuyAmountDlg"
        v-model:selectedCoin="selectedCoin"
        :showHistoryDlg="showHistoryDlg"
    />
    <ShareAddress
        v-model:showShareAddressDlg="showShareAddressDlg"
        :selectedCoin="selectedCoin"
    />
    <QRScanner v-model:showQRScannerDlg="showQRScannerDlg" :coins="coins" />
    <RexStaking
        v-if="selectedCoin"
        v-model:selectedCoin="selectedCoin"
        v-model:showRexStakeDlg="showRexStakeDlg"
    />

    <q-dialog v-model="showEVMWarning">
        <q-card class="popupCard">
            <q-card-section>
                <div class="text-h6">{{$t('balance.warning')}}</div>
            </q-card-section>

            <q-card-section class="q-pt-none">
                {{$t('balance.warning_msg')}}
            </q-card-section>

            <q-card-actions align="right">
                <q-btn
                    v-close-popup
                    flat
                    no-caps
                    :label="$t('balance.i_understand')"
                    color="white"
                    class="purpleGradient"
                    @click="showEVMAddress = true"
                />
            </q-card-actions>
        </q-card>
    </q-dialog>
</div>
</template>

<style lang="scss">
.avatar-icon {
    margin-top: 10px;
}
.to_evm {
    font-weight: bold;
    white-space: nowrap;
}
.balance-info-page-container {
    width: 600px;
}

.balance-tabs {
    width: 100%;
}

.coin-tab {
    width: 50%;
    background: #00000000
}

.spinner {
    background: rgba(0, 0, 0, 0.4)
}

.balance-tabs--content {
  .q-tab__indicator {
    background: linear-gradient(45deg, $positive, $primary);
    padding: 0.1rem;
  }
  .q-tab:first-child {
    border-top-left-radius: 2.5rem;
  }
  .q-tab:last-child {
    border-top-right-radius: 2.5rem;
  }

  border-top-left-radius: 2.5rem !important;
  border-top-right-radius: 2.5rem !important;
  background: rgba($white, 0.08);
}
.balance-tabs--panels {
  background: rgba($white, 0.08);
}

@media only screen and (min-width: 1000px) {
  .balance-tabs--content {
    border-radius: initial;
    background: #00000000;
  }
  .balance-tabs--panels {
    background: none;
  }
}

.balance-tabs--panels > .q-panel {
  overflow: hidden;
}
.balance-tabs--coins-panel {
  border: 0px;
  overflow: auto;
  max-height: calc(100vh - 120px);
}

@media only screen and (min-width: 1000px) {
  .balance-tabs--coins-panel {
    max-height: calc(100vh - 50px);
  }
}
/* total width */
.balance-tabs--coins-panel::-webkit-scrollbar {
  background-color: transparent;
  width: 8px;
}

/* background of the scrollbar except button or resizer */
.balance-tabs--coins-panel::-webkit-scrollbar-track {
  background-color: rgba(0,0,0,0.2);
}

/* scrollbar itself */
.balance-tabs--coins-panel::-webkit-scrollbar-thumb {
  background-color: rgba($primary, .3);
  border-radius: 16px;
  border: 4px solid rgba(255,255,255,0.3);
}

/* set button(top and bottom of the scrollbar) */
.balance-tabs--coins-panel::-webkit-scrollbar-button {
  display:none;
}

// --------------
.balance-div {
  background-color: #00000000;
  display: inline-flex;
  justify-content: space-between;
}

.balance-text {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
}

.balanceBtn {
  margin-right: 0.5vw;
  margin-left: 0.5vw;
  width: 8rem;
  height: 3rem;
}

.convertBtn,
.purchaceBtn {
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  img {
    border-radius: 20px;
  }
  &:hover {
    text-shadow: 0 0 5px $white;
    img {
      box-shadow: 0 0 5px $white;
    }
  }
}
.convertBtn {
  margin-right: 3rem;
}

</style>
