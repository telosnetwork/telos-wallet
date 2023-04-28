<script lang="ts">
import { defineComponent, PropType } from 'vue';

import {
    getDecimalSeparatorForLocale,
    getLargeNumberSeparatorForLocale,
    getBigNumberFromLocalizedNumberString,
    prettyPrintCurrency,
} from 'src/antelope/stores/utils/currency-utils';
import { BigNumber } from 'ethers';
import { formatUnits } from 'ethers/lib/utils';
import ToolTip from 'components/ToolTip.vue';


export default defineComponent({
    name: 'CurrencyInput',
    components: {
        ToolTip,
    },
    props: {
        modelValue: {
            // if this is a BigNumber, the currency is treated as a token. Otherwise, it's treated as fiat.
            type: [BigNumber, Number] as PropType<BigNumber | number>,
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
            // the number of decimals used for the token. Leave undefined / value is ignored for fiat.
            type: Number,
            default: null,
        },
        label: {
            type: String,
            default: '',
        }, // eztodo make computed label text with asterisk if required?
        errorText: {
            type: String,
            default: '',
        },
        maxValue: { // eztodo include number.max integer for fiat
            type: [BigNumber, Number] as PropType<BigNumber | number>,
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
            // if the input is required, a value of 0 is considered invalid
            return [true, 'true', 'required'].includes(this.$attrs.required as string | boolean);
        },
        isDisabled(): boolean {
            return [true, 'true', 'disabled'].includes(this.$attrs.disabled as string | boolean);
        },
        isReadonly(): boolean {
            return [true, 'true', 'readonly'].includes(this.$attrs.readonly as string | boolean);
        },
        isFiat() {
            return !(this.modelValue instanceof BigNumber);
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

            return '';
        },
        prettyMaxValue() {
            const precision = this.isFiat ? 2 : 4;
            const amount = prettyPrintCurrency(this.maxValue, precision, this.locale, false, undefined, undefined, this.decimals);

            return `${amount} ${this.symbol} Available`; // eztodo i18n
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
        modelValue(newValue: BigNumber | number, oldValue: BigNumber | number) {
            const newValueIsBigNumber = newValue instanceof BigNumber;
            const newValueIsDifferent = newValueIsBigNumber ? !newValue.eq(oldValue as BigNumber) : newValue !== oldValue;

            if (newValueIsDifferent) {
                // if user has just deleted the last character before the decimal separator
                // convert modelValue to string and check if inputValue is equal to it plus a decimal separator
                // this is to prevent the decimal separator from being stripped if the user deletes the last character before it

                let shouldSkipFormattingAndEmitting = false;

                if (newValue instanceof BigNumber) {
                    // formatUnits always adds a decimal separator and zero if input is an integer
                    // as such, the user has just deleted the last character before the decimal separator
                    // if the input value is equal to the modelValue (converted from BigNumber to a number string) plus a zero
                    const newValueAsString = formatUnits(newValue, this.decimals);
                    const inputValue = this.inputElement.value;
                    const lastCharacterOfInputIsDecimalSeparator = inputValue[inputValue.length - 1] === this.decimalSeparator;
                    const newValueIsEqualToInputValueWithZero = newValueAsString === `${inputValue}0`;

                    if (lastCharacterOfInputIsDecimalSeparator && newValueIsEqualToInputValueWithZero) {
                        shouldSkipFormattingAndEmitting = true;
                    }
                } else {
                    // if the modelValue is a number,
                    // the user has deleted the last character before a decimal if the input value is equal
                    // to the modelValue plus a decimal separator
                    const newValueAsString = newValue.toString();
                    const inputValue = this.inputElement.value;
                    const lastCharacterOfInputIsDecimalSeparator = inputValue[inputValue.length - 1] === this.decimalSeparator;
                    const newValueIsEqualToInputValueWithDecimalSeparator = inputValue === `${newValueAsString}${this.decimalSeparator}`;

                    if (lastCharacterOfInputIsDecimalSeparator && newValueIsEqualToInputValueWithDecimalSeparator) {
                        shouldSkipFormattingAndEmitting = true;
                    }
                }

                if (!shouldSkipFormattingAndEmitting) {
                    const decimalsToShow = this.getNumberOfDecimalsToShow(newValue);
                    const formatted = prettyPrintCurrency(newValue, decimalsToShow, this.locale, false, undefined, undefined, this.decimals, true);

                    this.setInputValue(formatted);
                    this.handleInput();
                }
            }
        },
        locale() {
            const decimalsToShow = this.getNumberOfDecimalsToShow(this.modelValue);
            const formatted = prettyPrintCurrency(this.modelValue, decimalsToShow, this.locale, false, undefined, undefined, this.decimals, true);

            this.setInputValue(formatted);
        },
        decimals(newValue: number, oldValue: number) {
            // eztodo review this
            const inputHasDecimal = this.inputElement.value.indexOf(this.decimalSeparator) > -1;
            if (newValue < oldValue && inputHasDecimal) {
                let [integer, fraction] = this.inputElement.value.split(this.decimalSeparator);
                fraction = fraction.slice(0, newValue);

                this.setInputValue(`${integer}${fraction ? this.decimalSeparator : ''}${fraction}`);
                this.handleInput();
            }
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

            const emit = (val: BigNumber | number) => {
                const newValIsBigNumber = val instanceof BigNumber;
                const newValIsDifferent = newValIsBigNumber ? !val.eq(this.modelValue) : val !== this.modelValue;

                if (newValIsDifferent) {
                    this.$emit('update:modelValue', val);
                }
            };

            // strip leading zeroes and invalid characters
            this.setInputValue(
                String(this.inputElement.value)
                    .replace(this.leadingZeroesRegex, '')
                    .replace(this.notIntegerOrSeparatorRegex, ''),
            );

            // save caret position and number of large number separators (e.g. comma or dot) for later
            let caretPosition = this.inputElement.selectionStart || 0;
            const savedLargeNumberSeparatorCount = (this.inputElement.value.match(this.largeNumberSeparatorRegex) || []).length;

            // if input element value is zero-ish, emit 0
            if (['', null, undefined, '0', zeroWithDecimalSeparator, this.decimalSeparator].includes(this.inputElement.value)) {
                // if the user types a decimal separator in a blank input, add a zero before the separator
                if (this.inputElement.value === this.decimalSeparator) {
                    this.setInputValue(zeroWithDecimalSeparator);
                }

                emit(this.isFiat ? 0 : BigNumber.from(0));
                return;
            }

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
                [this.decimalSeparator, '0'].includes(this.inputElement.value[this.inputElement.value.length - 1]) &&
                this.inputElement.value.indexOf(this.decimalSeparator) !== -1 &&
                caretPosition === this.inputElement.value.length
            ) {
                // handle scenario where the user has just deleted the last character after a decimal separator
                // in this case, eg. "123.4" => "123.", the value should be emitted but no further formatting should
                // occur so as not to strip the decimal separator
                const modelValueString = this.isFiat ? this.modelValue.toString() : formatUnits(this.modelValue, this.decimals);
                const isDeletingLastCharacterAfterDecimal = this.inputElement.value.length === modelValueString.length - 1;

                if (isDeletingLastCharacterAfterDecimal) {
                    const emitValue = this.isFiat
                        ? Number(this.inputElement.value.replaceAll(this.decimalSeparator, ''))
                        : getBigNumberFromLocalizedNumberString(this.inputElement.value, this.decimals, this.locale);
                    // if the user has deleted the last number after a decimal, the value should be emitted but
                    // no further formatting should occur
                    emit(emitValue);
                }

                return;
            }

            let formattedWorkingValue: string;
            let newValue: BigNumber | number;

            // eztodo maxvalue logic is not working at all
            if (!this.isFiat) {
                // workingValue is a simplified version of the input element's value, used for easier manipulation
                // e.g. if input value === '123.456.789,001', working value === '123546789.001'
                let valueBn = getBigNumberFromLocalizedNumberString(
                    this.inputElement.value ?? '0',
                    this.decimals,
                    this.locale,
                );

                // if user has typed a number larger than the max value, set input to max value
                if (!!this.maxValue && valueBn.gt(this.maxValue)) {
                    newValue = this.maxValue;
                    // caretPosition = formatUnits(valueBn).length; // eztodo this might be a problem
                    // this.triggerWiggle(); eztodo
                }

                // re-formatted working value, e.g. '123,456.789'
                const decimalsToShow = this.getNumberOfDecimalsToShow(valueBn);
                formattedWorkingValue = prettyPrintCurrency(valueBn, decimalsToShow, this.locale, false, undefined, undefined, this.decimals, true);
            } else {
                const valueAsNumber = Number(this.inputElement.value.replace(this.largeNumberSeparatorRegex, ''));

                // if user has typed a number larger than the max value, set input to max value
                if (!!this.maxValue && valueAsNumber > this.maxValue) {
                    newValue = this.maxValue;
                    // caretPosition = formatUnits(valueBn).length; // eztodo this might be a problem
                    // this.triggerWiggle(); eztodo
                }

                // re-formatted working value, e.g. '123,456.789'
                formattedWorkingValue = prettyPrintCurrency(valueAsNumber, 2, this.locale, false, undefined, undefined, undefined, true);
            }

            this.setInputValue(formattedWorkingValue);

            // get information needed to preserve user caret position in case commas/dots are added/removed
            const newLargeNumberSeparatorCount = (
                this.inputElement.value.match(this.notIntegerOrDecimalSeparatorRegex) ?? []
            ).length;
            const deltaLargeNumberSeparatorCount = newLargeNumberSeparatorCount - savedLargeNumberSeparatorCount;

            this.setInputCaretPosition(caretPosition + deltaLargeNumberSeparatorCount);

            if (this.isFiat) {
                newValue = Number(this.inputElement.value.replace(this.largeNumberSeparatorRegex, ''));
            } else {
                newValue = getBigNumberFromLocalizedNumberString(this.inputElement.value, this.decimals, this.locale);
            }

            emit(newValue);
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
                const fractionalUnderMaxLength = fractional.length < (this.isFiat ? 2 : this.decimals);

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
        getNumberOfDecimalsToShow(value: BigNumber | number) {
            const valueString = (typeof value === 'number' ? value.toString() : formatUnits(value, this.decimals));
            const fraction = valueString.split('.')[1];

            if (!fraction) {
                return 0;
            }

            let decimalsToShow: number;

            if (this.inputElement.value.indexOf(this.decimalSeparator) > -1 && fraction !== '0') {
                decimalsToShow = fraction.length;
            } else {
                decimalsToShow = 0;
            }

            return decimalsToShow;
        },
        focusInput() {
            this.inputElement.focus();
        },
        fillMaxValue() {
            const precision = this.getNumberOfDecimalsToShow(this.maxValue);
            const decimals = this.isFiat ? undefined : this.decimals;
            const formattedMaxValue = prettyPrintCurrency(this.maxValue, precision, this.locale, undefined, undefined, undefined, decimals, true);
            this.setInputValue(formattedMaxValue);
            this.handleInput();
        },
    },
});
</script>

<template>
<div
    :class="{
        'c-currency-input': true,
        'c-currency-input--error': !!visibleErrorText,
    }"
    @click="focusInput"
