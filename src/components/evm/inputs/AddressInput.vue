<script setup lang="ts">
import { computed, ref } from 'vue';

import BaseTextInput from 'components/evm/inputs/BaseTextInput.vue';
import { getAddress } from 'ethers/lib/utils';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';

const props = defineProps<{
    modelValue: string,
    label: string,
    name: string,
    disabled?: boolean,
}>();

const emit = defineEmits(['update:modelValue', 'update:isValid']);
const { t } = useI18n();
const { screen } = useQuasar();

// data
const inputIsDirty = ref<boolean>(false);
const addressRegex = /^0x[a-fA-F0-9]{40}$/;
const lowercaseAddressRegex = /^0x[a-f0-9]{40}$/;


// computed
const showLowercaseWarning = computed(
    () => addressIsValidLowercase(props.modelValue),
);

const addressIsInvalidChecksum = computed(() =>
    addressRegex.test(props.modelValue) &&
    !addressIsValidLowercase(props.modelValue) &&
    !addressIsValidChecksum(props.modelValue),
);

const errorMessage = computed(() => {
    // required error is handled by base input component
    if (addressIsInvalidChecksum.value) {
        return t('forms.errors.invalidChecksum');
    } else if (inputIsDirty.value && !validateAddress(props.modelValue)) {
        return t('forms.errors.invalidAddress');
    }

    return '';
});

const warningText = computed(() => showLowercaseWarning.value ? t('forms.errors.lowercaseAddress') : '');


// methods
function addressIsValidLowercase(address: string): boolean {
    return lowercaseAddressRegex.test(address);
}

function addressIsValidChecksum(address: string): boolean {
    if (address.substring(0, 2) !== '0x' || addressIsValidLowercase(address)) {
        return false;
    }

    try {
        // this method will throw an exception if the address is not a valid checksum, or if the address is all lower
        // however it allows addresses without a '0x' prefix
        getAddress(address);
        return true;
    } catch {
        return false;
    }
}

function validateAddress(address: string): boolean {
    return addressIsValidLowercase(address) || addressIsValidChecksum(address);
}

function handleModelValueUpdate(newVal: string | null) {
    if (!inputIsDirty.value && validateAddress(props.modelValue) && !validateAddress(newVal ?? '')) {
        // handle the scenario where the user has entered a valid address, then modified the value to be invalid
        // without clicking away. in this case we want to show an error state
        inputIsDirty.value = true;
    }
    emit('update:modelValue', newVal === null ? '' : newVal);
    emit('update:isValid', validateAddress(newVal ?? ''));
}
</script>

<template>
<BaseTextInput
    :model-value="modelValue"
    :label="label"
    :name="name"
    :required="true"
    :disable="disabled"
    :error-message="errorMessage"
    :error="!!errorMessage"
    :warning="showLowercaseWarning"
    :success="addressIsValidChecksum(modelValue)"
    :warning-text="warningText"
    :type="$q.screen.width < 500 ? 'textarea' : 'text'"
    autogrow
    placeholder="0x0000000000000000000000000000000000000000"
    @blur="inputIsDirty = true"
    @update:model-value="handleModelValueUpdate"
/>
</template>
