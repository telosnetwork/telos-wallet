<script setup lang="ts">
import { computed, ref } from 'vue';

import BaseTextInput from 'components/evm/inputs/BaseTextInput.vue';
import { getAddress } from 'ethers/lib/utils';

const props = defineProps<{
    label: string,
    name: string,
    required?: boolean,
    disabled?: boolean,
    readonly?: boolean,
}>();

// data
const modelValue = ref<string | null>('');
const lowercaseAddressRegex = /^0x[a-f0-9]{40}$/;

// computed
const modelIsBlank = computed(() => [null, ''].includes(modelValue.value));

const inputIsValidAddress = computed(() => {
    if (modelIsBlank.value) {
        return true;
    }

    try {
        getAddress(modelValue.value as string);
        return true;
    } catch {
        return false;
    }
});

const errorMessage = computed(() => inputIsValidAddress.value ? '' : 'Invalid address');

const showLowercaseWarning = computed(
    () => !modelIsBlank.value && lowercaseAddressRegex.test(modelValue.value as string),
);

</script>

<template>
<BaseTextInput
    v-model="modelValue"
    :label="label"
    :name="name"
    :required="required"
    :disable="disabled"
    :readonly="readonly"
    placeholder="0x0000000000000000000000000000000000000000"
/>
</template>

<style lang="scss">

</style>
