<script lang="ts">
import { defineComponent } from 'vue';
import AppPage from 'components/evm/AppPage.vue';
import UserInfo from 'components/evm/UserInfo.vue';
import { getAntelope, useAccountStore, useChainStore, useUserStore } from 'src/antelope';
import { EvmToken, Token, TransactionResponse } from 'src/antelope/types';
import { formatWei, prettyPrintBalance, prettyPrintFiatBalance } from 'src/antelope/stores/utils';
import { useAppNavStore } from 'src/stores';
import { divideFloat, multiplyFloat } from 'src/antelope/stores/utils';
import { ethers } from 'ethers';
import { getNetwork } from '@wagmi/core';
import { Notify } from 'quasar';
import { checkNetwork } from 'src/antelope/stores/utils/checkNetwork';
import { TokenBalance, TokenClass } from 'src/antelope/chains/Token';

const GAS_LIMIT_FOR_SYSTEM_TOKEN_TRANSFER = 26250;
const GAS_LIMIT_FOR_ERC20_TOKEN_TRANSFER = 55500;

const ant = getAntelope();
const userStore = useUserStore();
const accountStore = useAccountStore();
const chainStore = useChainStore();
const global = useAppNavStore();

export default defineComponent({
    name: 'SendPage',
    components: {
        AppPage,
        UserInfo,
    },
    data: () => ({
        address: '',
        selected: null as TokenBalance | null,
        amount: '',
        useFiat: false,
        userStore,
        estimatedGas: { system: ethers.BigNumber.from(0), fiat: ethers.BigNumber.from(0) },
        prettyPrintBalance,
        tempCurrentBalance: '',
    }),
    mounted() {
        global.setShowBackBtn(true);
    },
    watch: {
        balances: {
            handler() {
                let tokenBalance = this.selected;
                this.selected = null;
                if (this.balances.length > 0) {
                    // if there's a url parameter token with the token address, use that token
                    const tokenAddress = this.$route.query.token;
                    if (tokenAddress) {
                        tokenBalance = this.balances.find(b => b.token.address === tokenAddress) ?? tokenBalance;

                        // hide the token address from the url
                        this.$router.replace({ name: 'evm-send', params: { token: undefined } });
                    }

                    if (!tokenBalance) {
                        tokenBalance = this.balances[0];
                    }
                }
                this.selected = tokenBalance;
            },
            immediate: true,
        },
        selected: {
            handler() {
                this.useFiat = false;
                this.updateEstimatedGas();
            },
            immediate: true,
        },
    },
    computed: {
        token(): TokenClass | undefined {
            return this.selected?.token as TokenClass ?? undefined;
        },
        loggedAccount() {
            return accountStore.loggedEvmAccount;
        },
        gasFeeInSystemSym() {
            const symbol = chainStore.loggedChain.settings.getSystemToken().symbol;
            const gas = `${formatWei(this.estimatedGas.system, 18, 18)}`;
            return prettyPrintBalance(gas, userStore.fiatLocale, this.isMobile, symbol);
        },
        gasFeeInFiat() {
            const gasFiat = `${formatWei(this.estimatedGas.fiat, 18, 18)}`;
            return prettyPrintFiatBalance(gasFiat, userStore.fiatLocale, this.isMobile, userStore.fiatCurrency);
        },
        getSystemToken(): TokenClass {
            return this.balances[0].token;
        },
        isMobile(): boolean {
            return this.$q.screen.lt.sm;
        },
        balances(): TokenBalance[] {
            return ant.stores.balances.getBalances('logged') as TokenBalance[];
        },
        showContractLink(): boolean {
            return !!this.token?.address;
        },
        availableInTokensBn(): ethers.BigNumber {
            const zero = ethers.BigNumber.from(0);
            if (!this.selected) {
                return zero;
            }
            if (!this.selected.balance) {
                return zero;
            }
            return this.selected.balance.sub(this.selected.isSystem ? this.estimatedGas.system : ethers.BigNumber.from(0));
        },
        availableInFiatBn(): ethers.BigNumber {
            const zero = ethers.BigNumber.from(0);
            if (!this.token) {
                return zero;
            }
            return this.token.price.getAmountInFiat(this.availableInTokensBn);
        },
        availableDisplay(): string {
            if (this.token) {
                const decimals = this.token.decimals;
                const amount = `${formatWei(this.useFiat ? this.availableInFiatBn : this.availableInTokensBn, decimals, decimals)}`;
                if (this.useFiat) {
                    return prettyPrintFiatBalance(amount, userStore.fiatLocale, this.isMobile, userStore.fiatCurrency);
                } else {
                    return prettyPrintBalance(amount, userStore.fiatLocale, this.isMobile, this.token.symbol);
                }
            }
            return '';
        },
        amountInFiat(): string {
            if (this.token && this.token.price && !this.useFiat) {
                let fiat = '0.00';
                if (this.amount){
                    fiat = this.token.price.getAmountInFiatStr(this.amount, 2);
                }
                return prettyPrintFiatBalance(fiat, userStore.fiatLocale, this.isMobile, userStore.fiatCurrency);
            }
            return '';
        },
        amountInTokens(): string {
            if (this.token && this.token.price && this.useFiat) {
                let tokensAmount = '0';
                if (this.amount) {
                    tokensAmount = this.token.price.getAmountInTokensStr(this.amount, 4);
                }
                return prettyPrintBalance(tokensAmount, userStore.fiatLocale, this.isMobile, this.token.symbol);
            }
            return '';
        },
        fiatSymbol(): string {
            return userStore.fiatCurrency;
        },
        fiatRateText(): string {
            if (!this.token || !this.token.price.isAvailable) {
                return '';
            }
            if (this.useFiat) {
                const pretty = prettyPrintBalance(this.token.price.inverseStr, userStore.fiatLocale, this.isMobile, this.token.symbol);
                return `(~ ${pretty} / ${userStore.fiatCurrency})`;
            } else {
                const pretty = prettyPrintFiatBalance(this.token.price.str, userStore.fiatLocale, this.isMobile, userStore.fiatCurrency);
                return `(@ ${pretty} / ${this.token.symbol})`;
            }
        },
        finalTokenAmount(): ethers.BigNumber {
            if (!this.amount){
                return ethers.constants.Zero;
            }
            if (this.useFiat && this.token) {
                return this.token.price.getAmountInTokens(this.amount);
            } else {
                return ethers.utils.parseUnits(this.amount,  this.token?.decimals ?? 0);
            }
        },
        useTextarea(): boolean {
            return this.$q.screen.width < 500;
        },
        isAddressValid(): boolean {
            const regex = /^0x[a-fA-F0-9]{40}$/;
            return regex.test(this.address);
        },
        isAmountValid(): boolean {
            if (this.token) {
                const available = this.availableInTokensBn;
                const amount = this.finalTokenAmount;
                return !amount.isZero() && !amount.isNegative() && available.gte(amount);
            } else {
                return false;
            }
        },
        isFormValid(): boolean {
            return this.isAddressValid && this.isAmountValid && this.isPrecisionCorrect;
        },
        isPrecisionCorrect(): boolean {
            if (this.token) {
                if (this.useFiat) {
                    const result = (this.amount.split('.')[1]?.length ?? 0) <= 2;
                    return result;
                } else {
                    const result = (this.amount.split('.')[1]?.length ?? 0) <= this.token.decimals;
                    return result;
                }
            } else {
                return true;
            }
        },
        isLoading(): boolean {
            return ant.stores.feedback.isLoading('transferTokens');
        },
    },
    methods: {
        // TODO: resolve a better dynamic gas estimation. Currently, it's just hardcoded
        // https://github.com/telosnetwork/telos-wallet/issues/274
        async updateEstimatedGas() {
            const chain_settings = chainStore.loggedEvmChain?.settings;
            if (chain_settings)  {
                if (this.token?.isSystem) {
                    this.estimatedGas = await chain_settings.getEstimatedGas(GAS_LIMIT_FOR_SYSTEM_TOKEN_TRANSFER);
                } else {
                    this.estimatedGas = await chain_settings.getEstimatedGas(GAS_LIMIT_FOR_ERC20_TOKEN_TRANSFER);
                }
            } else {
                this.estimatedGas = { system: ethers.BigNumber.from(0), fiat: ethers.BigNumber.from(0) };
            }
        },
        toggleUseFiat() {
            if (this.token && this.amount) {
                if (this.useFiat) {
                    this.amount = this.token.price.getAmountInTokensStr(this.amount, 4);
                } else {
                    this.amount = this.token.price.getAmountInFiatStr(this.amount, 2);
                }
            }

            this.useFiat = !this.useFiat;
        },
        setMaxBalance() {
            if (this.token) {
                if (this.useFiat) {
                    this.amount = `${formatWei(this.availableInFiatBn, this.token.decimals, 2)}`;
                } else {
                    this.amount = `${formatWei(this.availableInTokensBn, this.token.decimals, 4)}`;
                }
            } else {
                this.amount = '';
            }
        },
        viewTokenContract() {
            if (this.token) {
                const explorerUrl = ant.stores.chain.loggedEvmChain?.settings.getExplorerUrl();
                if (explorerUrl) {
                    window.open(explorerUrl + '/address/' + this.token.address, '_blank');
                    return;
                } else {
                    ant.config.notifyErrorHandler(this.$t('settings.no_explorer', { network: ant.stores.chain.currentChain?.settings.getNetwork() }));
                }
            }
        },
        async startTransfer() {
            // if WalletConnect on wrong network, notify user and prevent transaction
            if (localStorage.getItem('wagmi.connected')){
                const chainSettings = useChainStore().currentChain.settings;
                const appChainId = chainSettings.getChainId();
                const networkName = chainSettings.getDisplay();
                const walletConnectChainId = getNetwork().chain?.id.toString();
                if (appChainId !== walletConnectChainId){
                    const errorMessage = this.$t('evm_wallet.incorrect_network', { networkName });
                    (this as any).$errorNotification(errorMessage, true);
                    return;
                }
            }else {
                //if injected provider (Desktop) prompt to switch chains
                await checkNetwork();
            };

            const token = this.token;
            const amount = this.finalTokenAmount;
            const to = this.address;
            if (this.isFormValid && token) {
                ant.stores.balances.transferTokens(token, to, amount).then((trx: TransactionResponse) => {
                    const chain_settings = ant.stores.chain.loggedEvmChain?.settings;
                    if(chain_settings) {
                        ant.config.notifySuccessfulTrxHandler(
                            `${chain_settings.getExplorerUrl()}/tx/${trx.hash}`,
                        );
                    }
                }).catch((err) => {
                    console.error(err);
                    ant.config.notifyErrorHandler(this.$t('evm_wallet.general_error'));
                    // TODO: verify in depth all error mesagged to know how to handle the feedback
                    // https://github.com/telosnetwork/telos-wallet/issues/273
                });
            } else {
                ant.config.notifyErrorHandler(this.$t('evm_wallet.invalid_form'));
            }
        },
    },

});
</script>

