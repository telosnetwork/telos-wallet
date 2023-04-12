import { prettyPrintCurrency } from 'src/antelope/stores/utils';

describe('prettyPrintCurrency', () => {
    it('should throw when passed an invalid value', () => {
        const locale = 'en-US';
        const currency = 'USD';

        // invalid decimals value
        expect(() => prettyPrintCurrency(1, -1, locale, false, currency)).toThrow();
        expect(() => prettyPrintCurrency(1, 0.5, locale, false, currency)).toThrow();
    });

    describe('should print values correctly when the locale is', () => {
        describe('en-US and the currency is USD', () => {
            const locale = 'en-US';

            test('USD', () => {
                const currency = 'USD';

                // abbreviate: false, no currency
                expect(prettyPrintCurrency(0.123, 0, locale)).toBe('0');
                expect(prettyPrintCurrency(0.123, 2, locale)).toBe('0.12');
                expect(prettyPrintCurrency(0.123, 4, locale)).toBe('0.1230');
                expect(prettyPrintCurrency(123, 0, locale)).toBe('123');
                expect(prettyPrintCurrency(123, 2, locale)).toBe('123.00');
                expect(prettyPrintCurrency(123, 4, locale)).toBe('123.0000');
                expect(prettyPrintCurrency(1234, 0, locale)).toBe('1,234');
                expect(prettyPrintCurrency(1234, 2, locale)).toBe('1,234.00');
                expect(prettyPrintCurrency(1234, 4, locale)).toBe('1,234.0000');
                expect(prettyPrintCurrency(-1234, 4, locale)).toBe('-1,234.0000');

                // abbreviate: true, no currency
                expect(prettyPrintCurrency(0.123, 0, locale, true)).toBe('0');
                expect(prettyPrintCurrency(0.123, 2, locale, true)).toBe('0.12');
                expect(prettyPrintCurrency(0.123, 4, locale, true)).toBe('0.1230');
                expect(prettyPrintCurrency(123, 0, locale, true)).toBe('123');
                expect(prettyPrintCurrency(123, 2, locale, true)).toBe('123.00');
                expect(prettyPrintCurrency(123, 4, locale, true)).toBe('123.0000');
                expect(prettyPrintCurrency(1234, 0, locale, true)).toBe('1.23K');
                expect(prettyPrintCurrency(1234, 2, locale, true)).toBe('1.23K');
                expect(prettyPrintCurrency(1234, 4, locale, true)).toBe('1.23K');
                expect(prettyPrintCurrency(-1234, 4, locale, true)).toBe('-1.23K');

                // abbreviate: false, with currency, displayCurrencyAsCode: false/undefined
                expect(prettyPrintCurrency(0.123, 0, locale, false, currency)).toBe('$0');
                expect(prettyPrintCurrency(0.123, 2, locale, false, currency)).toBe('$0.12');
                expect(prettyPrintCurrency(0.123, 4, locale, false, currency)).toBe('$0.1230');
                expect(prettyPrintCurrency(123, 0, locale, false, currency)).toBe('$123');
                expect(prettyPrintCurrency(123, 2, locale, false, currency)).toBe('$123.00');
                expect(prettyPrintCurrency(123, 4, locale, false, currency)).toBe('$123.0000');
                expect(prettyPrintCurrency(1234, 0, locale, false, currency)).toBe('$1,234');
                expect(prettyPrintCurrency(1234, 2, locale, false, currency)).toBe('$1,234.00');
                expect(prettyPrintCurrency(1234, 4, locale, false, currency)).toBe('$1,234.0000');
                expect(prettyPrintCurrency(-1234, 4, locale, false, currency)).toBe('-$1,234.0000');

                // abbreviate: true, with currency, displayCurrencyAsCode: false
                expect(prettyPrintCurrency(0.123, 0, locale, true, currency)).toBe('$0');
                expect(prettyPrintCurrency(0.123, 2, locale, true, currency)).toBe('$0.12');
                expect(prettyPrintCurrency(0.123, 4, locale, true, currency)).toBe('$0.1230');
                expect(prettyPrintCurrency(123, 0, locale, true, currency)).toBe('$123');
                expect(prettyPrintCurrency(123, 2, locale, true, currency)).toBe('$123.00');
                expect(prettyPrintCurrency(123, 4, locale, true, currency)).toBe('$123.0000');
                expect(prettyPrintCurrency(1234, 0, locale, true, currency)).toBe('$1.23K');
                expect(prettyPrintCurrency(1234, 2, locale, true, currency)).toBe('$1.23K');
                expect(prettyPrintCurrency(1234, 4, locale, true, currency)).toBe('$1.23K');
                expect(prettyPrintCurrency(-1234, 4, locale, true, currency)).toBe('-$1.23K');

                // abbreviate: false, with currency, displayCurrencyAsCode: true
                // note that the Intl number formatter uses \u00A0 (non-breaking space) rather than normal space
                expect(prettyPrintCurrency(0.123, 0, locale, false, currency, true)).toBe('USD\u00A00');
                expect(prettyPrintCurrency(0.123, 2, locale, false, currency, true)).toBe('USD\u00A00.12');
                expect(prettyPrintCurrency(0.123, 4, locale, false, currency, true)).toBe('USD\u00A00.1230');
                expect(prettyPrintCurrency(123, 0, locale, false, currency, true)).toBe('USD\u00A0123');
                expect(prettyPrintCurrency(123, 2, locale, false, currency, true)).toBe('USD\u00A0123.00');
                expect(prettyPrintCurrency(123, 4, locale, false, currency, true)).toBe('USD\u00A0123.0000');
                expect(prettyPrintCurrency(1234, 0, locale, false, currency, true)).toBe('USD\u00A01,234');
                expect(prettyPrintCurrency(1234, 2, locale, false, currency, true)).toBe('USD\u00A01,234.00');
                expect(prettyPrintCurrency(1234, 4, locale, false, currency, true)).toBe('USD\u00A01,234.0000');
                expect(prettyPrintCurrency(-1234, 4, locale, false, currency, true)).toBe('-USD\u00A01,234.0000');

                // abbreviate: true, with currency, displayCurrencyAsCode: true
                expect(prettyPrintCurrency(0.123, 0, locale, true, currency, true)).toEqual('USD\u00A00');
                expect(prettyPrintCurrency(0.123, 2, locale, true, currency, true)).toBe('USD\u00A00.12');
                expect(prettyPrintCurrency(0.123, 4, locale, true, currency, true)).toBe('USD\u00A00.1230');
                expect(prettyPrintCurrency(123, 0, locale, true, currency, true)).toBe('USD\u00A0123');
                expect(prettyPrintCurrency(123, 2, locale, true, currency, true)).toBe('USD\u00A0123.00');
                expect(prettyPrintCurrency(123, 4, locale, true, currency, true)).toBe('USD\u00A0123.0000');
                expect(prettyPrintCurrency(1234, 0, locale, true, currency, true)).toBe('USD\u00A01.23K');
                expect(prettyPrintCurrency(1234, 2, locale, true, currency, true)).toBe('USD\u00A01.23K');
                expect(prettyPrintCurrency(1234, 4, locale, true, currency, true)).toBe('USD\u00A01.23K');
                expect(prettyPrintCurrency(-1234, 4, locale, true, currency, true)).toBe('-USD\u00A01.23K');
            });

        });
    });
});
