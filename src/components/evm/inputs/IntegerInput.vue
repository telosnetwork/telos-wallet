<script setup lang="ts">
import {
    computed,
    ref,
    useAttrs,
    watch,
    onMounted,
} from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';

import {
    isPaste,
    modifierKeys,
    userIsDoingTextOperation,
    validKeystrokes,
} from 'src/components/evm/inputs/input-helpers';

import ToolTip from 'components/ToolTip.vue';


const $q = useQuasar();
const { t: $t } = useI18n();

const props = defineProps<{
    modelValue: number;
    name: string;
    label: string;
    max?: number;
    min?: number;
}>();

if (props.modelValue % 1 !== 0) {
    throw new Error('IntegerInput modelValue must be an integer');
}

const attrs = useAttrs();

const emit = defineEmits(['update:modelValue']);

const largeNumberSeparators = [',', '.'];


// data
const inputValue = ref();
const inputRef = ref<HTMLInputElement | null>(null);
const isDirty = ref(false);


// computed
const isRequired = computed(() => [true, 'true', 'required'].includes(attrs.required as string | boolean));
const isDisabled = computed(() => [true, 'true', 'disabled'].includes(attrs.disabled as string | boolean));
const isReadonly = computed(() => [true, 'true', 'readonly'].includes(attrs.readonly as string | boolean));
const inputBindings = computed(() => {
    const attributes: Record<string, string> = {};
    if (isDisabled.value) {
        attributes.disabled = 'disabled';
    }

    if (isReadonly.value) {
        attributes.readonly = 'readonly';
    }

    if (isRequired.value) {
        attributes.required = 'required';
    }

    return attributes;
});
const errorText = computed(() => {
    if (isDirty.value && isRequired.value && inputValue.value === '') {
        return $t('forms.errors.required');
    }

    if (props.max !== undefined && Number(inputValue.value) > props.max) {
        return $t('forms.errors.lowerOrEqualThan', { value: props.max.toLocaleString() });
    }

    if (props.min !== undefined && Number(inputValue.value) < props.min && isDirty.value) {
        return $t('forms.errors.greaterOrEqualThan', { value: props.min.toLocaleString() });
    }

    return '';
});
const enableMaxValueTooltip = computed(() => !isDisabled.value && !isReadonly.value && !$q.screen.lt.md);
const amountAvailableText = computed(() => `${props.max?.toLocaleString()} ${$t('global.total')}`);

// watchers
watch(props, (newProps, oldProps) => {
    if (newProps.modelValue !== oldProps?.modelValue || newProps.modelValue.toLocaleString() !== inputValue.value) {
        const newValue = newProps.modelValue;
        const input = inputRef.value as HTMLInputElement;
        const newValueFormatted = newValue.toLocaleString();

        if ((input.value === '' && newValue === 0) || input.value === newValueFormatted) {
            return;
        }

        const shouldSetToBlank = !isDirty.value && newValue === 0;

        setInputValue(shouldSetToBlank ? '' : newValueFormatted);
    }
});

// methods
onMounted(() => {
    setInputValue(props.modelValue.toLocaleString());
});

function setInputValue(newValue: string) {
    (inputRef.value as HTMLInputElement).value = newValue;
    inputValue.value = newValue;
}

function setInputCaretPosition(position: number) {
    const input = (inputRef.value as HTMLInputElement);
    input.selectionStart = position;
    input.selectionEnd = position;
}

function handleKeydown(event: KeyboardEvent) {
    if (isPaste(event)) {
        return;
    }

    if (!validKeystrokes.includes(event.key) && !userIsDoingTextOperation(event)) {
        event.preventDefault();
        return;
    }

    const inputElement = inputRef.value as HTMLInputElement;
    const inputValue = inputElement.value;
    const caretPosition = inputElement.selectionStart ?? 0;

    let newCaretPosition = caretPosition;

    const eventHasModifiers = modifierKeys.some(modifier => event[modifier]);
    const targetHasNoSelection = caretPosition === inputElement.selectionEnd;
    const deletingBackward = event.key === 'Backspace' && !eventHasModifiers && targetHasNoSelection;
    const deletingForward = event.key === 'Delete' && !eventHasModifiers && targetHasNoSelection;

    const nextCharacterIsLargeNumberSeparator = largeNumberSeparators.includes(inputValue[caretPosition]);
    const previousCharacterIsLargeNumberSeparator = largeNumberSeparators.includes(inputValue[caretPosition - 1]);

    const deletingLargeNumberSeparator =
        (deletingForward && nextCharacterIsLargeNumberSeparator) ||
        (deletingBackward && previousCharacterIsLargeNumberSeparator);

    if (deletingForward && nextCharacterIsLargeNumberSeparator) {
        const preSeparatorInclusive = inputValue.slice(0, caretPosition + 1);
        const newPostSeparator = inputValue.slice(caretPosition + 2);

        setInputValue(preSeparatorInclusive.concat(newPostSeparator));
    } else if (deletingBackward && previousCharacterIsLargeNumberSeparator) {
        const newPreSeparator = inputValue.slice(0, caretPosition - 2);
        const postSeparatorInclusive = inputValue.slice(caretPosition - 1);

        setInputValue(newPreSeparator.concat(postSeparatorInclusive));
        newCaretPosition = caretPosition - 2;
    }

    if (deletingLargeNumberSeparator) {
        setInputCaretPosition(newCaretPosition);
        event.preventDefault();
        handleInput();

        return;
    }
}

