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
<div class="o-text--header-1 u-text--center u-text--high-contrast">
    {{ prettyAmount }}
</div>
</template>

<style lang="scss">
</style>
