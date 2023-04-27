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

// eztodo move this to currency utils
// eztodo support bignumber?