function getSeparatorsToLeftOfCursor(inputValue: string, cursorPosition: number) {
    return (inputValue.substring(0, cursorPosition).match(/[.,]/g) || []).length;
}

function fillMaxAmount() {
    if (props.max === undefined) {
        return;
    }
    setInputValue(props.max.toLocaleString());
    handleInput();
}

function handleInput() {
    const input = inputRef.value as HTMLInputElement;
    const cursorPosition = input.selectionStart as number;
    const separatorsToLeftOfCursor = getSeparatorsToLeftOfCursor(input.value, cursorPosition);
    const newValueNumerals = input.value.replace(/[^0-9]/g, '');

    if (newValueNumerals === '') {
        setInputValue('');
    } else {
        setInputValue(Number(newValueNumerals).toLocaleString());
        const newSeparatorsToLeftOfCursor = getSeparatorsToLeftOfCursor(input.value, cursorPosition);
        const differenceInSeparators = newSeparatorsToLeftOfCursor - separatorsToLeftOfCursor;

        input.selectionStart = cursorPosition + differenceInSeparators;
        input.selectionEnd = cursorPosition + differenceInSeparators;
    }

    const newValue = Number(input.value.replace(/[^0-9]/g, '') || '0');

    if (newValue !== props.modelValue) {
        emit('update:modelValue', newValue);
    }
}

function showEmptyError() {
    isDirty.value = true;
}

function resetEmptyError() {
    isDirty.value = false;
}

function focusInput() {
    (inputRef.value as HTMLInputElement).focus();
}

defineExpose({
    focusInput,
    showEmptyError,
    resetEmptyError,
});
</script>

<template>
<div
    :class="{
        'c-integer-input': true,
        'c-text-input': true,
        'c-text-input--readonly': isReadonly,
        'c-text-input--disabled': isDisabled,
        'c-text-input--error': !!errorText,
    }"
>
    <div
        v-if="max !== undefined && !isDisabled && !isReadonly"
        class="c-integer-input__max-amount"
        tabindex="0"
        role="button"
        :aria-label="$t('evm_wallet.click_to_fill_max')"
        @click="fillMaxAmount"
        @keydown.space.enter.prevent="fillMaxAmount"
    >
        <ToolTip v-if="enableMaxValueTooltip" :text="$t('evm_wallet.click_to_fill_max')" :hide-icon="true">
            {{ amountAvailableText }}
        </ToolTip>
        <template v-else>
            {{ amountAvailableText }}
        </template>
    </div>

    <div :id="`integer-input-label--${name}`" class="c-text-input__label-text">
        {{ label.concat(isRequired ? '*' : '') }}
    </div>

    <input
        ref="inputRef"
        v-bind="inputBindings"
        :name="name"
        type="text"
        inputmode="numeric"
        pattern="[0-9]*"
        class="c-text-input__input"
        placeholder="0"
        autocomplete="off"
        :aria-labelledby="`integer-input-label--${name}`"
        @keydown="handleKeydown"
        @input="() => { isDirty = true; handleInput() }"
        @blur="isDirty = true"
    >

    <div class="c-text-input__error-text">
        {{ errorText }}
    </div>
</div>
</template>

<style lang="scss">
.c-integer-input {
    width: 200px;

    &__max-amount {
        @include text--small;
        @include link-color-text;

        width: max-content;
        position: absolute;
        top: -24px;
        right: 0;
        cursor: pointer;
    }
}
</style>
