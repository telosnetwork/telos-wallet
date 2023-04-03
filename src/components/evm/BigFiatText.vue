<script lang="ts">
import { defineComponent } from 'vue';

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
            let formatted = this.amount.toLocaleString('en-us');

            if (formatted.indexOf('.') !== -1) {
                const formattedInteger = formatted.split('.')[0];
                const formattedFraction = this.amount.toFixed(2).split('.')[1];

                formatted = `${formattedInteger}.${formattedFraction}`;

            } else {
                formatted = `${formatted}.00`;
            }

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

    @media screen and (min-width: 360px) {
        font-size: 40px;
    }
}
</style>
