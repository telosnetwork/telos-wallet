<script lang="ts">
import { defineComponent } from 'vue';
import AppPage from 'components/evm/AppPage.vue';
import UserInfo from 'components/evm/UserInfo.vue';
import { getAntelope, useAccountStore, useChainStore, useUserStore } from 'src/antelope';
import { EvmToken, Token, TransactionResponse } from 'src/antelope/types';
import { formatWei, prettyPrintBalance, prettyPrintFiatBalance } from 'src/antelope/stores/utils';
import { useAppNavStore } from 'src/stores';
import { BigNumber, ethers } from 'ethers';
import { getNetwork } from '@wagmi/core';
import { checkNetwork } from 'src/antelope/stores/utils/checkNetwork';
import CurrencyInput from 'components/evm/inputs/CurrencyInput.vue';
import AddressInput from 'components/evm/inputs/AddressInput.vue';

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
        AddressInput,
        CurrencyInput,
        AppPage,
        UserInfo,
    },
    data: () => ({
        address: '',
        addressIsValid: false,
        fiatConversionRate: 0 as number | undefined,
        token: null as EvmToken | null,
        amount: BigNumber.from(0),
        estimatedGas: {
            system: ethers.BigNumber.from(0),
            fiat: ethers.BigNumber.from(0),
        },
        prettyPrintBalance,
    }),
    mounted() {
        global.setShowBackBtn(true);
    },
    watch: {
        balances: {
            handler() {
                let token = this.token;

                if (this.balances.length > 0) {
                    // if there's a url parameter token with the token address, use that token
                    const tokenAddress = this.$route.query.token;
                    if (tokenAddress) {
                        token = this.balances.find(t => t.address === tokenAddress) ?? token;

                        // hide the token address from the url
                        this.$router.replace({ name: 'evm-send', params: { token: undefined } });
                    } else {
                        // get from balances a fresh token object
                        token = this.balances.find(t => t.address === token?.address) ?? token;
                    }

                    if (!token) {
                        token = this.balances[0];
                    }
                }

                if (this.token !== token) {
                    this.token = token;
                }
            },
            immediate: true,
            deep: true,
        },
        token: {
            async handler(newToken: EvmToken | null, oldToken: EvmToken | null) {
                if (newToken?.address !== oldToken?.address) {
                    this.updateEstimatedGas();
                    this.fiatConversionRate = newToken?.price;
                }
            },
            immediate: true,
            deep: true,
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
            return this.$q.screen.lt.sm;
        },
        balances(): EvmToken[] {
            return ant.stores.balances.getBalances('logged') as EvmToken[];
        },
        showContractLink(): boolean {
            return !!this.token?.address;
        },
        currencyInputSecondaryCurrencyBindings() {
            const useSecondaryCurrency = !!this.fiatConversionRate;

            if (!useSecondaryCurrency) {
                return {};
            }

            return {
                secondaryCurrencyCode: userStore.fiatCurrency,
                secondaryCurrencyConversionFactor: this.fiatConversionRate,
                secondaryCurrencyDecimals: 2,
            };
        },
        fiatLocale() {
            return userStore.fiatLocale;
        },
        tokenSymbol() {
            return this.token?.symbol ?? chainStore.loggedChain.settings.getSystemToken().symbol;
        },
        tokenDecimals() {
            return this.token?.decimals ?? 0;
        },
        availableInTokensBn(): ethers.BigNumber {
            const zero = ethers.BigNumber.from(0);

            if (!this.token || !this.token.balanceBn) {
                return zero;
            }

            const availableMinusGas = this.token.balanceBn.sub(this.token.isSystem ? this.estimatedGas.system : ethers.BigNumber.from(0));

            if (availableMinusGas.isNegative()) {
                return zero;
            }

            return availableMinusGas;

        },
        isFormValid(): boolean {
            return this.addressIsValid && !(this.amount.isZero() || this.amount.isNegative() || this.amount.gt(this.availableInTokensBn));
        },
        isLoading(): boolean {
            return ant.stores.feedback.isLoading('transferTokens');
        },
        currencyInputIsLoading() {
            return !(this.token?.decimals && this.token?.symbol) || this.isLoading;
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
        viewTokenContract() {
            if (this.token) {
                const explorerUrl = ant.stores.chain.loggedEvmChain?.settings.getExplorerUrl();
                if (explorerUrl) {
                    window.open(explorerUrl + '/address/' + this.token.address, '_blank');
                    return;
                } else {
                    ant.config.notifyErrorHandler(
                        this.$t(
                            'settings.no_explorer',
                            { network: ant.stores.chain.currentChain?.settings.getNetwork() },
                        ),
                    );
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
            } else {
                //if injected provider (Desktop) prompt to switch chains
                await checkNetwork();
            }

            const token = this.token;
            const amount = this.amount;
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
        <q-spinner v-if="!balances?.length" />
        <q-form
            v-else
            class="c-send-page__form"
        >
            <div class="c-send-page__row c-send-page__row--1 row">
                <div class="col">
                    <AddressInput
                        v-model="address"
                        name="send-page-address-input"
                        :label="$t('evm_wallet.receiving_account')"
                        @update:isValid="addressIsValid = $event"
                    />
                </div>
            </div>
            <div class="c-send-page__row c-send-page__row--3 row">
                <!-- Token selection -->
                <div class="col-12 col-sm-auto c-send-page__token-selection-container">
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
                                        {{ prettyPrintBalance(scope.opt.balance, fiatLocale, isMobile, scope.opt.symbol) }}
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
                <div class="col">
                    <CurrencyInput
                        v-model="amount"
                        v-bind="currencyInputSecondaryCurrencyBindings"
                        :loading="currencyInputIsLoading"
                        :locale="fiatLocale"
                        :decimals="tokenDecimals"
                        :symbol="tokenSymbol"
                        :max-value="availableInTokensBn"
                        :error-if-over-max="true"
                        :label="$t('global.amount')"
                        required="required"
                    />
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
            margin-bottom: 24px;
        }

        &--2 {
            margin-bottom: 0;
        }

        &--3 {
            margin-bottom: 40px;
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
        padding-right: 14px;
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

    &__token-selection-container {
        position: relative;
        margin-bottom: 32px;
    }

    &__view-contract {
        position: absolute;
        bottom: -24px;
        display: flex;
        align-items: center;
        cursor: pointer;
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
