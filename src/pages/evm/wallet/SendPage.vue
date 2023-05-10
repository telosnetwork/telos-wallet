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
        token: null as EvmToken | null,
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
                let token = this.token;
                this.token = null;
                if (this.balances.length > 0) {
                    // if there's a url parameter token with the token address, use that token
                    const tokenAddress = this.$route.query.token;
                    if (tokenAddress) {
                        token = this.balances.find(t => t.address === tokenAddress) ?? token;

                        // hide the token address from the url
                        this.$router.replace({ name: 'evm-send', params: { token: undefined } });
                    }

                    if (!token) {
                        token = this.balances[0];
                    }
                }
                this.token = token;
            },
            immediate: true,
        },
        token: {
            handler() {
                this.useFiat = false;
                this.updateEstimatedGas();
            },
            immediate: true,
        },
    },
    computed: {
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
        getSystemToken(): Token {
            return this.balances[0];
        },
        isMobile(): boolean {
            return this.$q.screen.lt.md;
        },
        balances(): EvmToken[] {
            return ant.stores.balances.getBalances('logged') as EvmToken[];
        },
        showContractLink(): boolean {
            return !!this.token?.address;
        },
        availableInTokensBn(): ethers.BigNumber {
            const zero = ethers.BigNumber.from(0);
            if (!this.token) {
                return zero;
            }
            if (!this.token.balanceBn) {
                return zero;
            }
            return this.token.balanceBn.sub(this.token.isSystem ? this.estimatedGas.system : ethers.BigNumber.from(0));
        },
        availableInFiatBn(): ethers.BigNumber {
            const zero = ethers.BigNumber.from(0);
            if (!this.token) {
                return zero;
            }
            const decimals = this.token.decimals;
            const tokensBn = this.availableInTokensBn;
            const priceBn = ethers.utils.parseUnits(this.token.price.toString(), decimals);
            return tokensBn.mul(priceBn).div(ethers.utils.parseUnits('1', decimals));
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
            if (this.token && this.token.price && !this.useFiat && this.amount) {
                const mult = multiplyFloat(this.amount, this.token.price);
                const amount = ethers.utils.parseUnits(mult, this.token.decimals);
                const fiat = `${formatWei(amount, this.token.decimals, 2)}`;
                return prettyPrintFiatBalance(fiat, userStore.fiatLocale, this.isMobile, userStore.fiatCurrency);
            }
            return '';
        },
        amountInTokens(): string {
            if (this.token && this.token.price && this.useFiat && this.amount) {
                const veryPreciseResult = divideFloat(this.amount, this.token.price);
                return prettyPrintBalance(veryPreciseResult, userStore.fiatLocale, this.isMobile, this.token.symbol);
            }
            return '';
        },
        fiatSymbol(): string {
            return userStore.fiatCurrency;
        },
        fiatRateText(): string {
            if (!this.token || !this.token.price) {
                return '';
            }
            if (this.useFiat) {
                const pretty = prettyPrintBalance(1 / this.token.price, userStore.fiatLocale, this.isMobile, this.token.symbol);
                return `(~ ${pretty} / ${userStore.fiatCurrency})`;
            } else {
                const pretty = prettyPrintFiatBalance(this.token.price, userStore.fiatLocale, this.isMobile, userStore.fiatCurrency);
                return `(@ ${pretty} / ${this.token.symbol})`;
            }
        },
        finalTokenAmount(): ethers.BigNumber {
            if (!this.amount){
                return ethers.BigNumber.from(0);
            }
            let amount = this.amount;
            if (this.useFiat && this.token) {
                amount = divideFloat(this.amount, this.token.price);
            }
            return ethers.utils.parseUnits(amount,  this.token?.decimals ?? 0);
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
                    this.amount = divideFloat(this.amount, this.token.price);
                } else {
                    this.amount = multiplyFloat(this.amount, this.token.price);
                    const amount = ethers.utils.parseUnits(this.amount, this.token.decimals);
                    this.amount = `${formatWei(amount, this.token.decimals, 2)}`;
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
        startTransfer() {
            const token = this.token;
            const amount = this.finalTokenAmount;
            const to = this.address;
            if (this.isFormValid) {
                ant.stores.balances.transferTokens(token as Token, to, amount).then((trx: TransactionResponse) => {
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
            <div class="c-send-page__title"> {{ $t('evm_wallet.send') }}</div>
            <div class="c-send-page__title-from">{{ $t('global.from') }}</div>
            <UserInfo
                class="c-send-page__title-address"
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
                <div class="col-12 col-md-auto">
                    <q-select
                        v-model="token"
                        outlined
                        :label="$t('evm_wallet.token')"
                        :options="balances"
                        :class="{
                            'c-send-page__token-selector': true,
                            'c-send-page__token-selector--mobile': isMobile,
                        }"
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
                            <div v-if="token && token.price > 0" class="c-send-page__amount-fiat-footer">
                                <div v-if="useFiat" class="c-send-page__amount-fiat" @click="toggleUseFiat">
                                    <q-icon size="xs" name="swap_vert" class="c-send-page__amount-fiat-icon" />
                                    <span class="c-send-page__amount-fiat-text"> {{ amountInTokens }}</span>
                                </div>
                                <div v-else class="c-send-page__amount-fiat" @click="toggleUseFiat">
                                    <q-icon size="xs" name="swap_vert" class="c-send-page__amount-fiat-icon" />
                                    <span class="c-send-page__amount-fiat-text"> {{ amountInFiat }}</span>
                                </div>
                                <div class="c-send-page__amount-fiat-rate">
                                    {{ fiatRateText }}
                                </div>
                            </div>
                        </template>
                    </q-input>

                    <div
                        v-if="token && amount"
                        :class="{
                            'c-send-page__amount-symbol-container': true,
                            'c-send-page__amount-symbol-container--mobile': isMobile,
                        }"
                    >
                        <span class="c-send-page__amount-symbol">
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
                        <div class="row c-send-page__gas-fee-title text-no-wrap">{{ $t('evm_wallet.estimated_fees') }}</div>
                        <div class="row c-send-page__gas-fee-info">
                            <q-space/>
                            <div class="col-auto q-mr-xs flex flex-column items-center justify-center"><q-icon name="local_gas_station" /></div>
                            <div class="col-auto">
                                <div class="row text-no-wrap"> {{ gasFeeInSystemSym }} </div>
                                <div class="row text-no-wrap"> {{ gasFeeInFiat }} </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="c-send-page__row c-send-page__row--5 row">
                <div class="col">
                    <div class="row justify-end">
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
    padding: 13px 24px;
    font-size: 0.9rem;
    font-weight: 600;
    text-transform: uppercase;
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
        height: 100px;
    }

    &__title {
        font-size: 2.4rem;
        font-weight: 600;
        margin: 0px;
    }

    &__title-from {
        font-size: 12px;
        font-weight: 400;
        margin: -7px 0px 0px 0px;
    }

    &__title-address {
        font-size: 16px;
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
        width: 140px;
        &--mobile {
            width: 100%;
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
        pointer-events: none;
        position: absolute;
        top: 25px;
        left: 12px;
        &--mobile {
            top: 46px;
            left: 12px;
        }
    }

    &__amount-transparent {
        font-weight: 400;
        letter-spacing: 0.00937em;
        outline: 0;
        color: transparent;
    }

    &__amount-symbol {
        font-weight: 400;
        letter-spacing: 0.00937em;
        outline: 0;
        color: rgba(var(--text-color-rgb), 0.5)
    }

    &__view-contract {
        display: flex;
        align-items: center;
        cursor: pointer;
        margin-top: 8px;
        color: $link-blue;
        &--hidden {
            opacity: 0;
            pointer-events: none;
        }
    }

    &__view-contract-text {
        margin-left: 2px;
        font-size: 0.9rem;
        font-weight: 500;
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

    &__amount-fiat-rate {
        margin-top: 3px;
        font-size: 0.9rem;
        margin-right: -12px;
    }

    &__amount-fiat-icon {
        color: $link-blue;
        font-weight: bold;
    }

    &__amount-fiat-text {
        margin-top: 3px;
        font-size: 0.9rem;
        margin-left: 1px;
    }

    &__amount-available {
        font-size: 0.9rem;
        font-weight: 500;
        color: $available-color;
        cursor: pointer;
    }

    &__gas-fee-title {
        font-size: 0.85rem;
        font-weight: 600;
        text-transform: uppercase;
    }
}
</style>
