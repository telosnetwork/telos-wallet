<script lang="ts">
import { defineComponent, PropType } from 'vue';

import {
    getDecimalSeparatorForLocale,
    getLargeNumberSeparatorForLocale,
    getBigNumberFromLocalizedNumberString,
    prettyPrintCurrency,
    convertCurrency,
    getFloatReciprocal,
} from 'src/antelope/stores/utils/currency-utils';
import { BigNumber } from 'ethers';
import { formatUnits, parseUnits } from 'ethers/lib/utils';
import ToolTip from 'components/ToolTip.vue';
import InlineSvg from 'vue-inline-svg';


export default defineComponent({
    name: 'CurrencyInput',
    inheritAttrs: false,
    components: {
        InlineSvg,
        ToolTip,
    },
    props: {
        modelValue: {
            // eztodo update this comment
            // eztodo add validators to decimals and stuff

            // if this is a BigNumber, the currency is treated as a token. Otherwise, it's treated as fiat.
            // note that modelValue always represents the primary currency,
            // e.g. if the modelValue (primary currency) is in TLOS, the emitted value will be the BigNumber amount of
            // TLOS (not the secondary currency, e.g. USD), even if the user has 'swapped' to enter USD
            // If the modelValue is a number, the primary currency is treated as fiat, and thus the emitted value will
            // always be a number (not a BigNumber).
            // This is to say that the 'swap' functionality does not change the behavior of modelValue, it only
            // changes the way the user sees and enters the value.
            // also note that the secondary currency may be either fiat or token, depending on the presence of
            // the secondaryCurrencyDecimals prop
            type: BigNumber as PropType<BigNumber>,
            required: true,
        },
        symbol: {
            type: String,
            required: true,
        },
        decimals: {
            // the number of decimals used for the token. Use 2 for fiat values
            type: Number,
            required: true,
        },
        secondaryCurrencyConversionFactor: {
            // pertains to the optional 'swap' amount under the input.
            // only needed when there is a swappable secondary value, ignored otherwise.
            // this represents the conversion factor between the primary and secondary amounts,
            // e.g. if 1 TLOS = 0.20 USD, and the modelValue is in TLOS, the conversion factor is 0.20
            // and to convert back from secondary to primary currency, (1 / secondaryCurrencyConversionFactor) is used
            type: [String, Number],
            default: null,
        },
        secondaryCurrencySymbol: {
            // symbol used for the secondary currency
            type: String,
            default: '',
        },
        secondaryCurrencyDecimals: {
            // the number of decimals used for the secondary currency. Use 2 for fiat values
            type: Number,
            default: null,
        },
        locale: {
            type: String,
            required: true,
        },
        label: {
            type: String,
            default: '',
        }, // eztodo make computed label text with asterisk if required?
        errorText: {
            type: String,
            default: '',
        },
        maxValue: {
            // eztodo comment here
            type: BigNumber as PropType<BigNumber>,
            default: null,
        },
    },
    emits: [
        'update:modelValue',
    ],
    data: () => ({
        swapIcon: require('src/assets/icon--swap.svg'),

        // whether the user has clicked the swap button
        swapCurrencies: false,

        // used to check if a new modelValue needs to be emitted when using a swappable currency.
        // this is needed because in many cases, the conversion factor from primary to secondary currency will result in
        // a non-terminating decimal amount of secondary currency being equivalent to the modelValue (primary currency amount),
        // e.g. 0.19 USD === 1 TLOS => 5.(263157894736842105) USD = 1 TLOS (parens indicate repeating decimal)
        // In these cases, there will be an infinite update loop as the logic to decide whether to emit relies on
        // comparing the secondary value converted to the primary value with the new modelValue (primary amount);
        // a small amount of precision is lost (by rounding) with every conversion (because non-terminating numbers cannot be
        // accurately stored in a variable), leading to inequality. This is the same reason that, when a user enters an
        // amount in a secondary currency, and the conversion rate from secondary to primary is non-terminating, we must pass
        // a rounded number to whatever service is being called. This rounding is accurate to 18 decimal places
        savedSecondaryValue: BigNumber.from(0),
    }),
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
            return [true, 'true', 'readonly'].includes(this .$attrs.readonly as string | boolean);
        },
        inputElementAttrs() {
            const attrs: Record<string, string> = {
                ...this.$attrs,
                disabled: 'disabled',
                readonly: 'readonly',
                required: 'required',
            };

            if (!this.isDisabled) {
                delete attrs.disabled;
            }

            if (!this.isReadonly) {
                delete attrs.readonly;
            }

            if (!this.isRequired) {
                delete attrs.required;
            }

            return attrs;
        },
        hasSwappableCurrency() {
            return !!this.secondaryCurrencyConversionFactor && !!this.secondaryCurrencySymbol && !!this.secondaryCurrencyDecimals;
        },
        secondaryCurrencyAmount(): BigNumber {
            if (!this.hasSwappableCurrency) {
                return BigNumber.from(0);
            }

            return convertCurrency(
                this.modelValue,
                this.decimals,
                this.secondaryCurrencyDecimals,
                this.secondaryCurrencyConversionFactor,
            );
        },
        prettySecondaryValue() {
            // eztodo abbreviate large values using viters function
            if (!this.hasSwappableCurrency) {
                return '';
            }

            let amount: string;
            let symbol: string;

            if (!this.swapCurrencies) {
                symbol = this.secondaryCurrencySymbol;

                amount = prettyPrintCurrency(
                    this.secondaryCurrencyAmount,
                    this.secondaryCurrencyDisplayPrecision,
                    this.locale,
                    false,
                    undefined,
                    undefined,
                    this.secondaryCurrencyDecimals,
                );

            } else {
                symbol = this.symbol;

                amount = prettyPrintCurrency(
                    this.modelValue,
                    this.primaryCurrencyDisplayPrecision,
                    this.locale,
                    false,
                    undefined,
                    undefined,
                    this.decimals,
                );
            }

            return `${amount} ${symbol}`;
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
            // eztodo only show error state if input is dirty
            // eztodo add validation rules?
            if (this.errorText) {
                return this.errorText;
            }

            if (this.isRequired && this.modelValue.isZero()) {
                return this.$t('global.required_field');
            }

            return '';
        },
        conversionRateText() {
            if (!this.hasSwappableCurrency) {
                return '';
            }

            return `@ ${this.secondaryCurrencyConversionFactor} ${this.secondaryCurrencySymbol} / ${this.symbol}`;
        },
        secondaryToPrimaryConversionRate(): string {
            // this.secondaryCurrencyConversionFactor is for converting primary to secondary; invert to convert
            return getFloatReciprocal(this.secondaryCurrencyConversionFactor);
        },
        prettyMaxValue() {
            if (!this.maxValue) {
                return '';
            }

            let symbol: string;
            let amount: string;

            if (this.swapCurrencies && this.hasSwappableCurrency) {
                const maxValueInSecondaryCurrency = convertCurrency(
                    this.maxValue,
                    this.decimals,
                    this.secondaryCurrencyDecimals,
                    this.secondaryCurrencyConversionFactor,
                );

                amount = prettyPrintCurrency(
                    maxValueInSecondaryCurrency,
                    this.secondaryCurrencyDisplayPrecision,
                    this.locale,
                    false,
                    undefined,
                    undefined,
                    this.secondaryCurrencyDecimals,
                );
                symbol = this.secondaryCurrencySymbol;
            } else {
                amount = prettyPrintCurrency(
                    this.maxValue,
                    this.primaryCurrencyDisplayPrecision,
                    this.locale,
                    false,
                    undefined,
                    undefined,
                    this.decimals,
                );
                symbol = this.symbol;
            }

            return `${amount} ${symbol} ${this.$t('global.available')}`;
        },
        primaryCurrencyDisplayPrecision() {
            // if the value represents fiat, show 2 decimals; else show 4
            return this.decimals === 2 ? 2 : 4;
        },
        secondaryCurrencyDisplayPrecision() {
            // if the value represents fiat, show 2 decimals; else show 4
            return this.secondaryCurrencyDecimals === 2 ? 2 : 4;
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
        modelValue(newValue: BigNumber, oldValue: BigNumber) {
            let newValueIsDifferent;

            if (this.swapCurrencies && this.hasSwappableCurrency) {
                newValueIsDifferent = !this.savedSecondaryValue.eq(newValue);
            } else {
                newValueIsDifferent = !newValue.eq(oldValue);
            }

            if (newValueIsDifferent) {
                // if user has just deleted the last character before the decimal separator,
                // convert modelValue to string and check if inputValue is equal to it plus a decimal separator
                // this is to prevent the decimal separator from being stripped if the user deletes the last character before it

                let shouldSkipFormattingAndEmitting = false;

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

                if (!shouldSkipFormattingAndEmitting) {
                    let newInputValue: string;

                    if (this.swapCurrencies && this.hasSwappableCurrency) {
                        const decimalsToShow = this.secondaryCurrencyDisplayPrecision;
                        const newValueInSecondaryCurrency = convertCurrency(
                            newValue,
                            this.decimals,
                            this.secondaryCurrencyDecimals,
                            this.secondaryCurrencyConversionFactor,
                        );

                        newInputValue = prettyPrintCurrency(
                            newValueInSecondaryCurrency,
                            decimalsToShow,
                            this.locale,
                            false,
                            undefined,
                            undefined,
                            this.secondaryCurrencyDecimals,
                            true,
                        );
                    } else {
                        const decimalsToShow = this.primaryCurrencyDisplayPrecision;
                        newInputValue = prettyPrintCurrency(
                            newValue,
                            decimalsToShow,
                            this.locale,
                            false,
                            undefined,
                            undefined,
                            this.decimals,
                            true,
                        );
                    }

                    this.setInputValue(newInputValue);
                    this.handleInput();
                }
            }
        },
        locale() {
            let formatted;

            if (this.swapCurrencies && this.hasSwappableCurrency) {
                formatted = prettyPrintCurrency(
                    this.secondaryCurrencyAmount,
                    this.secondaryCurrencyDisplayPrecision,
                    this.locale,
                    false,
                    undefined,
                    undefined,
                    this.secondaryCurrencyDecimals,
                    true,
                );
            } else {
                formatted = prettyPrintCurrency(
                    this.modelValue,
                    this.primaryCurrencyDisplayPrecision,
                    this.locale,
                    false,
                    undefined,
                    undefined,
                    this.decimals,
                    true,
                );
            }

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
        swapCurrencies(showSecondaryCurrency: boolean) {
            let newInputValue: string;

            if (showSecondaryCurrency) {
                newInputValue = prettyPrintCurrency(
                    this.secondaryCurrencyAmount,
                    this.secondaryCurrencyDisplayPrecision,
                    this.locale,
                    false,
                    undefined,
                    undefined,
                    this.secondaryCurrencyDecimals,
                );
            } else {
                newInputValue = prettyPrintCurrency(
                    this.modelValue,
                    this.primaryCurrencyDisplayPrecision,
                    this.locale,
                    false,
                    undefined,
                    undefined,
                    this.decimals,
                );
            }

            this.setInputValue(newInputValue);
        },
    },
    methods: {
        setInputValue(val: string): void {
            this.inputElement.value = val;

            // set the indent amount for the symbol label inside the input
            // 1's are 7px, other numbers are 8px, separators like commas are 2px
            const length = val.length;
            const numberOfSeparators = (val.match(this.largeNumberSeparatorRegex)?.length || 0) + (val.match(this.decimalSeparatorRegex)?.length || 0);
            const numberOfOnes = (val.match(/1/g) || []).length;
            const numberOfOtherNumbers = length - numberOfSeparators - numberOfOnes;
            const leftIndent = Math.ceil((numberOfOtherNumbers * 8.5) + (numberOfSeparators * 2) + (numberOfOnes * 7));

            // eztodo tweak this

            const leftAmount = length === 0 ? '28px' : `${leftIndent + 24}px`;
            this.$el.style.setProperty('--symbol-left', leftAmount);
        },
        setInputCaretPosition(val: number) {
            this.inputElement.selectionStart = val;
            this.inputElement.selectionEnd = val;
        },
        handleInput() {
            const zeroWithDecimalSeparator = `0${this.decimalSeparator}`;

            const emit = (val: BigNumber) => {
                let newValIsDifferent: boolean;

                if (this.swapCurrencies && this.hasSwappableCurrency) {
                    // val is the secondary currency amount; convert to primary currency and check against modelValue
                    const newSecondaryConvertedToPrimary = convertCurrency(
                        val,
                        this.secondaryCurrencyDecimals ?? 2,
                        this.decimals ?? 2,
                        this.secondaryToPrimaryConversionRate,
                    );
                    this.savedSecondaryValue = newSecondaryConvertedToPrimary;

                    newValIsDifferent = !this.modelValue.eq(newSecondaryConvertedToPrimary);
                } else {
                    newValIsDifferent = !val.eq(this.modelValue);
                }

                if (newValIsDifferent) {
                    if (this.swapCurrencies && this.hasSwappableCurrency) {
                        // val is the secondary currency amount; convert to primary currency and emit
                        const secondaryConvertedToPrimary = convertCurrency(
                            val,
                            this.secondaryCurrencyDecimals,
                            this.decimals,
                            this.secondaryToPrimaryConversionRate,
                        );

                        this.$emit('update:modelValue', secondaryConvertedToPrimary);
                    } else {
                        this.$emit('update:modelValue', val);
                    }
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

                emit(BigNumber.from(0));
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
                let valueString: string;

                if (this.swapCurrencies && this.hasSwappableCurrency) {
                    valueString = formatUnits(this.secondaryCurrencyAmount, this.secondaryCurrencyDecimals);
                } else {
                    valueString = formatUnits(this.modelValue, this.decimals);
                }

                const isDeletingLastCharacterAfterDecimal = this.inputElement.value.length === valueString.length - 1;

                if (isDeletingLastCharacterAfterDecimal) {
                    // eztodo should this decimals thing account for secondary?
                    const emitValue = getBigNumberFromLocalizedNumberString(this.inputElement.value, this.decimals, this.locale);
                    // if the user has deleted the last number after a decimal, the value should be emitted but
                    // no further formatting should occur
                    emit(emitValue);
                }

                return;
            }

            let newValue: BigNumber;

            // eztodo comment for this block
            // eztodo disable maxamount and swap buttons if disabled or readonly; style text too
            if (this.swapCurrencies && this.hasSwappableCurrency) {
                newValue = getBigNumberFromLocalizedNumberString(this.inputElement.value, this.secondaryCurrencyDecimals, this.locale);
            } else {
                newValue = getBigNumberFromLocalizedNumberString(this.inputElement.value, this.decimals, this.locale);
            }

            // get information needed to preserve user caret position in case commas/dots are added/removed
            const newLargeNumberSeparatorCount = (
                this.inputElement.value.match(this.notIntegerOrDecimalSeparatorRegex) ?? []
            ).length;
            const deltaLargeNumberSeparatorCount = newLargeNumberSeparatorCount - savedLargeNumberSeparatorCount;

            this.setInputCaretPosition(caretPosition + deltaLargeNumberSeparatorCount);

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

                let maxDecimals;

                if (this.swapCurrencies && this.hasSwappableCurrency) {
                    maxDecimals = this.secondaryCurrencyDecimals;
                } else {
                    maxDecimals = this.decimals;
                }

                const keypressIsDigit = numKeys.includes(event.key);
                const caretIsPastDecimal = caretPosition > integer.length + 1;
                const fractionalUnderMaxLength = fractional.length < maxDecimals;

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
        focusInput() {
            this.inputElement.focus();
        },
        fillMaxValue() {
            if (this.isDisabled || this.isReadonly) {
                return;
            }

            let formattedMaxValue: string;

            if (this.swapCurrencies && this.hasSwappableCurrency) {
                const maxValueInSecondaryCurrency = convertCurrency(
                    this.maxValue,
                    this.decimals,
                    this.secondaryCurrencyDecimals,
                    this.secondaryCurrencyConversionFactor,
                );
                formattedMaxValue = prettyPrintCurrency(
                    maxValueInSecondaryCurrency,
                    this.secondaryCurrencyDisplayPrecision,
                    this.locale,
                    false,
                    undefined,
                    undefined,
                    this.secondaryCurrencyDecimals,
                    true,
                );
            } else {
                formattedMaxValue = prettyPrintCurrency(
                    this.maxValue,
                    this.primaryCurrencyDisplayPrecision,
                    this.locale,
                    undefined,
                    undefined,
                    undefined,
                    this.decimals,
                    true,
                );
            }

            this.setInputValue(formattedMaxValue);
            this.handleInput();
        },
        handleSwapCurrencies() {
            if (!this.isReadonly && !this.isDisabled) {
                this.swapCurrencies = !this.swapCurrencies;
            }
        },
    },
});
</script>

<template>
<div
    :id="$attrs.id"
    :class="{
        [$attrs.class]: true,
        'c-currency-input': true,
        'c-currency-input--error': !!visibleErrorText,
        'c-currency-input--readonly': !!inputElementAttrs.readonly,
        'c-currency-input--disabled': !!inputElementAttrs.disabled,
    }"
    @click="focusInput"
>
    <div class="c-currency-input__label-text">
        {{ label.concat(isRequired ? '*' : '') }}
    </div>

    <div
        v-if="!!maxValue"
        class="c-currency-input__amount-available"
        @click="fillMaxValue"
    >
        <ToolTip v-if="!isDisabled && !isReadonly" :text="$t('evm_wallet.click_to_fill_max')" :hide-icon="true">
            {{ prettyMaxValue }}
        </ToolTip>
        <template v-else>
            {{ prettyMaxValue }}
        </template>
    </div>

    <div class="c-currency-input__symbol">
        {{ swapCurrencies ? secondaryCurrencySymbol : symbol }}
    </div>

    <input
        ref="input"
        v-bind="inputElementAttrs"
        :pattern="`${allowedCharactersRegex}*`"
        class="c-currency-input__input"
        type="text"
        placeholder="0"
        inputmode="decimal"
        @keydown="handleKeydown"
        @input.stop="handleInput"
    >
    <div v-if="hasSwappableCurrency" class="c-currency-input__currency-switcher" @click="handleSwapCurrencies">
        <InlineSvg
            :src="swapIcon"
            class="c-currency-input__swap-icon"
            aria-hidden="true"
        />
        {{ prettySecondaryValue }}
    </div>

    <div class="c-currency-input__error-text">
        {{ visibleErrorText }}
    </div>

    <div v-if="!visibleErrorText && conversionRateText" class="c-currency-input__conversion-rate">
        {{ conversionRateText }}
    </div>
</div>

</template>

<style lang="scss">
.c-currency-input {
    --symbol-left: 28px;
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

    &:hover:not(#{$this}--readonly):not(#{$this}--error) {
        border: 1px solid var(--text-color);
    }

    &:focus-within:not(#{$this}--readonly):not(#{$this}--error) {
        outline-color: $primary;
        border-color: transparent;

        #{$this}__label-text {
            color: $primary;
        }
    }

    &--disabled,
    &--readonly {
        cursor: not-allowed;
    }

    &--error {
        outline-color: $negative;
        border-color: transparent;

        #{$this}__label-text {
            color: $negative;
        }
    }

    &__label-text {
        position: absolute;
        top: 4px;
        color: var(--text-color-muted);
        font-size: 12px;
        transition: color 0.3s ease;
    }

    &__currency-switcher {
        position: absolute;
        top: 60px;
        left: 0;
        display: flex;
        align-items: center;
        gap: 4px;
        cursor: pointer;

        #{$this}--disabled &,
        #{$this}--readonly & {
            cursor: not-allowed;
            color: var(--text-color-muted);
        }
    }

    &__swap-icon {
        path {
            fill: $primary;
        }
    }

    &__error-text,
    &__conversion-rate {
        position: absolute;
        bottom: -24px;
        width: max-content;
        right: 0;
        text-align: right;
        font-size: 12px;
    }

    &__error-text {
        color: $negative;
    }

    &__conversion-rate {
        color: var(--text-color-muted);
    }

    &__symbol {
        font-size: 14px;
        position: absolute;
        top: 25px;
        left: var(--symbol-left);

        #{$this}--disabled &,
        #{$this}--readonly & {
            color: var(--text-color-muted);
        }
    }

    &__amount-available {
        position: absolute;
        top: -24px;
        left: 0;
        right: 0;
        text-align: right;
        cursor: pointer;
        color: $link-blue;
        font-size: 12px;
        font-weight: 400;
        line-height: 150%;

        #{$this}--disabled &,
        #{$this}--readonly &{
            cursor: not-allowed;
        }
    }

    &__input {
        border: none;
        outline: none;
        background: none;
        margin-top: 24px;
    }
}
</style>