<template>
<AppPage>
    <template v-slot:header>
        <div class="c-send-page__title-container">
            <div class="o-text--header-1 u-text--high-contrast"> {{ $t('evm_wallet.send') }}</div>
            <div class="o-text--paragraph u-text--default-contrast">{{ $t('global.from') }}</div>
            <UserInfo
                class="c-send-page__title-addressu-text--default-contrast"
                :displayFullAddress="false"
                :showAddress="true"
                :showCopyBtn="false"
                :showUserMenu="false"
                :lightweight="true"
                :account="loggedAccount"
            />
        </div>
    </template>

    <div class="c-send-page__form-container">
        <q-form
            class="c-send-page__form"
        >
            <div class="c-send-page__row c-send-page__row--1 row">
                <div class="col">
                    <q-input
                        v-model="address"
                        outlined
                        autogrow
                        :type="useTextarea ? 'textarea' : 'text'"
                        :label="$t('evm_wallet.receiving_account')"
                        :rules="[val => !!val || $t('evm_wallet.account_required')]"
                    />
                </div>
            </div>
            <div v-if="!isMobile" class="c-send-page__row c-send-page__row--2 row c-send-page__available">
                <q-space/>
                <div class="col-auto">
                    <span class="c-send-page__amount-available" @click="setMaxBalance">
                        {{ $t('evm_wallet.amount_available', { amount:availableDisplay }) }}
                    </span>
                </div>
            </div>
            <div class="c-send-page__row c-send-page__row--3 row">
                <!-- Token selection -->
                <div class="col-12 col-sm-auto">
                    <q-select
                        v-model="selected"
                        outlined
                        :label="$t('evm_wallet.token')"
                        :options="balances"
                        class="c-send-page__token-selector"
                    >
                        <template v-slot:selected>
                            <span>{{ token?.symbol }}</span>
                        </template>

                        <template v-slot:option="scope">
                            <q-item class="c-send-page__selector-op" v-bind="scope.itemProps">
                                <div class="c-send-page__selector-op-avatar">
                                    <img class="c-send-page__selector-op-icon" :src="scope.opt.logoURI" alt="Token Logo">
                                </div>
                                <div>
                                    <q-item-label class="c-send-page__selector-op-name">{{ scope.opt.name }}</q-item-label>
                                    <q-item-label class="c-send-page__selector-op-balance" caption>
                                        {{ prettyPrintBalance(scope.opt.balance, userStore.fiatLocale, isMobile, scope.opt.symbol) }}
                                    </q-item-label>
                                </div>
                            </q-item>
                        </template>
                    </q-select>
                    <div
                        :class="{
                            'c-send-page__view-contract': true,
                            'c-send-page__view-contract--hidden': !showContractLink,
                        }"
                        @click="viewTokenContract"
                    >
                        <span class="c-send-page__view-contract-text">{{ $t('evm_wallet.view_contract') }}</span>
                        <q-space v-if="!isMobile"/>
                        <q-icon size="xs" name="launch" class="c-send-page__view-contract-min-icon" />
                    </div>
                </div>
                <!-- Amount input -->
                <div class="c-send-page__amount-col col">
                    <div v-if="isMobile" class="row c-send-page__available">
                        <q-space/>
                        <div class="col-auto">
                            <span class="c-send-page__amount-available" @click="setMaxBalance">
                                {{ $t('evm_wallet.amount_available', { amount:availableDisplay }) }}
                            </span>
                        </div>
                    </div>
                    <q-input
                        v-model="amount"
                        outlined
                        class="c-send-page__amount-input"
                        :label="$t('evm_wallet.amount')"
                        :rules="[
                            val => !!val || $t('evm_wallet.amount_required'),
                            val => isPrecisionCorrect || $t('evm_wallet.invalid_amount_precision', { precision: useFiat ? 2 : (token?.decimals ?? 0) })
                        ]"
                        type="number"
                        step="0.01"
                        pattern="[0-9]*\.?[0-9]+"
                    >
                        <template v-slot:hint>
                            <div v-if="token && token.price.isAvailable" class="c-send-page__amount-fiat-footer">
                                <div v-if="useFiat" class="c-send-page__amount-fiat" @click="toggleUseFiat">
                                    <q-icon size="xs" name="swap_vert" class="c-send-page__amount-fiat-icon" />
                                    <span class="o-text--small u-text--low-contrast"> {{ amountInTokens }}</span>
                                </div>
                                <div v-else class="c-send-page__amount-fiat" @click="toggleUseFiat">
                                    <q-icon size="xs" name="swap_vert" class="c-send-page__amount-fiat-icon" />
                                    <span class="o-text--small u-text--low-contrast"> {{ amountInFiat }}</span>
                                </div>
                                <div class="o-text--small u-text--low-contrast">
                                    {{ fiatRateText }}
                                </div>
                            </div>
                        </template>
                    </q-input>

                    <div
                        v-if="token && amount"
                        class="c-send-page__amount-symbol-container"
                    >
                        <span class="o-text--small u-text--low-contrast">
                            <span class="c-send-page__amount-transparent">{{ amount }} &nbsp;</span>
                            <span v-if="useFiat"> {{ fiatSymbol }} </span>
                            <span v-else> {{ token.symbol }} </span>
                        </span>
                    </div>
                </div>
            </div>
            <div class="c-send-page__row c-send-page__row--4 row">
                <q-space/>
                <div class="col-auto">
                    <div class="c-send-page__gas-fee">
                        <div class="row o-text--header-5 u-text--default-contrast text-no-wrap">{{ $t('evm_wallet.estimated_fees') }}</div>
                        <div class="row c-send-page__gas-fee-info">
                            <q-space/>
                            <div class="flex items-center justify-center col-auto q-mr-xs flex-column"><q-icon class="c-send-page__gas-icon" name="local_gas_station" /></div>
                            <div class="col-auto">
                                <div class="row text-no-wrap o-text--small u-text--default-contrast"> {{ gasFeeInSystemSym }} </div>
                                <div class="row text-no-wrap o-text--small u-text--default-contrast"> {{ gasFeeInFiat }} </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="c-send-page__row c-send-page__row--5 row">
                <div class="col">
                    <div class="justify-end row">
                        <q-btn
                            color="primary"
                            class="wallet-btn"
                            :label="$t('evm_wallet.send')"
                            :loading="isLoading"
                            :disable="!isFormValid || isLoading"
                            @click="startTransfer"
                        />
                    </div>
                </div>
            </div>
        </q-form>
    </div>

