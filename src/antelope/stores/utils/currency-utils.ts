// eztodo jsdocs, tests

import { BigNumber } from 'ethers';
import { parseUnits } from 'ethers/lib/utils';
import { formatUnits } from '@ethersproject/units';
import Decimal from 'decimal.js';

export function getDecimalSeparatorForLocale(locale: string) {
    const numberWithDecimalSeparator = 1.1;
    const formattedNumber = new Intl.NumberFormat(locale).format(numberWithDecimalSeparator);
    return formattedNumber.charAt(1); // Get the character between "1" and "1"
}

export function getLargeNumberSeparatorForLocale(locale: string) {
    const largeNumber = 1000000;
    const formattedNumber = new Intl.NumberFormat(locale).format(largeNumber);

    const nonDigitCharacters = formattedNumber.match(/\D+/g);

    if (!nonDigitCharacters || nonDigitCharacters.length === 0) {
        return '';
    }

    return nonDigitCharacters[0];
}

// export function convertFiatToTokens() {
//
// }
//
// export function convertTokensToFiat() {
//
// }
//
// export function convertTokensToTokens(sourceTokenAmount: BigNumber, sourceDecimals: number, destinationDecimals: number, conversionRate: number) {
//     const sourceAmount
// }

export function getBigNumberFromLocalizedNumberString(formatted: string, decimals: number, locale: string): BigNumber {
    const decimalSeparator = getDecimalSeparatorForLocale(locale);

    // strip any character which is not an integer or decimal separator
    const notIntegerOrSeparatorRegex = new RegExp(`[^0-9${decimalSeparator}]`, 'g');
    let unformatted = formatted.replace(notIntegerOrSeparatorRegex, '');

    // if the decimal separator is anything but a dot, replace it with a dot to allow conversion to number
    if (decimalSeparator !== '.') {
        unformatted = unformatted.replace(/[^0-9.]/g, '.');
    }

    return parseUnits(unformatted, decimals);
}


/*
* Formats a currency amount in a localized way
*
* @param {number|BigNumber} amount - the currency amount
* @param {number} precision - the number of decimals that should be displayed. Ignored if abbreviate is true and the value is over 1000
* @param {string} locale - user's locale code, e.g. 'en-US'. Generally gotten from the user store like useUserStore().locale
* @param {boolean} abbreviate - whether to abbreviate the value, e.g. 123456.78 => 123.46K. Ignored for values under 1000
* @param {string?} currency - code for the currency to be used, e.g. 'USD'. If defined, either the symbol or code (determined by the param displayCurrencyAsSymbol) will be displayed, e.g. $123.00 . Generally gotten from the user store like useUserStore().currency
* @param {boolean?} displayCurrencyAsCode - if currency is defined, controls whether the currency is display as a symbol or code, e.g. $100 or USD 100. Only valid for fiat currencies.
* @param {number?} tokenDecimals - required if amount is BigNumber. The number of decimals a token has, e.g. 18 for TLOS. This option is not used for non-BigNumber amounts
* @param {boolean?} trimZeroes - trim trailing zeroes for decimal values, e.g. '123.000' => '123', '123.45600' => '123.456'. Overrides 'precision' when there are trailing zeroes
* */
export function prettyPrintCurrency(
    amount: number | BigNumber,
    precision: number,
    locale: string,
    abbreviate = false,
    currency?: string,
    displayCurrencyAsCode?: boolean,
    tokenDecimals?: number,
    trimZeroes?: boolean,
) {
    if (precision % 1 !== 0 || precision < 0) {
        throw 'Precision must be a positive integer or zero';
    }

    if (typeof tokenDecimals === 'number' && (tokenDecimals % 1 !== 0 || tokenDecimals < 0)) {
        throw 'Token decimals must be a positive integer or zero';
    }

    // require token decimals if type is BigNumber
    if (typeof amount !== 'number' && typeof tokenDecimals !== 'number') {
        throw 'Token decimals is required for BigNumber amounts';
    }

    const decimalSeparator = getDecimalSeparatorForLocale(locale);
    const trailingZeroesRegex = new RegExp(`\\${decimalSeparator}?0+(\D|$)`, 'g');

    const decimalOptions : Record<string, number | undefined> = {
        maximumFractionDigits: precision,
        minimumFractionDigits: precision,
        minimumIntegerDigits: undefined,
        maximumIntegerDigits: undefined,
    };

    if (amount < 1 && amount > 0) {
        decimalOptions.maximumIntegerDigits = 1;
        decimalOptions.minimumIntegerDigits = 1;
    } else if (abbreviate) {
        const forceFractionDisplay = amount < 1000 && amount > -1000 ;

        decimalOptions.maximumFractionDigits = forceFractionDisplay ? precision : 2;
        decimalOptions.minimumFractionDigits = forceFractionDisplay ? precision : 2;
        decimalOptions.maximumIntegerDigits = 3;
    }

    const currencyOptions : Record<string, string | boolean | undefined> = {
        style: currency ? 'currency' : undefined,
        currencyDisplay: currency ? (displayCurrencyAsCode ? 'code' : 'symbol') : undefined,
        currency,
    };

    if (typeof amount === 'number') {
        let finalFormattedValue = Intl.NumberFormat(
            locale,
            {
                notation: abbreviate ? 'compact' : undefined,
                ...currencyOptions,
                ...decimalOptions,
            }).format(amount);

        if (trimZeroes && finalFormattedValue.indexOf(decimalSeparator) > -1) {
            finalFormattedValue = finalFormattedValue.replace(trailingZeroesRegex, '');
        }

        return finalFormattedValue;
    } else {
        // Intl format method only takes number / bigint, and a BigNumber value cannot have a fractional amount,
        // and also decimals may be more places than maximum JS precision.
        // As such, decimals must be handled specially for BigNumber amounts.

        const amountAsString = formatUnits(amount, tokenDecimals); // amount string, like "1.0"

        const [integerString, decimalString] = amountAsString.split('.');

        const formattedInteger = Intl.NumberFormat(
            locale,
            { notation: abbreviate ? 'compact' : undefined },
        ).format(BigInt(integerString));

        const formattedDecimal = decimalString.slice(0, tokenDecimals).padEnd(precision, '0');
        let finalFormattedValue;

        if (abbreviate) {
            finalFormattedValue = formattedInteger; // drop decimals for abbreviated amounts
        } else {
            finalFormattedValue = `${formattedInteger}${decimalSeparator}${formattedDecimal}`;
        }

        if (trimZeroes && finalFormattedValue.indexOf(decimalSeparator) > -1) {
            finalFormattedValue = finalFormattedValue.replace(trailingZeroesRegex, '');
        }

        if (currency) {
            finalFormattedValue += ` ${currency}`;
        }

        // debugger;

        return finalFormattedValue;
    }
}


