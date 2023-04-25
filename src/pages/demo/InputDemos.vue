<script lang="ts">
import { defineComponent } from 'vue';
import CurrencyInput from 'components/evm/inputs/CurrencyInput.vue';

export default defineComponent({
    name: 'InputDemos',
    components: {
        CurrencyInput,
    },
    data: () => ({
        currencyInputAmount: 0,
        currencyInputSymbol: 'USD',
        currencyInputLocale: 'en-US',
        currencyInputDecimals: 4,
    }),
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
            label="Decimals"
        />
        <br>
        v-model: {{ currencyInputAmount }}
    </div>
    <div class="col-1"></div>
    <div class="col-10">
        <CurrencyInput
            v-model="currencyInputAmount"
            :symbol="currencyInputSymbol"
            :decimals="+currencyInputDecimals"
            :locale="currencyInputLocale"
        />
    </div>
</div>
<hr>

</template>

<style lang="scss">

</style>