</AppPage>
</template>

<style lang="scss">
.q-btn.wallet-btn {
    @include text--header-5;
    &+& {
        margin-left: 16px;
    }
}


.c-send-page {
    &__title-container {
        flex-direction: column;
        animation: #{$anim-slide-in-left};
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 4px;
    }


    &__form-container {
        animation: #{$anim-slide-in-left};
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
    }

    &__form {
        width: 100%;
        max-width: 530px;
    }

    &__row {
        gap: 16px;
        &--1 {
            margin-bottom: 5px;
        }

        &--2 {
            margin-bottom: 0px;
        }

        &--3 {
            margin-bottom: 24px;
        }

        &--4 {
            margin-bottom: 24px;
        }

        &--5 {
            margin-bottom: 24px;
        }
    }

    &__token-selector {
        width: 100%;
        @include sm-and-up {
            width: 140px;
        }
    }

    &__selector-op-avatar {
        padding: 0px 14px 0px 0px;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    &__selector-op-icon {
        width: 24px;
        height: 24px;
    }

    &__amount-col {
        position: relative;
    }

    &__amount-symbol-container {
        top: 46px;
        left: 12px;

        @include sm-and-up {
            pointer-events: none;
            position: absolute;
            top: 25px;
            left: 12px;
        }
    }

    &__amount-transparent {
        font-weight: 400;
        letter-spacing: 0.00937em;
        outline: 0;
        color: transparent;
    }


    &__view-contract {
        display: flex;
        align-items: center;
        cursor: pointer;
        margin-top: 8px;
        color: var(--link-color);
        &--hidden {
            opacity: 0;
            pointer-events: none;
        }
    }

    &__view-contract-text {
        @include text--small;
        margin-left: 2px;
    }

    &__view-contract-min-icon {
        margin-left: 4px;
    }

    &__amount-fiat {
        margin-left: -13px;
        display: flex;
        align-items: center;
        cursor: pointer;
        flex-grow: 1;
    }

    &__amount-fiat-footer {
        display: flex;
        flex-direction: row;
    }


    &__amount-fiat-icon {
        color: var(--link-color);
        font-weight: bold;
    }

    &__amount-available {
        @include text--small;
        color: var(--link-color);
        cursor: pointer;
    }

    &__gas-icon {
        color: var(--text-default-contrast);
    }

}
</style>
