<script lang="ts">
import { defineComponent } from 'vue';

import { useUserStore } from 'src/antelope';
import { prettyPrintCurrency } from 'src/antelope/stores/utils/currency-utils';

export default defineComponent({
    name: 'BigFiatText',
    props: {
        amount: {
            type: Number,
            required: true,
        },
    },
    computed: {
        prettyAmount() {
            const { fiatLocale, fiatCurrency } = useUserStore();

            return prettyPrintCurrency(
                this.amount,
                2,
                fiatLocale,
                false,
                fiatCurrency,
            );
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