// eztodo jsdocs
export function convertCurrency(tokenOneAmount: BigNumber, tokenOneDecimals: number, tokenTwoDecimals: number, conversionFactor: string | number) {
    const conversionRate = conversionFactor.toString();
    const leadingZeroesRegex = /^0+/g;
    const trailingZeroesRegex = /0+$/g;
    const floatRegex = /^\d+(\.\d+)?$/g;

    if (!Number.isInteger(tokenOneDecimals) || tokenOneDecimals <= 0) {
        throw 'Token one decimals must be a positive integer or zero';
    }

    if (!Number.isInteger(tokenTwoDecimals) || tokenTwoDecimals <= 0) {
        throw 'Token two decimals must be a positive integer or zero';
    }

    if (!floatRegex.test(conversionRate)) {
        throw 'Conversion rate must be a positive floating point number or integer';
    }

    if (tokenOneAmount.lt(0)) {
        throw 'Token one amount must be positive';
    }

    const tenBn = BigNumber.from(10);

    // represents the maximum significant figures of conversion calculations
    const precisionCutoffBn = BigNumber.from(256);

    const [rawConversionRateIntegers, rawConversionRateDecimals = ''] = conversionRate.split('.');
    const conversionRateIntegers = rawConversionRateIntegers.replace(leadingZeroesRegex, '');
    const conversionRateDecimals = rawConversionRateDecimals.replace(trailingZeroesRegex, '');

    const numberOfConversionRateDecimals = conversionRateDecimals.length;

    const conversionRateScalingFactor = BigNumber.from(numberOfConversionRateDecimals).add(precisionCutoffBn);
    const conversionRateAsIntegerString = conversionRateIntegers.concat((conversionRateDecimals ?? ''));

    const conversionRateBn = BigNumber.from(conversionRateAsIntegerString);
    const scaledConversionRate = conversionRateBn.mul(tenBn.pow(conversionRateScalingFactor));

    // normalize amount to 256 precision
    const normalizedAmount = tokenOneAmount.mul(tenBn.pow((precisionCutoffBn.sub(tokenOneDecimals))));

    // multiply amount by conversion rate integer
    const normalizedScaledAmountTwo = normalizedAmount.mul(scaledConversionRate);

    // denormalize from 256 precision to tokenTwoDecimals
    const denormalizedScaledAmountTwo = normalizedScaledAmountTwo.div(tenBn.pow((precisionCutoffBn.sub(tokenTwoDecimals))));

    // remove conversion rate scaling
    return denormalizedScaledAmountTwo.div(tenBn.pow(conversionRateScalingFactor.add(numberOfConversionRateDecimals)));
}

export function invertFloat(float: number | string) {
    const floatRegex = /^\d+(\.\d+)?$/g;
    const trailingZeroesRegex = /0+$/g;
    const trailingDotRegex = /\.$/g;

    if (!floatRegex.test(float.toString())) {
        throw 'Conversion rate must be a positive floating point number or integer';
    }

    if ([0, '0'].includes(float)) {
        throw 'Error inverting: cannot divide by zero';
    }

    return new Decimal(1)
        .dividedBy(float)
        .toFixed(18)
        .replace(trailingZeroesRegex, '')
        .replace(trailingDotRegex, '');
}

export function roundCurrency(num: BigNumber, decimals: number, precision = 4) {
    if (!Number.isInteger(decimals) || decimals <= 0) {
        throw 'Decimals must be a positive integer or zero';
    }

    if (!Number.isInteger(precision) || precision <= 0) {
        throw 'Decimals must be a positive integer or zero';
    }


    const formattedParts = formatUnits(num, decimals).split('.');
    // formatUnits always adds a decimal; no need to check for index of '.'
    const integer = formattedParts[0];
    let fractional = formattedParts[1];

    fractional = fractional.slice(0, precision);

    const roundedFormatted = `${integer}.${fractional}`;

    return parseUnits(roundedFormatted, decimals);
}
