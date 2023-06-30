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
