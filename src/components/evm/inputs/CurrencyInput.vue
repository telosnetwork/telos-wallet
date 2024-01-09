<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { BigNumber } from 'ethers';
import { formatUnits, parseUnits } from 'ethers/lib/utils';

import { usePlatformStore } from 'src/antelope';
import {
    isPaste,
    modifierKeys,
    numKeys,
    userIsDoingTextOperation,
    validKeystrokes,
} from 'src/components/evm/inputs/input-helpers';

import InlineSvg from 'vue-inline-svg';

import {
    getDecimalSeparatorForLocale,
    getLargeNumberSeparatorForLocale,
    getBigNumberFromLocalizedNumberString,
    prettyPrintCurrency,
    convertCurrency,
    getFloatReciprocal,
} from 'src/antelope/stores/utils/currency-utils';
import ToolTip from 'components/ToolTip.vue';
import { truncateText } from 'src/antelope/stores/utils/text-utils';
import { debounce } from 'quasar';
import { MAX_UINT_256 } from 'src/antelope/types';

const platformStore = usePlatformStore();

export default defineComponent({
    name: 'CurrencyInput',
    inheritAttrs: false,
    components: {
        InlineSvg,
        ToolTip,
    },
    props: {
        modelValue: {
            // note that modelValue always represents the primary currency,
            // e.g. if the modelValue (primary currency) is in TLOS, the emitted value will be the BigNumber amount of
            // TLOS (not the secondary currency, e.g. USD), even if the user has 'swapped' to enter USD
            // This is to say that the 'swap' functionality does not change the behavior of modelValue, it only
            // changes the way the user sees and enters the value
            type: BigNumber as PropType<BigNumber>,
            required: true,
            validator: (val: BigNumber) => !val.isNegative(),
        },
        symbol: {
            type: String,
            required: true,
            validator: (value: string) => value !== '',
        },
        decimals: {
            // the number of decimals used for the token. Use 2 for fiat values
            type: Number,
            required: true,
            validator: (value: number) => value >= 0 && Number.isInteger(value),
        },
        name: {
            type: String,
            required: true,
            validator: (value: string) => value !== '',
        },
        decimalsToDisplay: {
            // the number of decimals to display in the input.
            type: Number,
            required: false,
            default: 4,
            validator: (value: number) => value >= 0 && Number.isInteger(value),
        },
        secondaryCurrencyConversionFactor: {
            // pertains to the optional 'swap' amount under the input. must be a float or a string representing a float.
            // only needed when there is a swappable secondary value, ignored otherwise.
            // this represents the conversion factor between the primary and secondary amounts,
            // e.g. if 1 TLOS = 0.20 USD, and the modelValue is in TLOS, the conversion factor is 0.20
            // and to convert back from secondary to primary currency, (1 / secondaryCurrencyConversionFactor) is used
            type: [String, Number],
            default: null,
            validator: (ratio: null | string | number) => ratio === null || (/^\d+(\.\d+)?$/g.test(ratio.toString())),
        },
        secondaryCurrencyCode: {
            // symbol used for the secondary currency
            type: String,
            default: '',
        },
        secondaryCurrencyDecimals: {
            // the number of decimals used for the secondary currency. Use 2 for fiat values
            type: Number,
            default: null,
            validator: (value: number) => value === null || (value >= 0 && Number.isInteger(value)),
        },
        locale: {
            type: String,
            required: true,
            validator: (value: string) => value !== '',
        },
        label: {
            type: String,
            required: true,
        },
        errorText: {
            type: String,
            default: '',
        },
        maxValue: {
            // represents the maximum amount that the user has available
            type: BigNumber as PropType<BigNumber | null>,
            default: null,
            validator: (val: BigNumber | null) => val === null || !val.isNegative(),
        },
        loading: {
            type: Boolean,
            default: false,
        },
        errorIfOverMax: {
            // if true, the input will show an error if the user enters a value greater than maxValue
            type: Boolean,
            default: false,
        },
    },
    emits: [
        'update:modelValue',
    ],
    data: () => ({
        swapIcon: require('src/assets/icon--swap.svg'),

        // whether the user has interacted with the input (pertains to validation)
        inputIsDirty: false,

        // whether the user has clicked the swap button
        swapCurrencies: false,

        // used to check if a new modelValue needs to be emitted when using a swappable currency.
        // note that it is an amount of secondary currency that has been converted to primary currency,
        // e.g. if primary is TLOS and secondary is USD, this amount is stored as an amount of TLOS
        //
        // this is needed because in many cases, the conversion factor from primary to secondary currency will result in
        // a non-terminating/irrational/extremely long decimal amount of secondary currency being equivalent to the
        // modelValue (primary currency amount),
        // e.g. 0.19 USD === 1 TLOS => 1 USD === 5.263157894736842105... TLOS
        // In these cases, there will be an infinite update loop because the logic to decide whether to emit relies on
        // comparing the new modelValue (primary currency) with the secondary value converted to the primary currency,
        // emitting only when the new value is not equal to the old value.
        // a small amount of precision is lost through rounding with every conversion (because these problematic numbers
        // cannot be accurately stored in a variable), leading to inequality where we would expect equality.
        // This rounding is accurate to 18 decimal places
        savedSecondaryValue: BigNumber.from(0),

        debouncedResizeListener: null as null | (() => void),
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
            return [true, 'true', 'readonly'].includes(this.$attrs.readonly as string | boolean);
        },
        inputElementAttrs() {
            const attrs: Record<string, string> = {
                ...this.$attrs,
                class: '',
                disabled: 'disabled',
                readonly: 'readonly',
                required: 'required',
            };

            delete attrs.class;

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
            return !!this.secondaryCurrencyConversionFactor && !!this.secondaryCurrencyCode && !!this.secondaryCurrencyDecimals;
        },
        currenciesAreSwapped() {
            return this.swapCurrencies && this.hasSwappableCurrency;
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
            if (!this.hasSwappableCurrency) {
                return '';
            }

            let amount: string;
            let symbol: string;
            const maxLength = 6;

            if (!this.swapCurrencies) {
                symbol = this.secondaryCurrencyCode;
                const truncate = formatUnits(
                    this.secondaryCurrencyAmount,
                    this.secondaryCurrencyDecimals,
                ).split('.')[0].length > maxLength;

                amount = prettyPrintCurrency(
                    this.secondaryCurrencyAmount,
                    this.secondaryCurrencyDisplayPrecision,
                    this.locale,
                    truncate,
                    undefined,
                    undefined,
                    this.secondaryCurrencyDecimals,
                );

            } else {
                symbol = this.symbol;

                const convertedAmount = convertCurrency(
                    this.secondaryCurrencyAmount,
                    this.secondaryCurrencyDecimals,
                    this.decimals,
                    this.secondaryToPrimaryConversionRate,
                );

                const truncate = formatUnits(
                    convertedAmount,
                    this.decimals,
                ).split('.')[0].length > maxLength;

                amount = prettyPrintCurrency(
                    convertedAmount,
                    this.primaryCurrencyDisplayPrecision,
                    this.locale,
                    truncate,
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
            if (this.errorText) {
                return this.errorText;
            }

            if (this.modelValue.gt(MAX_UINT_256)) {
                return this.$t('forms.errors.tooLarge');
            }

            if (this.errorIfOverMax && this.maxValue && this.maxValue.lt(this.modelValue)) {
                return this.$t('evm_wallet.amount_exceeds_available_balance');
            }

            if (this.isRequired && this.modelValue.isZero() && this.inputIsDirty) {
                return this.$t('global.required_field');
            }

            return '';
        },
        conversionRateText() {
            if (!this.hasSwappableCurrency) {
                return '';
            }

            // round conversion rate to 4 decimal places and trim trailing zeroes
            const roundedConversionRate = (+this.secondaryCurrencyConversionFactor)
                .toFixed(4)
                .replace(/0+$/g, '');

            return `@ ${roundedConversionRate} ${this.secondaryCurrencyCode} / ${this.symbol}`;
        },
        secondaryToPrimaryConversionRate(): string {
            if (!this.hasSwappableCurrency) {
                return '';
            }
            // this.secondaryCurrencyConversionFactor is for converting primary to secondary;
            // invert to convert secondary to primary
            return getFloatReciprocal(this.secondaryCurrencyConversionFactor);
        },
        prettyMaxValue() {
            if (!this.maxValue) {
                return '';
            }

            let symbol: string;
            let amount: string;

            if (this.currenciesAreSwapped) {
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
                symbol = this.secondaryCurrencyCode;
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
            // if the value represents fiat, show 2 decimals; else show this.decimalsToDisplay
            return this.decimals === 2 ? 2 : this.decimalsToDisplay;
        },
        secondaryCurrencyDisplayPrecision() {
            // if the value represents fiat, show 2 decimals; else show this.decimalsToDisplay
            return this.secondaryCurrencyDecimals === 2 ? 2 : this.decimalsToDisplay;
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
        isIOS() {
            return platformStore.isIOSMobile;
        },
        enableMaxValTooltip() {
            return !this.isDisabled && !this.isReadonly && !this.$q.screen.lt.md;
        },
        labelText() {
            const symbol = this.currenciesAreSwapped ? this.secondaryCurrencyCode : this.symbol;
            return this.label.concat(` (${symbol})`).concat(this.isRequired ? '*' : '');
        },
    },
    watch: {
        // as a refresher on modelValue, note that components implementing v-model do not update their own
        // value; they emit values to their parent, which then updates the component's value through the modelValue prop
        // So in this watcher, we must react to new values which could have been set programmatically by the parent,
        // or may simply be the result of user input
        modelValue(newValue: BigNumber, oldValue: BigNumber) {
            let newValueIsDifferent;

            if (this.currenciesAreSwapped) {
                // if the user has swapped currencies, we must compare the new modelValue (which is a primary currency
                // amount) to the saved secondary value (see note above by savedSecondaryValue declaration)
                if (this.maxValue && this.maxValue.eq(newValue)) {
                    // if the user has just filled the max value, the saved secondary value will still be that number
                    // converted to secondary currency, i.e. less accurate. In this case, update the saved secondary value
                    // to the actual maxValue
                    this.savedSecondaryValue = newValue;
                    newValueIsDifferent = false;
                } else {
                    newValueIsDifferent = !this.savedSecondaryValue.eq(newValue);
                }
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

                    if (this.currenciesAreSwapped) {
                        const newValueInSecondaryCurrency = convertCurrency(
                            newValue,
                            this.decimals,
                            this.secondaryCurrencyDecimals,
                            this.secondaryCurrencyConversionFactor,
                        );

                        const decimalsToShow = formatUnits(newValue, this.decimals).split('.')[1].length;

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
                        const decimalsToShow = this.decimalsToDisplay;
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

        // when the exchange rate changes and the user has swapped currencies, we must emit a new modelValue as the
        // value of the amount they've typed has changed
        secondaryCurrencyConversionFactor() {
            if (this.currenciesAreSwapped) {
                this.handleInput();
            }
        },

        // we must update the number formatting if the locale changes
        locale() {
            let formatted;

            if (this.currenciesAreSwapped) {
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

        // when the user swaps currencies, the input text must be updated to reflect the new currency
        // however the value has not actually changed, so nothing is emitted
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
    mounted() {
        if (!this.modelValue.isZero()) {
            const inputValue = prettyPrintCurrency(
                this.modelValue,
                this.decimalsToDisplay,
                this.locale,
                false,
                undefined,
                undefined,
                this.decimals,
                true,
            );

            this.setInputValue(inputValue);
        }
    },

    methods: {
        // this method sets the text in the input element, but is not responsible for emitting a new modelValue; these
        // may change independently of each other, like when the user swaps currencies
        setInputValue(val: string): void {
            if (!this.inputIsDirty) {
                this.inputIsDirty = true;
            }

            this.inputElement.value = val;
        },

        // this method sets the caret position in the input element
        setInputCaretPosition(val: number) {
            // prevent the input from taking focus when two or more CurrencyInputs use the same v-model (such as on the Staking page)
            // and this one is only used for displaying the value, rather than for user input
            if (!this.isReadonly) {
                this.inputElement.selectionStart = val;
                this.inputElement.selectionEnd = val;
            }
        },

        // this method is responsible for emitting a new modelValue, as well as performing certain formatting tasks
        // such as ensuring the user cannot paste invalid characters
        handleInput() {
            const zeroWithDecimalSeparator = `0${this.decimalSeparator}`;

            const emit = (val: BigNumber) => {
                let newValIsDifferent: boolean;

                if (this.currenciesAreSwapped) {
                    // val is the secondary currency amount; convert to primary currency and check against modelValue
                    const newSecondaryConvertedToPrimary = convertCurrency(
                        val,
                        this.secondaryCurrencyDecimals,
                        this.decimals,
                        this.secondaryToPrimaryConversionRate,
                    );
                    this.savedSecondaryValue = newSecondaryConvertedToPrimary;

                    newValIsDifferent = !this.modelValue.eq(newSecondaryConvertedToPrimary);
                } else {
                    newValIsDifferent = !val.eq(this.modelValue);
                }

                if (newValIsDifferent) {
                    if (this.currenciesAreSwapped) {
                        // val is the secondary currency amount; convert to primary currency and emit
                        const secondaryConvertedToPrimary = convertCurrency(
                            val,
                            this.secondaryCurrencyDecimals,
                            this.decimals,
                            this.secondaryToPrimaryConversionRate,
                        );

                        if (this.maxValue) {
                            const maxValueAsSecondary = convertCurrency(
                                this.maxValue,
                                this.decimals,
                                this.secondaryCurrencyDecimals,
                                this.secondaryCurrencyConversionFactor,
                            );
                            // this is needed because the conversion from primary to secondary currency is rounded;
                            // the new value (val) will not be precisely equal to maxValue even if the user has just
                            // filled in the max value into the input
                            const maxValueConvertedBackToPrimary = convertCurrency(
                                maxValueAsSecondary,
                                this.secondaryCurrencyDecimals,
                                this.decimals,
                                this.secondaryToPrimaryConversionRate,
                            );

                            if (maxValueConvertedBackToPrimary.eq(secondaryConvertedToPrimary)) {
                                // the new value to emit represents this.maxValue converted to secondary;
                                // we should emit this.maxValue rather than the converted value, which is less precise
                                this.$emit('update:modelValue', this.maxValue);
                            } else {
                                this.$emit('update:modelValue', secondaryConvertedToPrimary);
                            }
                        } else {
                            this.$emit('update:modelValue', secondaryConvertedToPrimary);
                        }
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

                if (this.currenciesAreSwapped) {
                    valueString = formatUnits(this.secondaryCurrencyAmount, this.secondaryCurrencyDecimals);
                } else {
                    valueString = formatUnits(this.modelValue, this.decimals);
                }

                const isDeletingLastCharacterAfterDecimal = this.inputElement.value.length === valueString.length - 1;

                if (isDeletingLastCharacterAfterDecimal) {
                    const decimals = this.currenciesAreSwapped ? this.secondaryCurrencyDecimals : this.decimals;
                    const emitValue = getBigNumberFromLocalizedNumberString(this.inputElement.value, decimals, this.locale);
                    // if the user has deleted the last number after a decimal, the value should be emitted but
                    // no further formatting should occur
                    emit(emitValue);
                }

                return;
            }

            let newValue: BigNumber;

            // ultimately the new modelValue is determined by the text which is in the input element
            if (this.currenciesAreSwapped) {
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

        // handle keydown events; contains logic for ensuring only valid characters can be typed, handling deletion of
        // decimal/large number separators, and other keystroke-related logic
        handleKeydown(event: KeyboardEvent) {
            if (isPaste(event)) {
                // paste logic is handled in handlePaste
                return;
            }

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

                if (this.currenciesAreSwapped) {
                    maxDecimals = this.secondaryCurrencyDecimals;
                } else {
                    maxDecimals = this.decimalsToDisplay;
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

        // handles pasting of text into the input
        handlePaste(event: ClipboardEvent) {
            const pastedData = event.clipboardData?.getData('text');
            event.preventDefault();

            if (!pastedData) {
                // pasted content is not text; ignore it
                return;
            }

            // strip all characters which are not numbers or a decimal separator
            let formattedInput = pastedData.replace(this.notIntegerOrDecimalSeparatorRegex, '');

            // ensure there is only one decimal separator by removing all but the last one
            const lastIndexOfDecimalSeparator = formattedInput.lastIndexOf(this.decimalSeparator);
            const beforeLastDecimalSeparator = formattedInput.slice(0, lastIndexOfDecimalSeparator).split(this.decimalSeparator).join('');
            const afterLastDecimalSeparator = formattedInput.slice(lastIndexOfDecimalSeparator);
            formattedInput = beforeLastDecimalSeparator + afterLastDecimalSeparator;

            if (formattedInput[0] === this.decimalSeparator) {
                formattedInput = '0' + formattedInput;
            }

            if (formattedInput[formattedInput.length - 1] === this.decimalSeparator) {
                formattedInput = formattedInput + '0';
            }

            if (!formattedInput) {
                // pasted content was not a number; ignore it
                this.setInputValue('');
            } else {
                const decimals = this.currenciesAreSwapped ? this.secondaryCurrencyDecimals : this.decimals;
                const formattedInputAsBigNumber = parseUnits(formattedInput, decimals);
                const pretty = prettyPrintCurrency(formattedInputAsBigNumber, this.decimals, this.locale, false, undefined, false, decimals, true);

                this.setInputValue(pretty);
            }

            this.handleInput();
        },

        // if the user has clicked into and then out of the input, the input is considered dirty
        handleBlur() {
            this.inputIsDirty = true;
        },

        // handle when the user clicks the maximum available amount above the input
        fillMaxValue() {
            if (this.isDisabled || this.isReadonly || !this.maxValue || this.maxValue.eq(this.modelValue)) {
                return;
            }

            let formattedMaxValue: string;

            // determine what text should be shown in the input; if the user has swapped currencies,
            // show the max value in the secondary currency
            if (this.currenciesAreSwapped) {
                const maxValueInSecondaryCurrency = convertCurrency(
                    this.maxValue,
                    this.decimals,
                    this.secondaryCurrencyDecimals,
                    this.secondaryCurrencyConversionFactor,
                );
                const currentDecimals = formatUnits(maxValueInSecondaryCurrency, this.secondaryCurrencyDecimals).split('.')[1].length;
                const maxValueDecimals = Math.min(currentDecimals, this.decimalsToDisplay);

                formattedMaxValue = prettyPrintCurrency(
                    maxValueInSecondaryCurrency,
                    maxValueDecimals,
                    this.locale,
                    false,
                    undefined,
                    undefined,
                    this.secondaryCurrencyDecimals,
                    true,
                );
            } else {
                const currentDecimals = formatUnits(this.maxValue, this.decimals).split('.')[1].length;
                const maxValueDecimals = Math.min(currentDecimals, this.decimalsToDisplay);

                formattedMaxValue = prettyPrintCurrency(
                    this.maxValue,
                    maxValueDecimals,
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

        // handle when the user clicks the secondary currency label under the input
        handleSwapCurrencies() {
            if (!this.isReadonly && !this.isDisabled) {
                this.swapCurrencies = !this.swapCurrencies;
            }
        },

        // focus the literal input element; may be useful to call from outside the component
        focusInput() {
            if (this.inputElement) {
                this.inputElement.focus();
            }
        },

        // can be called from outside the component to show an error state for empty input, e.g. when submitting form
        // without filling out required fields. Has no effect unless the component is set to required
        showEmptyError() {
            this.inputIsDirty = true;
        },

        // can be called from outside the component to remove the error state for empty input
        resetEmptyError() {
            this.$nextTick(() => {
                this.inputIsDirty = false;
            });
        },

        // utility to convert to string properties attrs typed as never
        asString(val: unknown): string {
            return val as string;
        },
    },
});
</script>

<template>
<div
    :id="asString($attrs.id)"
    :class="{
        [asString($attrs.class)]: !!$attrs.class,
        'c-currency-input': true,
        'c-currency-input--ios': isIOS,
        'c-text-input': true,
        'c-text-input--error-right': true,
        'c-text-input--error': !!visibleErrorText,
        'c-text-input--readonly': !!inputElementAttrs.readonly,
        'c-text-input--disabled': !!inputElementAttrs.disabled,
    }"
    @click="focusInput"
>
    <div
        v-if="!loading"
        :id="`currency-input-label--${name}`"
        class="c-text-input__label-text"
    >
        {{ labelText }}
    </div>

    <div
        v-if="!!maxValue && !loading"
        class="c-currency-input__amount-available"
        tabindex="0"
        role="button"
        :aria-label="$t('evm_wallet.click_to_fill_max')"
        @click="fillMaxValue"
        @keydown.space.enter.prevent="fillMaxValue"
    >
        <ToolTip v-if="enableMaxValTooltip" :text="$t('evm_wallet.click_to_fill_max')" :hide-icon="true">
            {{ prettyMaxValue }}
        </ToolTip>
        <template v-else>
            {{ prettyMaxValue }}
        </template>
    </div>

    <input
        v-show="!loading"
        ref="input"
        v-bind="inputElementAttrs"
        :pattern="`${allowedCharactersRegex}*`"
        class="c-text-input__input"
        type="text"
        placeholder="0"
        inputmode="decimal"
        :aria-labelledby="`currency-input-label--${name}`"
        @keydown="handleKeydown"
        @input.stop="handleInput"
        @blur="handleBlur"
        @paste="handlePaste"
    >
    <q-spinner
        v-show="loading"
        color="primary"
        size="md"
        class="c-currency-input__spinner"
    />

    <div
        v-if="hasSwappableCurrency && !loading"
        class="c-currency-input__currency-switcher"
        @click="handleSwapCurrencies"
    >
        <InlineSvg
            :src="swapIcon"
            class="c-currency-input__swap-icon"
            aria-hidden="true"
        />
        {{ prettySecondaryValue }}
    </div>

    <div v-if="!loading" class="c-text-input__error-text">
        {{ visibleErrorText }}
    </div>

    <div v-if="!visibleErrorText && conversionRateText && !loading" class="c-currency-input__conversion-rate">
        {{ conversionRateText }}
    </div>
</div>

</template>

<style lang="scss">
.c-currency-input {
    $this: &;

    &--ios {
        padding: 0 8px;

        #{$this}__symbol {
            top: 27px;
        }
    }

    &__spinner {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 16px;
        margin: auto;
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
            color: var(--text-low-contrast);
        }
    }

    &__swap-icon {
        path {
            fill: var(--accent-color);
        }
    }

    &__conversion-rate {
        @include text--small;

        color: var(--text-low-contrast);
        position: absolute;
        bottom: -24px;
        width: max-content;
        right: 0;
        text-align: right;
    }

    &__amount-available {
        @include text--small;

        position: absolute;
        top: -24px;
        right: 0;
        width: max-content;
        cursor: pointer;
        padding: 0 0 8px 8px; // make clickable area slightly larger
        color: var(--link-color);

        #{$this}--disabled &,
        #{$this}--readonly &{
            cursor: not-allowed;
        }
    }
}
</style>
