<script lang="ts">
import { defineComponent } from 'vue';
import CurrencyInput from 'components/evm/inputs/CurrencyInput.vue';
import { parseUnits, formatUnits } from 'ethers/lib/utils';
import { BigNumber } from 'ethers';

const largeTlosOne = BigNumber.from('9'.repeat(7).concat('0'.repeat(18))); // 9.999M TLOS
const largeTlosTwo = BigNumber.from('49295123412'.concat('0'.repeat(11)));
const zeroBn = BigNumber.from('0');

export default defineComponent({
    name: 'InputDemos',
    components: {
        CurrencyInput,
    },
    data: () => ({
        randomizeExchangeRatesInterval: null as null | ReturnType<typeof setInterval>,
        randomizeExchangeRates: false,

        currencyInputLocale: 'en-US',
        currencyInputIsRequired: false,
        currencyInputIsDisabled: false,
        currencyInputIsReadonly: false,

        currencyTokenInputValue: zeroBn,
        currencyTokenInputSymbol: 'TLOS',
        currencyTokenInputDecimals: 18,
        currencyTokenInputMaxValue: largeTlosOne,

        // swappable input - primary amount is in TLOS, secondary in USDT
        currencyTlosUsdtInputValue: zeroBn,
        currencyTlosUsdtInputSymbol: 'TLOS',
        currencyTlosUsdtInputDecimals: 18,
        currencyTlosUsdtInputSecondarySymbol: 'USDT',
        currencyTlosUsdtInputSecondaryDecimals: 6,
        currencyTlosUsdtInputConversionRate: '0.19',
        currencyTlosUsdtInputMaxValue: largeTlosTwo,

        // swappable input - primary amount is in TLOS, secondary in USD
        currencyTlosUsdInputValue: zeroBn,
        currencyTlosUsdInputSymbol: 'TLOS',
        currencyTlosUsdInputDecimals: 18,
        currencyTlosUsdInputSecondarySymbol: 'USD',
        currencyTlosUsdInputSecondaryDecimals: 2,
        currencyTlosUsdInputConversionRate: '0.21',
        currencyTlosUsdInputMaxValue: largeTlosTwo,
    }),
    methods: {
        setRandomizeExchangeRates(enable: boolean) {
            if (enable && !this.randomizeExchangeRatesInterval) {
                // set a timeout to randomize currencyTlosUsdInputConversionRate within 0.1 and 0.3
                this.randomizeExchangeRatesInterval = setInterval(() => {
                    const min = -0.03;
                    const max =  0.03;
                    const randomNumber = () => Math.random() * (max - min) + min;
                    this.currencyTlosUsdInputConversionRate  = (+this.currencyTlosUsdInputConversionRate + randomNumber()).toFixed(4);
                    // debugger;
                    this.currencyTlosUsdtInputConversionRate = (+this.currencyTlosUsdInputConversionRate + randomNumber()).toFixed(4);
                }, 3000);
                this.randomizeExchangeRates = true;
            } else if (!enable && this.randomizeExchangeRatesInterval) {
                clearInterval(this.randomizeExchangeRatesInterval);
                this.randomizeExchangeRatesInterval = null;
                this.randomizeExchangeRates = false;
            }
        },
        updateCurrencyInputLocale(event: InputEvent) {
            const eventTarget = event.target as HTMLInputElement;
            this.currencyInputLocale = eventTarget.value;
        },
    },
    watch: {
        randomizeExchangeRates(newValue: boolean) {
            this.setRandomizeExchangeRates(newValue);
        },
    },
});
</script>

<template>
<div class="row">
    <div class="col-12">
        <h3>Inputs</h3>
    </div>
</div>
<hr>
<div class="row q-mb-lg">
    <div class="col-12">
        <h5>Currency Input</h5>
    </div>
</div>
<div class="row">
    <div class="col-1">
        <label>Locale:&nbsp;</label><br>
        <select class="q-mb-md" @input="updateCurrencyInputLocale">
            <option value="en-US" selected>en-US</option>
            <option value="de-DE">de-DE</option>
            <option value="hi-IN">hi-IN</option>
        </select>

        <br>

        <q-checkbox v-model="currencyInputIsDisabled">Disabled?</q-checkbox>
        <q-checkbox v-model="currencyInputIsReadonly">Readonly?</q-checkbox>
        <q-checkbox v-model="currencyInputIsRequired">Required?</q-checkbox>
        <q-checkbox v-model="randomizeExchangeRates">Simulate changing exchange rates?</q-checkbox>

        <br>
        <br>

        <button @click="$refs.currencyTlosUsdInput.showEmptyError()">
            Set empty error
        </button>
        <label>(Required must be true)</label>
    </div>
    <div class="col-1"></div>
    <div class="col-10">
        <div class="row q-mb-xl">
            <div class="col-3">
                <CurrencyInput
                    v-model="currencyTokenInputValue"
                    :symbol="currencyTokenInputSymbol"
                    :decimals="currencyTokenInputDecimals"
                    :locale="currencyInputLocale"
                    :max-value="currencyTokenInputMaxValue"
                    :disabled="currencyInputIsDisabled"
                    :readonly="currencyInputIsReadonly"
                    :required="currencyInputIsRequired"
                    label="Amount (Token)"
                    class="q-mb-xl"
                />
                Input amount: {{ currencyTokenInputValue.toString() }} (as BigNumber)
            </div>
            <div class="col-3">
                <CurrencyInput
                    v-model="currencyTlosUsdtInputValue"
                    :locale="currencyInputLocale"
                    :symbol="currencyTlosUsdtInputSymbol"
                    :decimals="currencyTlosUsdtInputDecimals"
                    :secondary-currency-symbol="currencyTlosUsdtInputSecondarySymbol"
                    :secondary-currency-decimals="currencyTlosUsdtInputSecondaryDecimals"
                    :secondary-currency-conversion-factor="currencyTlosUsdtInputConversionRate"
                    :max-value="currencyTlosUsdtInputMaxValue"
                    :disabled="currencyInputIsDisabled"
                    :readonly="currencyInputIsReadonly"
                    :required="currencyInputIsRequired"
                    label="Amount (TLOS/USDT)"
                    class="q-mb-xl"
                />
                Input amount: {{ currencyTlosUsdtInputValue.toString() }} (as BigNumber)
            </div>
            <div class="col-3">
                <CurrencyInput
                    ref="currencyTlosUsdInput"
                    v-model="currencyTlosUsdInputValue"
                    :locale="currencyInputLocale"
                    :symbol="currencyTlosUsdInputSymbol"
                    :decimals="currencyTlosUsdInputDecimals"
                    :secondary-currency-symbol="currencyTlosUsdInputSecondarySymbol"
                    :secondary-currency-decimals="currencyTlosUsdInputSecondaryDecimals"
                    :secondary-currency-conversion-factor="currencyTlosUsdInputConversionRate"
                    :max-value="currencyTlosUsdInputMaxValue"
                    :disabled="currencyInputIsDisabled"
                    :readonly="currencyInputIsReadonly"
                    :required="currencyInputIsRequired"
                    label="Amount (TLOS/USD)"
                    class="q-mb-xl"
                />
                Input amount: {{ currencyTlosUsdInputValue.toString() }} (as BigNumber)
            </div>
        </div>
    </div>

</div>
<hr>

</template>

<style lang="scss">

</style>
