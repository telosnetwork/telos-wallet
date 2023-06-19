// eztodo jsdoc
export function truncateText(text: string, maxLength = 10) {
    if (text.length <= maxLength) {
        return text;
    }

    return `${text.slice(0, maxLength)}...`;
}
