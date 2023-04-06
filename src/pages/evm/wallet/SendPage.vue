<script lang="ts">
import { defineComponent } from 'vue';
import AppPage from 'components/evm/AppPage.vue';
import { useGlobalStore } from 'src/stores';

const global = useGlobalStore();

export default defineComponent({
    name: 'SendPage',
    components: {
        AppPage,
    },
    data: () => ({
        address: '',
        token: '',
        amount: '',
        amountInFiat: '0.00 USD',
        gasFeeInTlos: '0.0058 TLOS',
        gasFeeInFiat: '$0.00',
        available: '12,845.1235 TLOS',
    }),
    methods: {
        setAllBalance() {
            this.amount = this.available;
        },
        viewTokenContract() {
            console.log('viewTokenContract');
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
                <div class="col-auto">
                    <q-select
                        v-model="token"
                        outlined
                        :label="$t('evm_wallet.token')"
                        :options="['TLOS', 'WTLOS', 'STLOS', 'ACORN']"
                        class="c-send-page__token-selector"
                    />
                    <div class="c-send-page__view-contract" @click="viewTokenContract">
                        <span class="c-send-page__view-contract-text">{{ $t('evm_wallet.view_contract') }}</span>
                        <q-icon size="xs" name="launch" class="c-send-page__view-contract-min-icon" />
                    </div>
                </div>
                <div class="col">
                    <q-input
                        v-model="amount"
                        outlined
                        class="c-send-page__amount-input"
                        :label="$t('evm_wallet.amount')"
                        :rules="[val => !!val || $t('evm_wallet.amount_required')]"
                    >
                        <template v-slot:hint>
                            <div class="c-send-page__amount-fiat">
                                <q-icon size="xs" name="swap_vert" class="c-send-page__amount-fiat-icon" />
                                <span class="c-send-page__amount-fiat-text"> {{ amountInFiat }}</span>
                            </div>
                        </template>
                    </q-input>
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
                        />
                        <q-btn
                            color="primary"
                            :label="$t('evm_wallet.send')"
                            class="wallet-btn"
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
