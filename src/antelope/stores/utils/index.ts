export * from 'src/antelope/stores/utils/abi/signature';
import { BigNumber } from 'ethers';
import { formatUnits } from '@ethersproject/units';
import { keccak256 } from '@ethersproject/keccak256';
import { toUtf8Bytes } from '@ethersproject/strings';
import moment from 'moment';
import {
    EvmABIEntry,
} from 'src/antelope/types';

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

export function formatIsoDateTime(dateTimezone: string | Date | number): string {
    return moment(dateTimezone).utc().format('DD/MM/YYYY');
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
 * Formats a number amount to a commified string with a specified number of decimal places
 *
 * @param {number} amount - the amount of currency as a number or a string. If a string, amount should only contain numbers and up to a single '.'
 * @param {number} decimals - the number of decimal places to show
 *
 * @return {string}
 */
export function prettyPrintCurrency(amount: number | string, decimals = 2) {
    const numberRegex = /^-?\d+(\.\d+)?$/;

    const amountIsNumber = ['string', 'number'].includes(typeof amount);
    const amountIsStringAndValid = typeof amount === 'string' && numberRegex.test(amount);
    const decimalsIsValidInt = typeof decimals === 'number' && decimals >= 0 && decimals % 1 === 0;

    if (!amountIsNumber && !amountIsStringAndValid) {
        throw `String amount ${amount} does not represent a number`;
    }

    if (!decimalsIsValidInt) {
        throw `Decimal precision ${decimals} is not a positive integer`;
    }

    const amountNumber = typeof amount === 'string' ? +amount : amount;

    let formatted = amountNumber.toLocaleString('en-us');

    if (decimals === 0) {
        return Math.floor(parseFloat(formatted.replace(/,/g, ''))).toString();
    }

    if (formatted.indexOf('.') !== -1) {
        const formattedInteger = formatted.split('.')[0];
        const formattedFraction = amountNumber.toFixed(decimals).split('.')[1];

        formatted = `${formattedInteger}.${formattedFraction}`;
    } else {
        formatted = `${formatted}.`.concat('0'.repeat(decimals));
    }

    return formatted;
}


/**
 * Given a number, returns an abbreviated version for large values, such as 1.5B
 * for small fractions like 0.12345, a 4-precision representation is returned
 * @param {number} amount - number to format
 * @param {number} precision - number of decimals to display for small numbers with fractional values
 *
 * @return {string}
 */
export function abbreviateNumber(amount: number, precision = 4) {
    if (typeof amount !== 'number') {
        throw 'Type of amount must be number';
    }

    const precisionIsValid = typeof precision === 'number' && precision >= 0 && precision % 1 === 0;

    if (!precisionIsValid) {
        throw 'Type of precision must be a positive integer or zero';
    }

    if (amount < 1000 && amount >= 0) {
        return amount.toFixed(precision);
    }

    let abbreviated = Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 2,
    }).format(amount);

    // retain fractional value for numbers under 1k, as the above expression will chop off fractions
    if (amount % 1 !== 0 && amount < 1000 && precision > 0) {
        const fraction = amount.toFixed(precision).split('.')[1];
        abbreviated += `.${fraction}`;
    }

    return abbreviated;
}
