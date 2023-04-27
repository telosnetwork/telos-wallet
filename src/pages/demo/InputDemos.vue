<script lang="ts">
import { defineComponent } from 'vue';
import CurrencyInput from 'components/evm/inputs/CurrencyInput.vue';
import { parseUnits, formatUnits } from 'ethers/lib/utils';
import { BigNumber } from 'ethers';

export default defineComponent({
    name: 'InputDemos',
    components: {
        CurrencyInput,
    },
    data: () => ({
        currencyInputAmount: BigNumber.from(0),
        currencyInputSymbol: 'TLOS',
        currencyInputLocale: 'en-US',
        currencyInputDecimals: 18, // eztodo need displaydecimals?
        currencyInputMaxValue: 99999999,
        currencyInputTokenDecimals: 18,
    }),
    computed: {
        currencyInputAmountAsNumberString() {
            return formatUnits(this.currencyInputAmount ?? BigNumber.from(0), this.currencyInputTokenDecimals);
        },
        currencyInputMaxValueBn() {
            return parseUnits(this.currencyInputMaxValue.toString(), this.currencyInputTokenDecimals);
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
    <div class="col-1">
        <q-select
            v-model="currencyInputLocale"
            :options="['en-US', 'de-DE', 'in-IN']"
            label="Locale"
            color="primary"
        />
        <br>
        <q-input
            v-model="currencyInputSymbol"
            dense
            label="Symbol"
        />
        <br>
        <q-input
            v-model="currencyInputDecimals"
            type="number"
            step="1"
            min="0"
            label="Decimals"
        />
        <br>
        <q-input
            v-model="currencyInputMaxValue"
            type="number"
            step="1"
            min="0"
            label="Max Value"
        />
        <br>
        input value as number: {{ currencyInputAmountAsNumberString }}
    </div>
    <div class="col-1"></div>
    <div class="col-10">
        <CurrencyInput
            v-model="currencyInputAmount"
            :symbol="currencyInputSymbol"
            :decimals="+currencyInputDecimals"
            :locale="currencyInputLocale"
            :max-value="currencyInputMaxValueBn"
            label="Amount"
        />
    </div>
</div>
<hr>

</template>

<style lang="scss">

</style>
