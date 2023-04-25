// eztodo jsdocs, tests

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

export function getNumberOfDecimalPlaces(amount: string | number, locale: string) {
    const amountString = typeof amount === 'string' ? amount : amount.toString();
    const decimalSeparator = getDecimalSeparatorForLocale(locale).charAt(1);

    // Check if the number has a decimal part
    const decimalIndex = amountString.indexOf(decimalSeparator);
    if (decimalIndex === -1) {
        return 0;
    }

    // Count the number of digits after the decimal point
    const decimalPart = amountString.slice(decimalIndex + 1);
    const numberOfDecimalPlaces = decimalPart.replace(/\D+/g, '').length;
    return numberOfDecimalPlaces;
}

export function getNumberFromLocalizedFormattedNumber(formatted: string, locale: string) {
    const decimalSeparator = getDecimalSeparatorForLocale(locale);

    const notIntegerOrSeparatorRegex = new RegExp(`[^0-9${decimalSeparator}]`, 'g');
    let unformatted = formatted.replace(notIntegerOrSeparatorRegex, '');

    // if the decimal separator is anything but a dot, replace it with a dot to allow conversion to number
    if (decimalSeparator !== '.') {
        unformatted = unformatted.replace(/[^0-9.]/g, '.');
    }

    return +unformatted;
}
