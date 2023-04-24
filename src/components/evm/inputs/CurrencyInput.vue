<script lang="ts">
import { defineComponent } from 'vue';

import { useUserStore } from 'src/antelope';
import {
    getDecimalSeparatorForLocale,
    getLargeNumberSeparatorForLocale,
    getNumberOfDecimalPlaces,
} from 'src/antelope/stores/utils/currency-utils';
import { prettyPrintCurrency } from 'src/antelope/stores/utils';

export default defineComponent({
    name: 'CurrencyInput',
    props: {
        modelValue: {
            type: Number,
            required: true,
        },
        locale: {
            type: String,
            required: true,
        },
        symbol: {
            type: String,
            required: true,
        },
        decimals: {
            type: Number,
            required: true,
        },
        label: {
            type: String,
            default: '',
        },
        errorText: {
            type: String,
            default: '',
        },
        maxValue: {
            type: Number,
            default: null,
        },
    },
    computed: {
        inputElement(): HTMLInputElement {
            return this.$refs.input as HTMLInputElement;
        },
        rawInputValue(): string {
            return this.inputElement.value;
        },
        isRequired(): boolean {
            return [true, 'true', 'required'].includes(this.$attrs.required as string | boolean);
        },
        isDisabled(): boolean {
            return [true, 'true', 'disabled'].includes(this.$attrs.disabled as string | boolean);
        },
        isReadonly(): boolean {
            return [true, 'true', 'readonly'].includes(this.$attrs.readonly as string | boolean);
        },
        allowedCharactersRegex(): string {
            const nonNumerics = `${this.largeNumberSeparator}${this.decimalSeparator}`;
            return `[0-9${nonNumerics}]`;
        },
        largeNumberSeparator() {
            return getLargeNumberSeparatorForLocale(this.locale);
        },
        decimalSeparator() {
            return getDecimalSeparatorForLocale(this.locale);
        },
        visibleErrorText(): string {
            if (this.errorText) {
                return this.errorText;
            }

            if (this.isRequired && this.rawInputValue === '') {
                return 'This field is required'; // eztodo i18n
            }

            if (+this.rawInputValue < 0) {
                return 'Value must be positive'; // eztodo i18n
            }

            const numberOfDecimalPlaces = getNumberOfDecimalPlaces(this.rawInputValue, this.locale);

            if (numberOfDecimalPlaces > this.decimals) {
                return `Maximum precision is ${this.decimals}`;  // eztodo i18n
            }

            return '';
        },
    },
    methods: {
        setInputValue(val: string): void {
            this.inputElement.value = val;
        },
        setInputCaretPosition(val: number) {
            this.inputElement.selectionStart = val;
            this.inputElement.selectionEnd = val;
        },
        handleInput() {
            const zeroWithDecimalSeparator = `0${this.decimalSeparator}`;

            const leadingZeroesPattern = `^0+(?!$|\\${this.decimalSeparator})`;
            const leadingZeroesRegex = new RegExp(leadingZeroesPattern, 'g');

            const notIntegerOrSeparatorPattern = `[^\\d${this.decimalSeparator}${this.largeNumberSeparator}]`;
            const notIntegerOrSeparatorRegex = new RegExp(notIntegerOrSeparatorPattern, 'g');

            const notIntegerOrDecimalSeparatorPattern = `[^\\d${this.decimalSeparator}]`;
            const notIntegerOrDecimalSeparatorRegex = new RegExp(notIntegerOrDecimalSeparatorPattern, 'g');

            const notIntegerOrLargeNumberSeparatorPattern = `[^\\d${this.largeNumberSeparator}]`;
            const notIntegerOrLargeNumberSeparatorRegex = new RegExp(notIntegerOrLargeNumberSeparatorPattern, 'g');

            const largeNumberSeparatorRegex = new RegExp(`[${this.largeNumberSeparator}]`, 'g');
            const decimalSeparatorRegex = new RegExp(`[${this.decimalSeparator}]`, 'g');

            const emit = (val: string) => {
                if (+val !== this.modelValue) {
                    this.$emit('update:modelValue', +val);
                }
            };

            // strip leading zeroes and invalid characters
            this.setInputValue(
                String(this.inputElement.value)
                    .replace(leadingZeroesRegex, '')
                    .replace(notIntegerOrSeparatorRegex, ''),
            );

            if (['', null, undefined, '0', zeroWithDecimalSeparator, this.decimalSeparator].includes(this.inputElement.value)) {
                if (this.inputElement.value === this.decimalSeparator) {
                    this.setInputValue(zeroWithDecimalSeparator);
                }

                emit('0');
                return;
            }

            let caretPosition = this.inputElement.selectionStart || 0;
            const savedCommaCount = (this.inputElement.value.match(largeNumberSeparatorRegex) || []).length;

            // remove extraneous decimal separators not handled in keydownHandler (i.e. from pasted values)
            if ((this.inputElement.value?.match(decimalSeparatorRegex) ?? []).length > 1) {
                const { value } = this.inputElement;
                const afterFirstDecimalSeparatorIndex = value.indexOf(this.decimalSeparator) + 1;
                const int = value.slice(0, afterFirstDecimalSeparatorIndex);
                const fractional = value.slice(afterFirstDecimalSeparatorIndex).replaceAll(this.decimalSeparator, '');
                this.setInputValue(int.concat(fractional));
            }

            // don't format or emit if the user is about to type a decimal
            if (
                this.inputElement.value[this.inputElement.value.length - 1] === this.decimalSeparator &&
                caretPosition === this.inputElement.value.length
            ) {
                return;
            }

            let workingValue = this.inputElement.value.replace(notIntegerOrDecimalSeparatorRegex, '') ?? '';

            if (!!this.maxValue && +workingValue > this.maxValue) {
                workingValue = this.maxValue.toString();
                caretPosition = workingValue.length;
                // this.triggerWiggle(); eztodo
            }

            // const decimals = getNumberOfDecimalPlaces(workingValue, this.locale);
            // let commifiedWorkingValue = prettyPrintCurrency(+workingValue, decimals, this.locale);
            const commifiedWorkingValue = workingValue;

            this.setInputValue(commifiedWorkingValue);

            const newCommaCount = (this.inputElement.value.match(notIntegerOrLargeNumberSeparatorRegex) ?? []).length;
            const deltaCommaCount = newCommaCount - savedCommaCount;

            this.setInputCaretPosition(caretPosition + deltaCommaCount);
            emit(this.rawInputValue);
        },
        handleKeydown(event: KeyboardEvent) {
            const input = (this.$refs.input as HTMLInputElement);

            const numKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
            const modifierKeys: ['ctrlKey', 'metaKey', 'shiftKey', 'altKey'] = ['ctrlKey', 'metaKey', 'shiftKey', 'altKey'];
            const value = input.value;
            const caretPosition = input.selectionStart ?? 0;
            const pressedKey = event.key;

            const eventHasModifiers = modifierKeys.some(modifier => event[modifier]);
            const targetHasNoSelection = caretPosition === input.selectionEnd;
            const deletingBackward = event.key === 'Backspace' && !eventHasModifiers && targetHasNoSelection;
            const deletingForward  = event.key === 'Delete'    && !eventHasModifiers && targetHasNoSelection;

            const nextCharacterIsLargeNumberSeparator     = value[caretPosition]     === this.largeNumberSeparator;
            const previousCharacterIsLargeNumberSeparator = value[caretPosition - 1] === this.largeNumberSeparator;
            const nextCharacterIsDecimalSeparator         = value[caretPosition]     === this.decimalSeparator;
            const previousCharacterIsDecimalSeparator     = value[caretPosition - 1] === this.decimalSeparator;

            const deletingDecimalSeparator = (deletingForward  && nextCharacterIsDecimalSeparator) ||
                (deletingBackward && previousCharacterIsDecimalSeparator);
            const deletingLargeNumberSeparator = (deletingForward  && nextCharacterIsLargeNumberSeparator) ||
                (deletingBackward && previousCharacterIsLargeNumberSeparator);

            if (deletingDecimalSeparator) {
                const indexOfDecimalSeparator = value.lastIndexOf(this.decimalSeparator);
                const firstPart = value.slice(0, indexOfDecimalSeparator);
                const secondPart = value.slice(indexOfDecimalSeparator + 1);

                this.setInputValue(firstPart.concat(secondPart));
            } else if (deletingForward && nextCharacterIsLargeNumberSeparator) {
                const preSeparatorInclusive = value.slice(0, caretPosition + 1);
                const newPostSeparator =      value.slice(caretPosition + 2);

                this.setInputValue(preSeparatorInclusive.concat(newPostSeparator));
            } else if (deletingBackward && previousCharacterIsLargeNumberSeparator) {
                const newPreSeparator =        value.slice(0, caretPosition - 2);
                const postSeparatorInclusive = value.slice(caretPosition - 1);

                this.setInputValue(newPreSeparator.concat(postSeparatorInclusive));
            }

            if (deletingDecimalSeparator || deletingLargeNumberSeparator) {
                this.setInputCaretPosition(caretPosition);
                event.preventDefault();
                this.handleInput();
                return;
            }

            const tryingToAddDigitsPastMaxPrecision = (() => {
                const indexOfDecimalSeparator = value.lastIndexOf(this.decimalSeparator);
                const integer = value.slice(0, indexOfDecimalSeparator);
                const fractional = value.slice(indexOfDecimalSeparator + 1);

                const keypressIsDigit = numKeys.includes(event.key);
                const caretIsPastDecimal = caretPosition > integer.length + 1;
                const fractionalUnderMaxLength = fractional.length < this.decimals;

                return keypressIsDigit && caretIsPastDecimal && !fractionalUnderMaxLength;
            })();

            const tryingToAddSecondDecimalSeparator = (() => {
                if (pressedKey !== this.decimalSeparator) {
                    return false;
                }

                // this is true for certain locales like those in India
                const decimalSeparatorIsAlsoLargeNumberSeparator = this.decimalSeparator === this.largeNumberSeparator;

                if (decimalSeparatorIsAlsoLargeNumberSeparator) {
                    // disallow user adding a decimal separator to the left of the existing one for locales like India
                    return value.indexOf(this.decimalSeparator) < caretPosition;
                }

                // for other locales, if decimal separator already exists in string, disallow adding another
                return value.includes(this.decimalSeparator);
            })();

            const tryingToAddLeadingZeroes =
                pressedKey === '0' &&
                value[0] !== this.decimalSeparator &&
                value.length > 1 &&
                caretPosition === 0;

            const invalidKeystroke =
                tryingToAddDigitsPastMaxPrecision ||
                tryingToAddSecondDecimalSeparator ||
                tryingToAddLeadingZeroes;

            if (invalidKeystroke) {
                event.preventDefault();
            }
        },
    },
});
</script>

<template>
<div class="c-currency-input">
    <input
        ref="input"
        :disabled="isDisabled"
        :readonly="isReadonly"
        class="c-currency-input__input"
        type="text"
        placeholder="0"
        :pattern="`${allowedCharactersRegex}*`"
        inputmode="decimal"
        @keydown="handleKeydown"
        @input.stop="handleInput"
    >
</div>

</template>

<style lang="scss">
.c-currency-input {
    max-width: 250px;
}
</style>
