export * from 'src/antelope/stores/utils/abi/signature';
import { BigNumber } from 'ethers';
import { formatUnits } from '@ethersproject/units';
import { keccak256 } from '@ethersproject/keccak256';
import { toUtf8Bytes } from '@ethersproject/strings';
import {
    EvmABIEntry,
} from 'src/antelope/types';
import { fromUnixTime, format } from 'date-fns';


const REVERT_FUNCTION_SELECTOR = '0x08c379a0';
const REVERT_PANIC_SELECTOR = '0x4e487b71';

export const WEI_PRECISION = 18;

export function formatWei(bn: BigNumber, tokenDecimals: number, displayDecimals = 4): string {
    const amount = BigNumber.from(bn);
    const formatted = formatUnits(amount.toString(), tokenDecimals || WEI_PRECISION);
    const str = formatted.toString();
    // Use string, do not convert to number so we never lose precision
    if (displayDecimals > 0 && str.includes('.')) {
        const parts = str.split('.');
        return parts[0] + '.' + parts[1].slice(0, displayDecimals);
    }
    return str;
}

export function isValidAddressFormat(ethAddressString: string): boolean {
    const pattern = /^0x[a-fA-F0-9]{40}$/;
    return pattern.test(ethAddressString);
}

export function getTopicHash(topic: string): string {
    return `0x${topic.substring(topic.length - 40)}`;
}

export function toChecksumAddress(address: string): string {
    if (!address) {
        return address;
    }

    let addy = address.toLowerCase().replace('0x', '');
    if (addy.length !== 40) {
        addy = addy.padStart(40, '0');
    }

    const hash = keccak256(toUtf8Bytes(addy));
    let ret = '0x';

    for (let i = 0; i < addy.length; i++) {
        if (parseInt(hash[i], 16) >= 8) {
            ret += addy[i].toUpperCase();
        } else {
            ret += addy[i];
        }
    }

    return ret;
}

