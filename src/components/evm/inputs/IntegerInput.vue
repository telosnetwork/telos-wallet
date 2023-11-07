<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
    modelValue: number;
    label?: string;
    max?: number;
    min?: number;
}>();

const emit = defineEmits(['update:modelValue']);

const largeNumberSeparators = [',', '.'];

// data
const inputRef = ref<HTMLInputElement | null>(null);

// watchers
watch(props, (newProps, oldProps) => {
    if (newProps.modelValue !== oldProps.modelValue) {
        const newValue = newProps.modelValue;
        const input = inputRef.value as HTMLInputElement;
        const newValueFormatted = newValue.toLocaleString();

        if ((input.value === '' && newValue === 0) || input.value === newValueFormatted) {
            return;
        }

        input.value = newValueFormatted;
    }
});

// methods
function setInputValue(newValue: string) {
    (inputRef.value as HTMLInputElement).value = newValue;
}

function setInputCaretPosition(position: number) {
    const input = (inputRef.value as HTMLInputElement);
    input.selectionStart = position;
    input.selectionEnd = position;
}

function handleKeydown(event: KeyboardEvent) {
    const numKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const modifierKeys: ['ctrlKey', 'metaKey', 'shiftKey', 'altKey'] = ['ctrlKey', 'metaKey', 'shiftKey', 'altKey'];

    const validKeystrokes = [
        ...numKeys,
        ...modifierKeys,
        'ArrowLeft',
        'ArrowRight',
        'End',
        'Home',
        'Delete',
        'Backspace',
        'Tab',
    ];

    const userIsDoingTextOperation =
        ['a', 'v', 'x', 'c', 'z'].includes(event.key) && (event.ctrlKey || event.metaKey);

    const isPaste = event.key === 'v' && (event.ctrlKey || event.metaKey);

    if (isPaste) {
        return;
    }

    if (!validKeystrokes.includes(event.key) && !userIsDoingTextOperation) {
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

function handleInput() {
    const input = inputRef.value as HTMLInputElement;
    const cursorPosition = input.selectionStart as number;
    const separatorsToLeftOfCursor = getSeparatorsToLeftOfCursor(input.value, cursorPosition);
    const newValueNumerals = input.value.replace(/[^0-9]/g, '');

    if (newValueNumerals === '') {
        input.value = '';
    } else {
        input.value = Number(newValueNumerals).toLocaleString();
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
</script>

<template>
<div class="c-integer-input">
    <div class="o-text--small u-text--link-color text-right">Test</div>

    <input
        ref="inputRef"
        type="text"
        inputmode="numeric"
        pattern="[0-9]*"
        @keydown="handleKeydown"
        @input="handleInput"
    >
</div>
</template>

<style lang="scss">
.c-integer-input {
    width: max-content;

    &__input {
        width: 200px;
    }
}
</style>
