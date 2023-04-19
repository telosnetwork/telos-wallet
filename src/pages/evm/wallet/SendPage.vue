<script lang="ts">
import { defineComponent } from 'vue';
import AppPage from 'components/evm/AppPage.vue';
import { getAntelope, useChainStore, useUserStore } from 'src/antelope';
import { EvmToken, Token, TransactionResponse } from 'src/antelope/types';
import { prettyPrintBalance, prettyPrintFiatBalance } from 'src/antelope/stores/utils';

const ant = getAntelope();
const userStore = useUserStore();
const chainStore = useChainStore();

export default defineComponent({
    name: 'SendPage',
    components: {
        AppPage,
    },
    data: () => ({
        address: '',
        token: null as EvmToken | null,
        amount: '',
        useFiat: false,
        userStore,
        estimatedGas: { system: '0', fiat: '0' },
        prettyPrintBalance,
        tempCurrentBalance: '',
    }),
    watch: {
        balances: {
            handler() {
                let token = this.token;
                this.token = null;
                if (this.balances.length > 0 && !token) {
                    token = this.balances[0];
                }
                this.token = token;
            },
            immediate: true,
        },
        token: {
            handler() {
                this.useFiat = false;
                this.updateEstimatedGas();
                this.setAllBalance();
            },
            immediate: true,
        },
    },
    computed: {
        gasFeeInTlos() {
            const symbol = chainStore.loggedChain.settings.getSystemToken().symbol;
            return prettyPrintBalance(this.estimatedGas.system, userStore.fiatLocale, this.isMobile, symbol);
        },
        gasFeeInFiat() {
            return prettyPrintFiatBalance(this.estimatedGas.fiat, userStore.fiatLocale, this.isMobile, userStore.fiatCurrency);
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
        available(): string {
            if (this.token) {
                if (this.useFiat) {
                    return prettyPrintFiatBalance(this.token.fiatBalance, userStore.fiatLocale, this.isMobile, userStore.fiatCurrency);
                } else {
                    return prettyPrintBalance(this.token.balance, userStore.fiatLocale, this.isMobile, this.token.symbol);
                }
            }
            return '';
        },
        amountInFiat(): string {
            if (this.token && this.token.price && !this.useFiat) {
                return prettyPrintFiatBalance(+this.amount * this.token.price, userStore.fiatLocale, this.isMobile, userStore.fiatCurrency);
            }
            return '';
        },
        amountInTokens(): string {
            if (this.token && this.token.price && this.useFiat) {
                return prettyPrintBalance(+this.amount / this.token.price, userStore.fiatLocale, this.isMobile, this.token.symbol);
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

            const pretty = prettyPrintFiatBalance(this.token.price, userStore.fiatLocale, this.isMobile, userStore.fiatCurrency);
            return `(@ ${pretty} / ${this.token.symbol})`;
        },
        finalTokenAmount(): string {
            if (this.useFiat && this.token) {
                return (+this.amount / this.token.price).toString();
            } else {
                return this.amount;
            }
        },
        isAddressValid(): boolean {
            const regex = /^0x[a-fA-F0-9]{40}$/;
            return regex.test(this.address);
        },
        isAmountValid(): boolean {
            if (this.token) {
                const amount = +this.finalTokenAmount;
                return amount > 0 && amount <= +this.token.fullBalance;
            } else {
                return false;
            }
        },
        isFormValid(): boolean {
            return this.isAddressValid && this.isAmountValid;
        },
    },
    methods: {
        async updateEstimatedGas() {
            const chain_settings = chainStore.loggedEvmChain?.settings;
            if (chain_settings)  {
                if (this.token?.isSystem) {
                    this.estimatedGas = await chain_settings.getEstimatedGas(26250);
                } else {
                    this.estimatedGas = await chain_settings.getEstimatedGas(55500);
                }
            } else {
                this.estimatedGas = { system: '0', fiat: '0' };
            }
        },
        toggleUseFiat() {
            if (this.token) {
                if (this.useFiat) {
                    this.amount = (+this.amount / this.token.price).toString();
                } else {
                    this.amount = (+this.amount * this.token.price).toString();
                }
            }

            this.useFiat = !this.useFiat;
        },
        setAllBalance() {
            if (this.token) {
                if (this.useFiat) {
                    this.amount = (+this.token.balance * this.token.price).toString();
                } else {
                    this.amount = this.token.balance;
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
        goBack() {
            this.$router.back();
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
                    if (typeof err.message === 'string') {
                        console.error(err.message, err.payload, err);
                        ant.config.notifyFailedTrxHandler(this.$t(err.message));
                    } else if (typeof err === 'string') {
                        ant.config.notifyFailedTrxHandler(this.$t(err));
                    } else {
                        ant.config.notifyErrorHandler(this.$t('evm_wallet.general_error'));
                    }
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
            <p class="c-send-page__title"> {{ $t('evm_wallet.send') }}</p>
        </div>
        <q-btn
            class="c-send-page__back-button"
            flat
            dense
            label="Back"
            icon="arrow_back_ios"
            @click="goBack"
        />
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
                        :label="$t('evm_wallet.receiving_account')"
                        :rules="[val => !!val || $t('evm_wallet.account_required')]"
                    />
                </div>
            </div>
            <div class="c-send-page__row c-send-page__row--2 row">
                <q-space/>
                <div class="col-auto">
                    <span class="c-send-page__amount-available" @click="setAllBalance">
                        {{ $t('evm_wallet.amount_available', { amount:available }) }}
                    </span>
                </div>
            </div>
            <div class="c-send-page__row c-send-page__row--3 row">
                <!-- Token selection -->
                <div class="col-auto">
                    <q-select
                        v-model="token"
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
                        <q-icon size="xs" name="launch" class="c-send-page__view-contract-min-icon" />
                    </div>
                </div>
                <!-- Amount input -->
                <div class="c-send-page__amount-col col">
                    <q-input
                        v-model="amount"
                        outlined
                        class="c-send-page__amount-input"
                        :label="$t('evm_wallet.amount')"
                        :rules="[val => !!val || $t('evm_wallet.amount_required')]"
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

                    <div v-if="token && amount" class="c-send-page__amount-symbol-container">
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
                                <div class="row text-no-wrap"> {{ gasFeeInTlos }} </div>
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
                            :label="$t('evm_wallet.send')"
                            class="wallet-btn"
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
    // back-button on top left
    &__back-button {
        position: absolute;
        top: 24px;
        left: 32px;
        z-index: 1;
        font-size: 12.8px;
        font-weight: 600;
        i {
            font-size: 1.15em;
        }
    }
    &__title-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100px;
    }

    &__title {
        font-size: 2.4rem;
        font-weight: 600;
    }

    &__form-container {
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
        left: 12px
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
        flex-grow: 1;
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
