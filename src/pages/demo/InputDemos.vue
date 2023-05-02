<script lang="ts">
import { defineComponent } from 'vue';
import CurrencyInput from 'components/evm/inputs/CurrencyInput.vue';
import { parseUnits, formatUnits } from 'ethers/lib/utils';
import { BigNumber } from 'ethers';

const maxTlos = BigNumber.from('9'.repeat(7).concat('0'.repeat(18))); // 9.999M TLOS

export default defineComponent({
    name: 'InputDemos',
    components: {
        CurrencyInput,
    },
    data: () => ({
        // eztodo make variable for bignumber from 0
        currencyInputLocale: 'en-US',
        currencyInputIsRequired: false,
        currencyInputIsDisabled: false,
        currencyInputIsReadonly: false,

        currencyTokenInputValue: BigNumber.from('0'),
        currencyTokenInputSymbol: 'TLOS',
        currencyTokenInputDecimals: 18,
        currencyTokenInputMaxValue: maxTlos,

        currencyFiatInputValue: 0,
        currencyFiatInputSymbol: 'USD',
        currencyFiatInputMaxValue: 9999999, // 9.999M USD
        currencyInputSecondaryValue: '',

        // swappable input - primary amount is in TLOS (token), secondary in USD (fiat)
        currencyTlosUsdInputValue: BigNumber.from('0'),
        currencyTlosUsdInputSymbol: 'TLOS',
        currencyTlosUsdInputDecimals: 18,
        currencyTlosUsdInputSecondarySymbol: 'USD',
        currencyTlosUsdInputConversionRate : 0.2,
        currencyTlosUsdInputMaxValue: BigNumber.from('5000'.concat('0'.repeat(18))), // 5K TLOS

        // swappable input - primary amount is in USD (fiat), secondary in TLOS (token)
        currencyUsdTlosInputValue: 0,
        currencyUsdTlosInputSymbol: 'USD',
        currencyUsdTlosInputSecondarySymbol: 'TLOS',
        currencyUsdTlosInputSecondaryDecimals: 18,
        currencyUsdTlosInputConversionRate : 5,
        currencyUsdTlosInputMaxValue: 5000, // 5K USD

        // swappable input - primary amount is in TLOS (token), secondary in USDT (token)
        currencyTlosUsdtInputValue: BigNumber.from('0'),
        currencyTlosUsdtInputSymbol: 'TLOS',
        currencyTlosUsdtInputDecimals: 18,
        currencyTlosUsdtInputSecondarySymbol: 'USDT',
        currencyTlosUsdtInputSecondaryDecimals: 6,
        currencyTlosUsdtInputConversionRate: 0.19,
        currencyTlosUsdtInputMaxValue: BigNumber.from('5000'.concat('0'.repeat(18))), // eztodo make variable
    }),
    methods: {
        updateCurrencyInputLocale(event: InputEvent) {
            const eventTarget = event.target as HTMLInputElement;
            this.currencyInputLocale = eventTarget.value;
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
            <option value="in-IN">in-IN</option>
        </select>

        <br>

        <q-checkbox v-model="currencyInputIsDisabled">Disabled?</q-checkbox>
        <q-checkbox v-model="currencyInputIsReadonly">Readonly?</q-checkbox>
        <q-checkbox v-model="currencyInputIsRequired">Required?</q-checkbox>
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
                    v-model="currencyFiatInputValue"
                    :symbol="currencyFiatInputSymbol"
                    :locale="currencyInputLocale"
                    :max-value="currencyFiatInputMaxValue"
                    :disabled="currencyInputIsDisabled"
                    :readonly="currencyInputIsReadonly"
                    :required="currencyInputIsRequired"
                    label="Amount (fiat)"
                    class="q-mb-xl"
                />
                Input amount: {{ currencyFiatInputValue }} (as Number)
            </div>
        </div>
        <div class="row">
            <div class="col-3">
                <CurrencyInput
                    v-model="currencyTlosUsdInputValue"
                    :symbol="currencyTlosUsdInputSymbol"
                    :decimals="currencyTlosUsdInputDecimals"
                    :secondary-currency-symbol="currencyTlosUsdInputSecondarySymbol"
                    :secondary-currency-conversion-factor="currencyTlosUsdInputConversionRate"
                    :max-value="currencyTlosUsdInputMaxValue"
                    :locale="currencyInputLocale"
                    :disabled="currencyInputIsDisabled"
                    :readonly="currencyInputIsReadonly"
                    :required="currencyInputIsRequired"
                    label="Amount (TLOS/USD)"
                    class="q-mb-xl"
                />
                Input amount: {{ currencyTlosUsdInputValue.toString() }} (as BigNumber)
            </div>
            <div class="col-3">
                <CurrencyInput
                    v-model="currencyUsdTlosInputValue"
                    :locale="currencyInputLocale"
                    :symbol="currencyUsdTlosInputSymbol"
                    :secondary-currency-symbol="currencyUsdTlosInputSecondarySymbol"
                    :secondary-currency-decimals="currencyUsdTlosInputSecondaryDecimals"
                    :secondary-currency-conversion-factor="currencyUsdTlosInputConversionRate"
                    :max-value="currencyUsdTlosInputMaxValue"
                    :disabled="currencyInputIsDisabled"
                    :readonly="currencyInputIsReadonly"
                    :required="currencyInputIsRequired"
                    label="Amount (USD/TLOS)"
                    class="q-mb-xl"
                />
                <!-- eztodo update styling to not need mb -->
                <!--eztodo add inputs to test other combos of fiat and token-->
                Input amount: {{ currencyUsdTlosInputValue }} (as number)
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
                <!-- eztodo error when inputting usdt value-->
                Input amount: {{ currencyTlosUsdtInputValue.toString() }} (as BigNumber)
            </div>
        </div>
    </div>

</div>
<hr>

</template>

<style lang="scss">

</style>