>
    <div class="c-currency-input__label-text">
        {{ label }}
    </div>

    <div
        v-if="!!maxValue"
        class="c-currency-input__amount-available"
        @click="fillMaxValue"
    >
        <!--eztodo i18n-->
        <ToolTip :text="'Click to fill max amount'" :hide-icon="true">
            {{ prettyMaxValue }}
        </ToolTip>
    </div>

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
    <div class="c-currency-input__error-text">
        {{ visibleErrorText }}
    </div>
</div>

</template>

<style lang="scss">
.c-currency-input {
    $this: &;

    width: 300px;
    height: 56px;
    padding: 0 12px;
    border-radius: 4px;
    border: 1px solid $grey-5;
    outline: 2px solid transparent;
    transition-property: outline-color, border-color;
    transition-duration: 0.3s;
    transition-timing-function: ease;
    position: relative;
    cursor: text;
    margin-top: 24px;

    &:hover {
        border: 1px solid var(--text-color);
    }

    &:focus-within {
        outline-color: $primary;
        border-color: transparent;
        //transition: outline-color 0.3s ease; //eztodo figure out how to fade this
        //border: 2px solid $primary;

        &#{$this}--error {
            outline-color: var(--negative-muted);

            #{$this}__label-text {
                color: var(--negative-muted);
            }
        }

        #{$this}__label-text {
            color: $primary;
        }
    }

    &__label-text {
        position: absolute;
        top: 4px;
        color: var(--text-color-muted);
        font-size: 12px;
        transition: color 0.3s ease;
    }

    &__amount-available {
        position: absolute;
        top: -24px;
        left: 0;
        right: 0;
        text-align: right;
        cursor: pointer;
    }

    &__input {
        border: none;
        outline: none;
        background: none;
        margin-top: 24px;
    }

}
</style>
