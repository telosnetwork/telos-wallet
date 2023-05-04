<script lang="ts">
import { defineComponent, PropType } from 'vue';

import {
    getDecimalSeparatorForLocale,
    getLargeNumberSeparatorForLocale,
    getBigNumberFromLocalizedNumberString,
    prettyPrintCurrency, convertCurrency, invertFloat,
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
            type: [BigNumber, Number] as PropType<BigNumber | number>,
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
        secondaryCurrencyConversionFactor: {
            // pertains to the optional 'swap' amount under the input.
            // only needed when there is a swappable secondary value, ignored otherwise.
            // this represents the conversion factor between the primary and secondary amounts,
            // e.g. if 1 TLOS = 0.20 USD, and the modelValue is in TLOS, the conversion factor is 0.20
            type: [String, Number],
            default: null,
        },
        secondaryCurrencySymbol: {
            // symbol used for the secondary currency
            type: String,
            default: '',
        },
        secondaryCurrencyDecimals: {
            // the number of decimals used for the secondary currency. Leave undefined / value is ignored for fiat.
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
        maxValue: { // eztodo include number.max integer for fiat
            type: [BigNumber, Number] as PropType<BigNumber | number>,
            default: null,
        },
    },
    emits: [
        'update:modelValue',
    ],
    data: () => ({
        swapIcon: require('src/assets/icon--swap.svg'),
        swapCurrencies: false, // whether the user has clicked the swap button
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
        isFiat() {
            return !(this.modelValue instanceof BigNumber);
        },
        hasSwappableCurrency() {
            return !!this.secondaryCurrencyConversionFactor && !!this.secondaryCurrencySymbol;
        },
        secondaryCurrencyIsFiat() {
            return this.hasSwappableCurrency && this.secondaryCurrencyDecimals === null;
        },
        secondaryCurrencyAmount(): BigNumber | number {
            if (!this.hasSwappableCurrency) {
                return BigNumber.from(0);
            }

            if (this.secondaryCurrencyIsFiat && typeof this.modelValue === 'number') {
                // two fiat values
                // eztodo this
                // return this.secondaryCurrencyConversionFactor * Number(this.modelValue);
                const converted = convertCurrency(
                    parseUnits(this.modelValue.toString(), 2),
                    2,
                    2,
                    this.secondaryCurrencyConversionFactor,
                );

                return +formatUnits(converted, 2);
            } else if (this.secondaryCurrencyIsFiat && this.modelValue instanceof BigNumber) {
                const converted = convertCurrency(
                    this.modelValue as BigNumber,
                    this.decimals,
                    2,
                    this.secondaryCurrencyConversionFactor,
                );

                return +formatUnits(converted, 2);
            } else if (!this.secondaryCurrencyIsFiat && typeof this.modelValue === 'number') {
                const modelAsBigNumber = parseUnits(this.modelValue.toString(), 2);
                return convertCurrency(
                    modelAsBigNumber,
                    2,
                    this.secondaryCurrencyDecimals,
                    this.secondaryCurrencyConversionFactor,
                );
            } else {
                // !this.secondaryCurrencyIsFiat && this.modelValue instanceof BigNumber
                return convertCurrency(
                    this.modelValue as BigNumber,
                    this.decimals,
                    this.secondaryCurrencyDecimals,
                    this.secondaryCurrencyConversionFactor,
                );
            }
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

                if (!this.secondaryCurrencyIsFiat) {
                    amount = prettyPrintCurrency(this.secondaryCurrencyAmount, 4, this.locale, false, undefined, undefined, this.secondaryCurrencyDecimals);
                } else {
                    amount = prettyPrintCurrency(this.secondaryCurrencyAmount, 2, this.locale);
                }
            } else {
                symbol = this.symbol;

                if (this.modelValue instanceof BigNumber) {
                    amount = prettyPrintCurrency(this.modelValue, 4, this.locale, false, undefined, undefined, this.decimals);
                } else {
                    amount = prettyPrintCurrency(this.modelValue, 2, this.locale);
                }
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

            const modelValueIsZero = this.modelValue instanceof BigNumber ? this.modelValue.isZero() : this.modelValue === 0;
            if (this.isRequired && modelValueIsZero) {
                return 'This field is required'; // eztodo i18n
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
            return invertFloat(this.secondaryCurrencyConversionFactor);
        },
        prettyMaxValue() {
            let symbol: string;
            let amount: string;

            if (this.swapCurrencies) {
                const precision = this.secondaryCurrencyIsFiat ? 2 : 4;
                const maxValueBn = this.maxValue instanceof BigNumber ? this.maxValue : parseUnits(this.maxValue.toString(), this.decimals ?? 2);
                const maxValueInSecondaryCurrency = convertCurrency(
                    maxValueBn,
                    this.decimals ?? 2,
                    this.secondaryCurrencyDecimals ?? 2,
                    this.secondaryCurrencyConversionFactor,
                );

                amount = prettyPrintCurrency(maxValueInSecondaryCurrency, precision, this.locale, false, undefined, undefined, this.secondaryCurrencyDecimals ?? 2);
                symbol = this.secondaryCurrencySymbol;
            } else {
                const precision = this.isFiat ? 2 : 4;
                amount = prettyPrintCurrency(this.maxValue, precision, this.locale, false, undefined, undefined, this.decimals ?? 2);
                symbol = this.symbol;
            }

            return `${amount} ${symbol} Available`; // eztodo i18n
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
                    // if the modelValue is a number, the user has deleted the last character before a decimal if
                    // the input value is equal to the modelValue plus a decimal separator
                    const newValueAsString = newValue.toString();
                    const inputValue = this.inputElement.value;
                    const lastCharacterOfInputIsDecimalSeparator = inputValue[inputValue.length - 1] === this.decimalSeparator;
                    const newValueIsEqualToInputValueWithDecimalSeparator = inputValue === `${newValueAsString}${this.decimalSeparator}`;

                    if (lastCharacterOfInputIsDecimalSeparator && newValueIsEqualToInputValueWithDecimalSeparator) {
                        shouldSkipFormattingAndEmitting = true;
                    }
                }

                if (!shouldSkipFormattingAndEmitting) {
                    let newInputValue: string;
                    const decimalsToShow = this.getNumberOfDecimalsToShow(newValue);

                    if (this.swapCurrencies) {
                        const newValueBn = newValue instanceof BigNumber ? newValue : parseUnits(newValue.toString(), this.decimals ?? 2);

                        const newValueInSecondaryCurrency = convertCurrency(
                            newValueBn,
                            this.decimals ?? 2,
                            this.secondaryCurrencyDecimals ?? 2,
                            this.secondaryCurrencyConversionFactor,
                        );

                        newInputValue = prettyPrintCurrency(newValueInSecondaryCurrency, decimalsToShow, this.locale, false, undefined, undefined, this.secondaryCurrencyDecimals ?? 2, true);
                    } else {
                        newInputValue = prettyPrintCurrency(newValue, decimalsToShow, this.locale, false, undefined, undefined, this.decimals ?? 2, true);
                    }

                    this.setInputValue(newInputValue);
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
        swapCurrencies(showSecondaryCurrency: boolean) {
            let newInputValue: string;

            if (showSecondaryCurrency) {
                const decimalsToShow = this.secondaryCurrencyIsFiat ? 2 : 4;
                newInputValue = prettyPrintCurrency(this.secondaryCurrencyAmount, decimalsToShow, this.locale, false, undefined, undefined, this.secondaryCurrencyDecimals ?? 2);
            } else {
                const decimalsToShow = this.isFiat ? 2 : 4;
                newInputValue = prettyPrintCurrency(this.modelValue, decimalsToShow, this.locale, false, undefined, undefined, this.decimals ?? 2);
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

            const emit = (val: BigNumber | number) => {
                let newValIsDifferent: boolean;

                if (this.swapCurrencies) {
                    // val is the secondary currency amount; convert to primary currency and check against modelValue
                    const modelValueAsBigNumber = this.modelValue instanceof BigNumber ? this.modelValue : parseUnits(this.modelValue.toString(), this.decimals ?? 2);
                    const newSecondaryAmountAsBigNumber = val instanceof BigNumber ? val : parseUnits(val.toString(), this.secondaryCurrencyDecimals ?? 2);

                    console.log(modelValueAsBigNumber.toString());
                    // eztodo consolidate with below
                    const newSecondaryConvertedToPrimary = convertCurrency(newSecondaryAmountAsBigNumber, this.secondaryCurrencyDecimals ?? 2, this.decimals ?? 2, this.secondaryToPrimaryConversionRate);
                    console.log(newSecondaryConvertedToPrimary.toString());
                    console.log('\n\n');

                    // console.log(newSecondaryConvertedToPrimary.toString());

                    newValIsDifferent = !modelValueAsBigNumber.eq(newSecondaryConvertedToPrimary);
                    // console.log(newValIsDifferent);
                } else {
                    const newValIsBigNumber = val instanceof BigNumber;
                    newValIsDifferent = newValIsBigNumber ? !val.eq(this.modelValue) : val !== this.modelValue;
                }

                if (newValIsDifferent) {
                    if (this.swapCurrencies) {
                        // val is the secondary currency amount; convert to primary currency and emit
                        const valueBn = val instanceof BigNumber ? val : parseUnits(val.toString(), this.secondaryCurrencyDecimals ?? 2);
                        const secondaryConvertedToPrimary = convertCurrency(valueBn, this.secondaryCurrencyDecimals ?? 2, this.decimals ?? 2, this.secondaryToPrimaryConversionRate);

                        // console.log(valueBn.toString());

                        let emitValue;

                        if (this.modelValue instanceof BigNumber) {
                            emitValue = secondaryConvertedToPrimary;
                        } else {
                            emitValue = parseFloat(formatUnits(secondaryConvertedToPrimary, this.decimals ?? 2));
                        }

                        this.$emit('update:modelValue', emitValue);
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
                let valueString: string;

                if (this.swapCurrencies) {
                    valueString = this.secondaryCurrencyIsFiat ? this.secondaryCurrencyAmount.toString() : formatUnits(this.secondaryCurrencyAmount, this.secondaryCurrencyDecimals ?? 2);
                } else {
                    valueString = this.isFiat ? this.modelValue.toString() : formatUnits(this.modelValue, this.decimals);
                }

                const isDeletingLastCharacterAfterDecimal = this.inputElement.value.length === valueString.length - 1;

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

            let newValue: BigNumber | number;

            // eztodo comment for this block
            // eztodo disable maxamount and swap buttons if disabled or readonly; style text too
            if (this.swapCurrencies) {
                if (!this.secondaryCurrencyIsFiat) {
                    newValue = getBigNumberFromLocalizedNumberString(this.inputElement.value, this.secondaryCurrencyDecimals, this.locale);
                } else {
                    newValue = Number(this.inputElement.value.replace(this.largeNumberSeparatorRegex, ''));
                }
            } else {
                if (!this.isFiat) {
                    newValue = getBigNumberFromLocalizedNumberString(this.inputElement.value, this.decimals, this.locale);
                } else {
                    newValue = Number(this.inputElement.value.replace(this.largeNumberSeparatorRegex, ''));
                }
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

                if (this.swapCurrencies) {
                    maxDecimals = this.secondaryCurrencyIsFiat ? 2 : this.secondaryCurrencyDecimals;
                } else {
                    maxDecimals = this.isFiat ? 2 : this.decimals;
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
            let formattedMaxValue: string;

            if (this.swapCurrencies) {
                const precision = this.getNumberOfDecimalsToShow(this.secondaryCurrencyAmount);
                const decimals = this.secondaryCurrencyIsFiat ? 2 : this.secondaryCurrencyDecimals;
                const maxValueBn = this.maxValue instanceof BigNumber ? this.maxValue : parseUnits(this.maxValue.toString(), this.decimals ?? 2);
                const maxValueInSecondaryCurrency = convertCurrency(maxValueBn, this.decimals ?? 2, this.secondaryCurrencyDecimals ?? 2, this.secondaryCurrencyConversionFactor);
                formattedMaxValue = prettyPrintCurrency(maxValueInSecondaryCurrency, precision, this.locale, false, undefined, undefined, decimals, true);
            } else {
                const precision = this.getNumberOfDecimalsToShow(this.maxValue);
                const decimals = this.isFiat ? undefined : (this.decimals ?? 2);
                formattedMaxValue = prettyPrintCurrency(this.maxValue, precision, this.locale, undefined, undefined, undefined, decimals, true);
            }

            this.setInputValue(formattedMaxValue);
            this.handleInput();
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
        'c-currency-input--wiggle': false,
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
        <!--eztodo i18n-->
        <ToolTip :text="'Click to fill max amount'" :hide-icon="true">
            {{ prettyMaxValue }}
        </ToolTip>
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
    <div v-if="hasSwappableCurrency" class="c-currency-input__currency-switcher" @click="swapCurrencies = !swapCurrencies">
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
<!--    eztodo add conversion rate text-->
</div>

</template>

<style lang="scss">
.c-currency-input {
    --symbol-left: 28px;
    $this: &;

    width: 300px; // eztodo should this be different
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

    &--disabled {
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

        #{$this}--disabled & {
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
    }

    &__input {
        border: none;
        outline: none;
        background: none;
        margin-top: 24px;
    }
}
</style>
