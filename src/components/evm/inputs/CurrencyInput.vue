<script lang="ts">
import { defineComponent } from 'vue';

import {
    getDecimalSeparatorForLocale,
    getLargeNumberSeparatorForLocale, getNumberFromLocalizedFormattedNumber,
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
    emits: [
        'update:modelValue',
    ],
    computed: {
        inputElement(): HTMLInputElement {
            return this.$refs.input as HTMLInputElement;
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

            if (this.isRequired && this.inputElement.value === '') {
                return 'This field is required'; // eztodo i18n
            }

            if (+this.inputElement.value < 0) {
                return 'Value must be positive'; // eztodo i18n
            }

            const numberOfDecimalPlaces = getNumberOfDecimalPlaces(this.inputElement.value, this.locale);

            if (numberOfDecimalPlaces > this.decimals) {
                return `Maximum precision is ${this.decimals}`;  // eztodo i18n
            }

            return '';
        },
        leadingZeroesRegex(): RegExp {
            const leadingZeroesPattern = `^0+(?!$|\\${this.decimalSeparator})`;
            return new RegExp(leadingZeroesPattern, 'g');
        },
        notIntegerOrSeparatorRegex(): RegExp {
            const notIntegerOrSeparatorPattern = `[^\\d${this.decimalSeparator}${this.largeNumberSeparator}]`;
            return new RegExp(notIntegerOrSeparatorPattern, 'g');
        },
        notIntegerOrDecimalSeparatorRegex(): RegExp {
            const notIntegerOrDecimalSeparatorPattern = `[^\\d${this.decimalSeparator}]`;
            return new RegExp(notIntegerOrDecimalSeparatorPattern, 'g');
        },
        largeNumberSeparatorRegex(): RegExp {
            return new RegExp(`[${this.largeNumberSeparator}]`, 'g');
        },
        decimalSeparatorRegex(): RegExp {
            return new RegExp(`[${this.decimalSeparator}]`, 'g');
        },
    },
    watch: {
        modelValue(newValue: number, oldValue: number) {
            if (newValue !== oldValue) {
                this.setInputValue(
                    this.prettyPrintNumber(newValue.toString()),
                );
                this.handleInput();
            }
        },
        locale() {
            this.setInputValue(
                this.prettyPrintNumber(this.modelValue.toString()),
            );
            this.handleInput();
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

            const emit = (val: number) => {
                if (val !== this.modelValue) {
                    this.$emit('update:modelValue', val);
                }
            };

            // strip leading zeroes and invalid characters
            this.setInputValue(
                String(this.inputElement.value)
                    .replace(this.leadingZeroesRegex, '')
                    .replace(this.notIntegerOrSeparatorRegex, ''),
            );

            // if input element value is zero-ish, emit 0
            if (['', null, undefined, '0', zeroWithDecimalSeparator, this.decimalSeparator].includes(this.inputElement.value)) {
                // if the user types a decimal separator in a blank input, add a zero before the separator
                if (this.inputElement.value === this.decimalSeparator) {
                    this.setInputValue(zeroWithDecimalSeparator);
                }

                emit(0);
                return;
            }

            // save caret position and number of large number separators (e.g. comma or dot) for later
            let caretPosition = this.inputElement.selectionStart || 0;
            const savedLargeNumberSeparatorCount = (this.inputElement.value.match(this.largeNumberSeparatorRegex) || []).length;

            // remove extraneous decimal separators not handled in keydownHandler (i.e. from pasted values)
            if ((this.inputElement.value?.match(this.decimalSeparatorRegex) ?? []).length > 1) {
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

            // workingValue is a simplified version of the input element's value, used for easier manipulation
            // e.g. if input value === '123.456.789,001', working value === '123546789.001'
            let workingValue = getNumberFromLocalizedFormattedNumber(
                this.inputElement.value ?? '0',
                this.locale,
            ).toString();

            // if user has typed a number larger than the max value, set input to max value
            if (!!this.maxValue && +workingValue > this.maxValue) {
                workingValue = this.maxValue.toString();
                caretPosition = workingValue.length;
                // this.triggerWiggle(); eztodo
            }

            // re-formatted working value, e.g. '123,456.789'
            const formattedWorkingValue = this.prettyPrintNumber(workingValue);

            this.setInputValue(formattedWorkingValue);

            // get information needed to preserve user caret position in case commas/dots are added/removed
            const newLargeNumberSeparatorCount = (
                this.inputElement.value.match(this.notIntegerOrDecimalSeparatorRegex) ?? []
            ).length;
            const deltaLargeNumberSeparatorCount = newLargeNumberSeparatorCount - savedLargeNumberSeparatorCount;

            this.setInputCaretPosition(caretPosition + deltaLargeNumberSeparatorCount);

            const valueAsNumber = getNumberFromLocalizedFormattedNumber(this.inputElement.value, this.locale);
            emit(valueAsNumber);
        },
        handleKeydown(event: KeyboardEvent) {
            const numKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
            const modifierKeys: ['ctrlKey', 'metaKey', 'shiftKey', 'altKey'] = ['ctrlKey', 'metaKey', 'shiftKey', 'altKey'];

            const validKeystrokes = [
                ...numKeys,
                ...modifierKeys,
                this.decimalSeparator,
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

            if (!validKeystrokes.includes(event.key) && !userIsDoingTextOperation) {
                event.preventDefault();
                return;
            }

            const value = this.inputElement.value;
            const caretPosition = this.inputElement.selectionStart ?? 0;
            const pressedKey = event.key;

            const eventHasModifiers = modifierKeys.some(modifier => event[modifier]);
            const targetHasNoSelection = caretPosition === this.inputElement.selectionEnd;
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
                const indexOfDecimalSeparator = value.indexOf(this.decimalSeparator);
                const firstPart  = value.slice(0, indexOfDecimalSeparator);
                const secondPart = value.slice(indexOfDecimalSeparator + 1);

                this.setInputValue(firstPart.concat(secondPart));
            } else if (deletingForward && nextCharacterIsLargeNumberSeparator) {
                const preSeparatorInclusive = value.slice(0, caretPosition + 1);
                const newPostSeparator      = value.slice(caretPosition + 2);

                this.setInputValue(preSeparatorInclusive.concat(newPostSeparator));
            } else if (deletingBackward && previousCharacterIsLargeNumberSeparator) {
                const newPreSeparator        = value.slice(0, caretPosition - 2);
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
                const indexOfDecimalSeparator = value.indexOf(this.decimalSeparator);
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
        prettyPrintNumber(numberString: string) {
            // this method takes a plain number string and adds in localized separators
            // e.g. '123456.789' => '123,456.789' for de-DE
            const indexOfDot = numberString.indexOf('.');
            let decimal = '';
            let integer = '';

            if (indexOfDot > -1) {
                integer = numberString.slice(0, numberString.indexOf(this.decimalSeparator));
                decimal = this.decimalSeparator.concat(numberString.slice(indexOfDot + 1, numberString.length));
            } else {
                integer = numberString;
            }

            const formattedInteger = prettyPrintCurrency(+integer, 0, this.locale);

            return formattedInteger.concat(decimal);
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
