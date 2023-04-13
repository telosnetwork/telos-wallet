<script lang="ts">
import { defineComponent } from 'vue';
import AppPage from 'components/evm/AppPage.vue';
import { getAntelope } from 'src/antelope';
import { EvmToken, Token } from 'src/antelope/types';

const ant = getAntelope();

export default defineComponent({
    name: 'SendPage',
    components: {
        AppPage,
    },
    data: () => ({
        address: '0xa30b5e3c8Fee56C135Aecb733cd708cC31A5657a',
        token: null as EvmToken | null,
        amount: '',
        amountInFiat: '0.00 USD',
        amountInTokens: '0.1234 TLOS',
        gasFeeInTlos: '0.0058 TLOS',
        gasFeeInFiat: '$0.00',
        useFiat: false,
    }),
    watch: {
        balances: {
            handler() {
                if (this.balances.length > 0) {
                    this.token = this.balances[0];
                }
            },
            immediate: true,
        },
    },
    computed: {
        balances(): EvmToken[] {
            console.log('ant.stores.balances.getBalances(\'logged\')', ant.stores.balances.getBalances('logged'));
            return ant.stores.balances.getBalances('logged')
                .map(t => ({ ...t, label: t.symbol })) as unknown as EvmToken[];
        },
        showContractLink(): boolean {
            return !!this.token?.address;
        },
        available(): string {
            if (this.token) {
                return `${this.token.balance} ${this.token.symbol}`;
            }
            return '0.00 TLOS';
        },
    },
    methods: {
        toggleUseFiat() {
            this.useFiat = !this.useFiat;
        },
        setAllBalance() {
            this.amount = this.available;
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
            console.log('startTransfer');

            // transferTokens(token: Token, to: string, amount: string, memo?: string)
            const token = this.token;
            const amount = this.amountInTokens.split(' ')[0];
            const to = this.address;
            ant.stores.balances.transferTokens(token as Token, to, amount);
        },
    },

});
</script>

<template>
<AppPage>
    <template v-slot:header>
        <div class="c-send-page__title-container">
            <p class="c-send-page__title">Send</p>
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
                        <template v-slot:option="scope">
                            <q-item class="c-send-page__selector-op" v-bind="scope.itemProps">
                                <div class="c-send-page__selector-op-avatar">
                                    <img class="c-send-page__selector-op-icon" :src="scope.opt.logoURI" alt="Token Logo">
                                </div>
                                <div>
                                    <q-item-label class="c-send-page__selector-op-name">{{ scope.opt.name }}</q-item-label>
                                    <q-item-label class="c-send-page__selector-op-balance" caption>{{ scope.opt.tinyBalance }} {{ scope.opt.symbol }}</q-item-label>
                                </div>
                            </q-item>
                        </template>
                    </q-select>
                    <div v-if="showContractLink" class="c-send-page__view-contract" @click="viewTokenContract">
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
                    >
                        <template v-slot:hint>
                            <div v-if="useFiat" class="c-send-page__amount-fiat" @click="toggleUseFiat">
                                <q-icon size="xs" name="swap_vert" class="c-send-page__amount-fiat-icon" />
                                <span class="c-send-page__amount-fiat-text"> {{ amountInTokens }}</span>
                            </div>
                            <div v-else class="c-send-page__amount-fiat" @click="toggleUseFiat">
                                <q-icon size="xs" name="swap_vert" class="c-send-page__amount-fiat-icon" />
                                <span class="c-send-page__amount-fiat-text"> {{ amountInFiat }}</span>
                            </div>
                        </template>
                    </q-input>
                    <div v-if="token && amount" class="c-send-page__amount-symbol-container">
                        <span class="c-send-page__amount-symbol"><span class="c-send-page__amount-transparent">{{ amount }}</span> {{ token.symbol }}</span>
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
                            flat
                            color="primary"
                            :label="$t('evm_wallet.cancel')"
                            class="wallet-btn"
                            @click="goBack"
                        />
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
