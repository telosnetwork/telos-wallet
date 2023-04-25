<script lang="ts">
import { defineComponent } from 'vue';
import CurrencyInput from 'components/evm/inputs/CurrencyInput.vue';

export default defineComponent({
    name: 'InputDemos',
    components: {
        CurrencyInput,
    },
    data: () => ({
        amount: 0, // eztodo make inputs for these
        symbol: 'USD', // eztodo make inputs for these
        locale: 'en-US',
    }),
    methods: {
        updateLocale(event: InputEvent) {
            this.locale = (event.target as HTMLInputElement)?.value;
        },
    },
});
</script>

<template>
<div class="row q-mb-lg">
    <div class="col-6">
        <label for="localeSelect">Locale:</label><br>
        <select id="localeSelect" @change="updateLocale">
            <option  value="en-US" selected>en-US</option>
            <option value="de-DE">de-DE</option>
            <option value="hi-IN">hi-IN</option>
        </select>
        <br>
        {{ amount }}
        <br>
        <button @click="amount++">Add 1 to value</button>
    </div>
</div>
<div class="row">
    <div class="col-xs-12 col-sm-6">
        <CurrencyInput
            v-model="amount"
            :symbol="symbol"
            :decimals="4"
            :locale="locale"
        />
    </div>
</div>

</template>

<style lang="scss">

</style>
