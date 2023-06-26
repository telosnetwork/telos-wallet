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