export function parseErrorMessage(output: string): string {
    if (!output) {
        return '';
    }

    let message = '';
    if (output.startsWith(REVERT_FUNCTION_SELECTOR)) {
        message = parseRevertReason(output);
    }

    if (output.startsWith(REVERT_PANIC_SELECTOR)) {
        message = parsePanicReason(output);
    }

    return message.replace(/[^a-zA-Z0-9 /./'/"/,/@/+/-/_/(/)/[]/g, '');
}

export function parseRevertReason(revertOutput: string): string {
    if (!revertOutput || revertOutput.length < 138) {
        return '';
    }

    let reason = '';
    const trimmedOutput = revertOutput.substr(138);
    for (let i = 0; i < trimmedOutput.length; i += 2) {
        reason += String.fromCharCode(parseInt(trimmedOutput.substr(i, 2), 16));
    }
    return reason;
}

export function parsePanicReason(revertOutput: string): string {
    const trimmedOutput = revertOutput.slice(-2);
    let reason;

    switch (trimmedOutput) {
    case '01':
        reason = 'If you call assert with an argument that evaluates to false.';
        break;
    case '11':
        reason = 'If an arithmetic operation results in underflow or overflow outside of an unchecked { ... } block.';
        break;
    case '12':
        reason = 'If you divide or modulo by zero (e.g. 5 / 0 or 23 % 0).';
        break;
    case '21':
        reason = 'If you convert a value that is too big or negative into an enum type.';
        break;
    case '31':
        reason = 'If you call .pop() on an empty array.';
        break;
    case '32':
        reason = 'If you access an array, bytesN or an array slice at an out-of-bounds or negative index ' +
            '(i.e. x[i] where i >= x.length or i < 0).';
        break;
    case '41':
        reason = 'If you allocate too much memory or create an array that is too large.';
        break;
    case '51':
        reason = 'If you call a zero-initialized variable of internal function type.';
        break;
    default:
        reason = 'Default panic message';
    }
    return reason;
}

export function sortAbiFunctionsByName(fns: EvmABIEntry[]): EvmABIEntry[] {
    return fns.sort(
        (entryA, entryB) => {
            const upperA = entryA.name.toUpperCase();
            const upperB = entryB.name.toUpperCase();
            return (upperA < upperB) ? -1 : (upperA > upperB) ? 1 : 0;
        },
    );
}

/**
 * Determine whether the user's device is an Apple touch device
 *
 * @return {boolean}
 */
export function getClientIsApple() {
    return [
        'iPad Simulator',
        'iPhone Simulator',
        'iPod Simulator',
        'iPad',
        'iPhone',
        'iPod',
    ].includes(navigator.platform)
        // iPad on iOS 13 detection
        || (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
}

/**
 *  Given a Date object, return the pretty-printed timezone offset, e.g. "+05:00"
 *
 * @param {Date} date
 * @return {string}
 */
export function getFormattedUtcOffset(date: Date): string {
    const pad = (value: number) => value < 10 ? '0' + value : value;
    const sign = (date.getTimezoneOffset() > 0) ? '-' : '+';
    const offset = Math.abs(date.getTimezoneOffset());
    const hours = pad(Math.floor(offset / 60));
    const minutes = pad(offset % 60);
    return sign + hours + ':' + minutes;
}

/**
 * Given a unix timestamp, returns a date in the form of Jan 1, 2023 07:45:22 AM
 *
 * @param epoch
 *
 * @return string
 */
export function getLongDate(epoch: number): string {
    const offset = getFormattedUtcOffset(new Date(epoch));
    return `${format(fromUnixTime(epoch), 'MMM d, yyyy hh:mm:ss a')} (UTC ${offset})`;
}

/*
* Formats a currency amount in a localized way
*
* @param {number} amount - the currency amount
* @param {number} decimals - the number of decimals that should be displayed. Ignored if abbreviate is true and the value is over 1000
* @param {string} locale - user's locale code, e.g. 'en-US'. Generally gotten from the user store like useUserStore().locale
* @param {boolean} abbreviate - whether to abbreviate the value, e.g. 123456.78 => 123.46K. Ignored for values under 1000
* @param {string?} currency - code for the currency to be used, e.g. 'USD'. If defined, either the symbol or code (determined by the param displayCurrencyAsSymbol) will be displayed, e.g. $123.00 . Generally gotten from the user store like useUserStore().currency
* @param {boolean?} displayCurrencyAsCode - if currency is defined, controls whether the currency is display as a symbol or code, e.g. $100 or USD 100
* */
export function prettyPrintCurrency(
    amount: number,
    decimals: number,
    locale: string,
    abbreviate = false,
    currency?: string,
    displayCurrencyAsCode?: boolean,
) {
    if (decimals % 1 !== 0 || decimals < 0) {
        throw 'Decimals must be a positive integer or zero';
    }

    const decimalOptions : Record<string, number | undefined> = {
        maximumFractionDigits: decimals,
        minimumFractionDigits: decimals,
        minimumIntegerDigits: undefined,
        maximumIntegerDigits: undefined,
    };

    if (amount < 1 && amount > 0) {
        decimalOptions.maximumIntegerDigits = 1;
        decimalOptions.minimumIntegerDigits = 1;
    } else if (abbreviate) {
        const forceFractionDisplay = amount < 1000 && amount > -1000 ;

        decimalOptions.maximumFractionDigits = forceFractionDisplay ? decimals : 2;
        decimalOptions.minimumFractionDigits = forceFractionDisplay ? decimals : 2;
        decimalOptions.maximumIntegerDigits = 3;
    }

    const currencyOptions : Record<string, string | boolean | undefined> = {
        style: currency ? 'currency' : undefined,
        currencyDisplay: currency ? (displayCurrencyAsCode ? 'code' : 'symbol') : undefined,
        currency,
    };

    const formatted = Intl.NumberFormat(
        locale,
        {
            notation: abbreviate ? 'compact' : undefined,
            ...currencyOptions,
            ...decimalOptions,
        }).format(amount);

    return formatted;
}

export function isAmountTooLarge(amount: number | string): boolean {
    const primaryAmountIsTooLarge =
        (typeof amount === 'number' && amount.toString().length > 6) ||
        (typeof amount === 'string' && amount.length > 6);

    return primaryAmountIsTooLarge;
}

export function prettyPrintCurrencyTiny(amount: number | string, locale: string) {
    console.log('prettyPrintCurrencyTiny()', amount, locale);
    return prettyPrintCurrency(+amount, 4, locale, isAmountTooLarge(amount));
}

export function prettyPrintFiatCurrency(fiatAmount: number | string, locale: string) {
    console.log('prettyPrintCurrencyTiny()', fiatAmount, locale);
    return prettyPrintCurrency(+fiatAmount, 2, locale, isAmountTooLarge(fiatAmount));
}
