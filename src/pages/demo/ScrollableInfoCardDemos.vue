<script setup lang="ts">
import { computed, ref } from 'vue';

import ScrollableInfoCards from 'components/evm/ScrollableInfoCards.vue';


// data
const labelText = ref('Label Text');
const tooltipText = ref('This is an example tooltip');
const primaryText = ref('$12,345.67');
const secondaryText = ref('');
const showSecondaryTextAsGray = ref(true);


// computed
const cards = computed(() =>
    new Array(2).fill({
        label: labelText.value,
        tooltip: tooltipText.value,
        primaryText: primaryText.value,
        secondaryText: secondaryText.value,
        lowContrastSecondaryText: showSecondaryTextAsGray.value,
    }),
);

</script>

<template>
<div class="row q-mb-xl">
    <div class="col-12">
        <h3>Scrollable Info Cards</h3>
        <p>Reduce screen size to see horizontal scrolling behavior</p>
    </div>
</div>
<div class="row q-mb-xl">
    <div class="col-12">
        <div class="row">
            <div class="col-3">
                <q-input v-model="labelText" label="Label" />
            </div>
        </div>
        <div class="row">
            <div class="col-3">
                <q-input v-model="tooltipText" label="Tooltip Text" />
            </div>
        </div>
        <div class="row">
            <div class="col-3">
                <q-input v-model="primaryText" label="Primary Text" />
            </div>
        </div>
        <div class="row">
            <div class="col-3">
                <q-input v-model="secondaryText" label="Secondary Text" />
            </div>
        </div>

        <div class="row">
            <div class="col-12">
                <q-checkbox v-model="showSecondaryTextAsGray" label="Show gray secondary text?" />
            </div>
        </div>
    </div>
</div>
<div class="row q-mb-xl">
    <div class="col-12">
        <ScrollableInfoCards :cards="cards" />
    </div>
</div>
</template>

<style lang="scss">
</style>
