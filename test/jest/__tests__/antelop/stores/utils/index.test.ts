import { abbreviateNumber, prettyPrintCurrency } from 'src/antelope/stores/utils';

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
        expect(prettyPrintCurrency(-123456)).toBe('-123,456.00');

        // specified precision
        expect(prettyPrintCurrency(0.123, 0)).toBe('0');
        expect(prettyPrintCurrency(123, 0)).toBe('123');
        expect(prettyPrintCurrency(0.123, 4)).toBe('0.1230');
        expect(prettyPrintCurrency(1.123, 4)).toBe('1.1230');
        expect(prettyPrintCurrency(1.199, 4)).toBe('1.1990');
        expect(prettyPrintCurrency(1234, 4)).toBe('1,234.0000');
        expect(prettyPrintCurrency(123456, 4)).toBe('123,456.0000');
        expect(prettyPrintCurrency(-123456, 4)).toBe('-123,456.0000');
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

describe('abbreviateNumber', () => {
    it('should throw when given invalid values', () => {
        //invalid amount
        expect(() => abbreviateNumber({} as number)).toThrow();

        // invalid precision
        expect(() => abbreviateNumber(0, 0.5)).toThrow();
        expect(() => abbreviateNumber(0, -1)).toThrow();
        expect(() => abbreviateNumber(0, {} as number)).toThrow();
    });

    it('should display abbreviated values correctly', () => {
        // default precision
        expect(abbreviateNumber(0)).toBe('0.0000');
        expect(abbreviateNumber(0.1)).toBe('0.1000');
        expect(abbreviateNumber(0.1234)).toBe('0.1234');
        expect(abbreviateNumber(0.12349)).toBe('0.1235');
        expect(abbreviateNumber(123)).toBe('123.0000');
        expect(abbreviateNumber(123.1)).toBe('123.1000');
        expect(abbreviateNumber(123.4567)).toBe('123.4567');
        expect(abbreviateNumber(123.45678)).toBe('123.4568');
        expect(abbreviateNumber(1234)).toBe('1.23K');
        expect(abbreviateNumber(1234.1)).toBe('1.23K');
        expect(abbreviateNumber(1234.1234)).toBe('1.23K');
        expect(abbreviateNumber(1234.12345)).toBe('1.23K');
        expect(abbreviateNumber(1234.12345)).toBe('1.23K');
        expect(abbreviateNumber(12345)).toBe('12.35K');
        expect(abbreviateNumber(123456)).toBe('123.46K');
        expect(abbreviateNumber(1234567)).toBe('1.23M');
        expect(abbreviateNumber(12345678)).toBe('12.35M');
        expect(abbreviateNumber(123456789)).toBe('123.46M');
        expect(abbreviateNumber(1234567890)).toBe('1.23B');
        expect(abbreviateNumber(12345678900)).toBe('12.35B');
        expect(abbreviateNumber(123456789000)).toBe('123.46B');
        expect(abbreviateNumber(1234567890000)).toBe('1.23T');
        expect(abbreviateNumber(12345678900000)).toBe('12.35T');
        expect(abbreviateNumber(123456789000000)).toBe('123.46T');

        // specified precision
        expect(abbreviateNumber(0, 0)).toBe('0');
        expect(abbreviateNumber(12, 0)).toBe('12');
        expect(abbreviateNumber(123, 0)).toBe('123');
        expect(abbreviateNumber(1200, 0)).toBe('1.2K');
        expect(abbreviateNumber(0, 2)).toBe('0.00');
        expect(abbreviateNumber(0.1, 2)).toBe('0.10');
        expect(abbreviateNumber(0.1234, 2)).toBe('0.12');
        expect(abbreviateNumber(0.12349, 2)).toBe('0.12');
        expect(abbreviateNumber(123, 2)).toBe('123.00');
        expect(abbreviateNumber(123.1, 2)).toBe('123.10');
        expect(abbreviateNumber(123.4567, 2)).toBe('123.46');
        expect(abbreviateNumber(123.45678, 2)).toBe('123.46');
        expect(abbreviateNumber(1234, 2)).toBe('1.23K');
        expect(abbreviateNumber(1234.1, 2)).toBe('1.23K');
        expect(abbreviateNumber(1234.1234, 2)).toBe('1.23K');
        expect(abbreviateNumber(1234.12345, 2)).toBe('1.23K');
        expect(abbreviateNumber(1234.12345, 2)).toBe('1.23K');
        expect(abbreviateNumber(12345, 2)).toBe('12.35K');
        expect(abbreviateNumber(123456, 2)).toBe('123.46K');
        expect(abbreviateNumber(1234567, 2)).toBe('1.23M');
        expect(abbreviateNumber(12345678, 2)).toBe('12.35M');
        expect(abbreviateNumber(123456789, 2)).toBe('123.46M');
        expect(abbreviateNumber(1234567890, 2)).toBe('1.23B');
        expect(abbreviateNumber(12345678900, 2)).toBe('12.35B');
        expect(abbreviateNumber(123456789000, 2)).toBe('123.46B');
        expect(abbreviateNumber(1234567890000, 2)).toBe('1.23T');
        expect(abbreviateNumber(12345678900000, 2)).toBe('12.35T');
        expect(abbreviateNumber(123456789000000, 2)).toBe('123.46T');
    });
});
