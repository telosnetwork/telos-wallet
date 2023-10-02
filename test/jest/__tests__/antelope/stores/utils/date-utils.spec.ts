import { dateIsWithinXMinutes } from 'src/antelope/stores/utils/date-utils';

describe('dateIsWithinXMinutes', () => {
    it('should throw an error if epochMs is less than or equal to 0', () => {
        expect(() => dateIsWithinXMinutes(0, 1)).toThrow();
        expect(() => dateIsWithinXMinutes(-1, 1)).toThrow();
    });

    it('should throw an error if epochMs is not an integer', () => {
        expect(() => dateIsWithinXMinutes(0.5, 1)).toThrow();
    });

    it('should return true if the date is within the defined timeframe', () => {
        const now = Date.now();
        const fiveMinutesAgo = now - 1000 * 60 * 5;
        const timeframeMinutes = 10;

        expect(dateIsWithinXMinutes(fiveMinutesAgo, timeframeMinutes)).toBe(true);
    });

    it('should return false if the date is not within the defined timeframe', () => {
        const now = Date.now();
        const tenMinutesAgo = now - 1000 * 60 * 10;
        const timeframeMinutes = 5;

        // timeframe here is 5 minutes
        expect(dateIsWithinXMinutes(tenMinutesAgo, timeframeMinutes)).toBe(false);
    });
});
