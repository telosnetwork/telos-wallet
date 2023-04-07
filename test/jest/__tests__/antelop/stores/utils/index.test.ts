import { prettyPrintCurrency } from 'src/antelope/stores/utils';

describe('prettyPrintCurrency', () => {
    it('should throw when passed an invalid value', () => {
        // invalid decimals value
        expect(() => prettyPrintCurrency(1, -1)).toThrow();
        expect(() => prettyPrintCurrency(1, 0.5)).toThrow();
        expect(() => prettyPrintCurrency(1, {} as number)).toThrow();

        // bad string representation of a number
        expect(() => prettyPrintCurrency({} as number, 0.5)).toThrow();
        expect(() => prettyPrintCurrency('1.2.3', -1)).toThrow();
        expect(() => prettyPrintCurrency('100,123', -1)).toThrow();
        expect(() => prettyPrintCurrency('a', -1)).toThrow();
    });

    it('should print number values correctly', () => {
        // default precision
        expect(prettyPrintCurrency(0.123)).toBe('0.12');
        expect(prettyPrintCurrency(1.123)).toBe('1.12');
        expect(prettyPrintCurrency(1.199)).toBe('1.20');
        expect(prettyPrintCurrency(1234)).toBe('1,234.00');
        expect(prettyPrintCurrency(123456)).toBe('123,456.00');

        // specified precision
        expect(prettyPrintCurrency(0.123, 4)).toBe('0.1230');
        expect(prettyPrintCurrency(1.123, 4)).toBe('1.1230');
        expect(prettyPrintCurrency(1.199, 4)).toBe('1.1990');
        expect(prettyPrintCurrency(1234, 4)).toBe('1,234.0000');
        expect(prettyPrintCurrency(123456, 4)).toBe('123,456.0000');
    });

    it('should print string values correctly', () => {
        // default precision
        expect(prettyPrintCurrency('0.123')).toBe('0.12');
        expect(prettyPrintCurrency('1.123')).toBe('1.12');
        expect(prettyPrintCurrency('1.199')).toBe('1.20');
        expect(prettyPrintCurrency('1234')).toBe('1,234.00');
        expect(prettyPrintCurrency('123456')).toBe('123,456.00');

        // specified precision
        expect(prettyPrintCurrency('0.123', 0)).toBe('0');
        expect(prettyPrintCurrency('0.123', 4)).toBe('0.1230');
        expect(prettyPrintCurrency('1.123', 4)).toBe('1.1230');
        expect(prettyPrintCurrency('1.199', 4)).toBe('1.1990');
        expect(prettyPrintCurrency('1234', 4)).toBe('1,234.0000');
        expect(prettyPrintCurrency('123456', 4)).toBe('123,456.0000');
    });
});
