import { arrayify, isHexString, keccak256 } from 'ethers/lib/utils';
import { addressString } from 'src/antelope/stores/utils/abi';

/**
 * Given some text, ellipsizes the text if it exceeds a specific length
 *
 * @param text
 * @param maxLength
 */
export function truncateText(text: string, maxLength = 10) {
    if (text.length <= maxLength) {
        return text;
    }

    return `${text.slice(0, maxLength)}...`;
}

/**
 * Given an address, returns a shortened version like `0x0000...0000`
 *
 * @param address
 * @param maxLength
 */
export function truncateAddress(address: string) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * convertes a address to a checksum address
 *
 * @param address
 */
export function getChecksumAddress(address: string): addressString {
    if (!isHexString(address, 20)) {
        throw new Error(`Invalid address: ${address}`);
    }

    const addressLower = address.toLowerCase();

    const chars = addressLower.substring(2).split('');

    const expanded = new Uint8Array(40);
    for (let i = 0; i < 40; i++) {
        expanded[i] = chars[i].charCodeAt(0);
    }

    const hashed = arrayify(keccak256(expanded));

    for (let i = 0; i < 40; i += 2) {
        if ((hashed[i >> 1] >> 4) >= 8) {
            chars[i] = chars[i].toUpperCase();
        }
        if ((hashed[i >> 1] & 0x0f) >= 8) {
            chars[i + 1] = chars[i + 1].toUpperCase();
        }
    }

    return '0x' + chars.join('') as addressString;
}

