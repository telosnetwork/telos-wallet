<script lang="ts">
import { defineComponent } from 'vue';
import { prettyPrintCurrency } from 'src/antelope/stores/utils';

export default defineComponent({
    name: 'BigFiatText',
    props: {
        amount: {
            type: Number,
            required: true,
        },
    },
    computed: {
        // TODO use dynamic fiat to get symbol
        // https://github.com/telosnetwork/telos-wallet/issues/215
        symbol() {
            return '$';
        },
        prettyAmount() {
            let formatted = prettyPrintCurrency(this.amount);

            return `${this.symbol} ${formatted}`;
        },
    },
});
</script>

<template>
<div class="c-big-fiat-text">
    {{ prettyAmount }}
</div>
</template>

<style lang="scss">
.c-big-fiat-text {
    line-height: 48px;
    font-weight: 600;
    font-size: 32px;
    text-align: center;

    @media screen and (min-width: 360px) {
        font-size: 40px;
    }
}
</style>
