export function dateIsWithinXMinutes(epochMs: number, minutes: number) {
    if (epochMs <= 0) {
        throw new Error('epochMs must be greater than 0');
    }

    if (epochMs % 1 !== 0) {
        throw new Error('epochMs must be an integer');
    }

    // make a date object which represents the time X minutes ago
    const xMinsAgo = new Date();
    xMinsAgo.setMinutes(xMinsAgo.getMinutes() - minutes);

    // return true if the date is within the defined timeframe
    return new Date(epochMs) > xMinsAgo;
}
