<script setup lang="ts">
import { computed } from 'vue';
import { BigNumber } from 'ethers';

import { useUserStore } from 'src/antelope';
import { prettyPrintCurrency } from 'src/antelope/stores/utils/currency-utils';

import TextBadge from 'src/components/TextBadge.vue';

const userStore = useUserStore();

const props = defineProps<{
    tokenOneSymbol: string;
    tokenTwoSymbol: string;
    tokenTwoAmount: BigNumber; // the amount of token two in a single token one
    tokenTwoDecimals: number; // the number of decimals in token two, e.g. 18 for ETH
    decimals: number; // abbreviate should be false in order to display decimals
}>();

// computed
const fiatLocale = computed(() => userStore.fiatLocale);

const label = computed(() => {
    const abbreviate = props.decimals === 0;
    const prettyTokenTwoAmount = prettyPrintCurrency(
        props.tokenTwoAmount,
        props.decimals ?? 2,
        fiatLocale.value,
        abbreviate,
        props.tokenTwoSymbol,
        false,
        props.tokenTwoDecimals,
        false,
    );

    return `1 ${props.tokenOneSymbol} = ${prettyTokenTwoAmount}`;
});
</script>

<template>
<TextBadge :label="label" />
</template>

