import {
    convertCurrency, getBigNumberFromLocalizedNumberString,
    getDecimalSeparatorForLocale,
    getFloatReciprocal,
    getLargeNumberSeparatorForLocale,
    prettyPrintCurrency,
} from 'src/antelope/stores/utils/currency-utils';
import { BigNumber } from 'ethers';
import {
    oneEthInWei, oneHundredFiftyEthInWei,
    onePointFiveEthInWei,
    onePointOneEthInWei,
    oneThousandFiveHundredEthInWei,
} from 'test/jest/testing-helpers';
import { formatUnits } from 'ethers/lib/utils';

describe('getDecimalSeparatorForLocale', () => {
    it('should get the right decimal separator', () => {
        expect(getDecimalSeparatorForLocale('en-US')).toBe('.');
        expect(getDecimalSeparatorForLocale('hi-IN')).toBe('.');
        expect(getDecimalSeparatorForLocale('de-DE')).toBe(',');
    });
});

describe('getLargeNumberSeparatorForLocale', () => {
    it('should get the right large number separator', () => {
        expect(getLargeNumberSeparatorForLocale('en-US')).toBe(',');
        expect(getLargeNumberSeparatorForLocale('hi-IN')).toBe(',');
        expect(getLargeNumberSeparatorForLocale('de-DE')).toBe('.');
    });
});

describe('getBigNumberFromLocalizedNumberString', () => {
    it('should throw when passed an invalid value', () => {
        const locale = 'en-US';

        expect(() => getBigNumberFromLocalizedNumberString('213,456.789', 0, locale)).toThrow();
        expect(() => getBigNumberFromLocalizedNumberString('213,456.789', 1.5, locale)).toThrow();

        expect(() => getBigNumberFromLocalizedNumberString('213a456.789', 1, locale)).toThrow();
        expect(() => getBigNumberFromLocalizedNumberString('', 1, locale)).toThrow();
        expect(() => getBigNumberFromLocalizedNumberString('-5', 1, locale)).toThrow();
    });

    it('should correctly convert a localized string number to a BigNumber', () => {
        expect(getBigNumberFromLocalizedNumberString('213,456.789', 6, 'en-US')).toEqual(BigNumber.from(213456789000));
        expect(getBigNumberFromLocalizedNumberString('1', 18, 'en-US')).toEqual(BigNumber.from('1'.concat('0'.repeat(18))));
    });
});

describe('prettyPrintCurrency', () => {
    it('should throw when passed an invalid value', () => {
        const locale = 'en-US';
        const currency = 'USD';

        // invalid precision value
        expect(() => prettyPrintCurrency(1, -1, locale, false, currency)).toThrow();
        expect(() => prettyPrintCurrency(1, 0.5, locale, false, currency)).toThrow();

        // trying to format BigNumber without token decimals
        expect(() => prettyPrintCurrency(BigNumber.from(1), 1, locale, false, currency)).toThrow();
    });

    describe('should print values correctly when the locale is', () => {
        describe('en-US and the currency is', () => {
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

                // check BigNumber fiat values
                expect(prettyPrintCurrency(BigNumber.from(12), 2, locale, false, currency, false, 2)).toBe('$0.12');
                expect(prettyPrintCurrency(BigNumber.from(12), 2, locale, false, currency, true, 2)).toBe('0.12\u00A0USD');

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

    it('should trim trailing zeroes when trimZeroes is true', () => {
        const locale = 'en-US';
        expect(prettyPrintCurrency(0.123, 6, locale, false, undefined, undefined, undefined, true)).toBe('0.123');
        expect(prettyPrintCurrency(1.0, 6, locale, false, undefined, undefined, undefined, true)).toBe('1');
        expect(prettyPrintCurrency(BigNumber.from(onePointOneEthInWei), 6, locale, false, undefined, undefined, 18, true)).toBe('1.1');
    });

    it('should print correctly for BigNumber values', () => {
        expect(
            prettyPrintCurrency(BigNumber.from(onePointOneEthInWei), 1, 'en-US', false, undefined, undefined, 18),
        ).toBe('1.1');

        expect(
            prettyPrintCurrency(BigNumber.from(oneEthInWei), 0, 'en-US', false, undefined, undefined, 18),
        ).toBe('1');

        expect(
            prettyPrintCurrency(BigNumber.from(onePointOneEthInWei), 4, 'en-US', false, undefined, undefined, 18),
        ).toBe('1.1000');

        expect(
            prettyPrintCurrency(BigNumber.from(onePointOneEthInWei), 1, 'en-US', false, 'TLOS', undefined, 18),
        ).toBe('1.1 TLOS');

        expect(
            prettyPrintCurrency(BigNumber.from(oneThousandFiveHundredEthInWei), 4, 'en-US', undefined, undefined, undefined, 18),
        ).toBe('1,500.0000');

        expect(
            prettyPrintCurrency(BigNumber.from('4999999999999999999750'), 4, 'en-US', false, undefined, undefined, 18),
        ).toBe('4,999.9999');

        expect(
            prettyPrintCurrency(BigNumber.from(oneThousandFiveHundredEthInWei), 4, 'en-US', true, undefined, undefined, 18),
        ).toBe('1.5K');

        expect(
            prettyPrintCurrency(BigNumber.from(oneThousandFiveHundredEthInWei), 4, 'en-US', true, 'TLOS', undefined, 18),
        ).toBe('1.5K TLOS');

        // ensure that fiat currency expressed as a BigNumber is formatted correctly
        expect(
            prettyPrintCurrency(BigNumber.from(100), 2, 'en-US', false, 'USD', false, 2, false),
        ).toBe('$1.00');

        // ensure 0 decimals is handled correctly
        expect(
            prettyPrintCurrency(BigNumber.from(100), 2, 'en-US', false, '', false, 0, true),
        ).toBe('100');
    });
});

describe('convertCurrency', () => {
    it('should throw for invalid values', () => {
        const zeroBN = BigNumber.from(0);

        //invalid tokenOne amount
        expect(() => convertCurrency(BigNumber.from(-1), 3, 3, 0.5)).toThrow();

        // invalid tokenOne decimals
        expect(() => convertCurrency(zeroBN, -1, 3, 0.5)).toThrow();
        expect(() => convertCurrency(zeroBN, 0, 3, 0.5)).toThrow();

        // invalid tokenTwo decimals
        expect(() => convertCurrency(zeroBN, 3, -1, 0.5)).toThrow();
        expect(() => convertCurrency(zeroBN, 3, 0, 0.5)).toThrow();

        // invalid conversion rate
        expect(() => convertCurrency(zeroBN, 3, 3, -1)).toThrow();
        expect(() => convertCurrency(zeroBN, 3, 3, 0)).toThrow();
    });

    it('should accurately convert valid values', () => {
        const usdtDecimals = 6;
        const usdcDecimals = 6;
        const usdDecimals = 2;
        const tlosDecimals = 18;

        // USDT/USDC have 6 decimals, hence 1 USDT/C = 1000000 USDT/C-wei
        const oneUsdt = BigNumber.from(1000000);
        const oneUsdc = BigNumber.from(1000000);
        const oneTlos = BigNumber.from(oneEthInWei);
        const onePtFiveTlos = BigNumber.from(onePointFiveEthInWei);
        const oneHundredFiftyTlos = BigNumber.from(oneHundredFiftyEthInWei);
        const onePointFiveUsdt = BigNumber.from(1500000);
        const twoHundredThirtyFiveUsdt = BigNumber.from(235000000);
        const onePointOneTwoFiveSevenThreeUsdt = BigNumber.from(1125730);
        const oneUsd = BigNumber.from(100);

        // some arbitrary, realistic conversion rates
        const conversionRateFromTlosToUsdt = '0.200';
        const conversionRateFromTlosToUsdc = '0.19';
        const conversionRateFromUsdtToTlos = '5';
        const conversionRateFromUsdToTlos = '5';
        const conversionRateFromUsdcToTlos = '5.263157894736842105';
        const conversionRateOneToOne = '1';

        const zeroTlosConvertedToUsdtBn = convertCurrency(BigNumber.from(0), tlosDecimals, usdtDecimals, conversionRateFromTlosToUsdt);
        const zeroTlosConvertedToUsdt = formatUnits(zeroTlosConvertedToUsdtBn, usdtDecimals);
        expect(zeroTlosConvertedToUsdt).toBe('0.0');

        const oneTlosConvertedToUsdtBn = convertCurrency(oneTlos, tlosDecimals, usdtDecimals, conversionRateFromTlosToUsdt);
        const oneTlosConvertedToUsdt = formatUnits(oneTlosConvertedToUsdtBn, usdtDecimals);
        expect(oneTlosConvertedToUsdt).toBe('0.2');

        const onePointFiveTlosConvertedToUsdtBn = convertCurrency(onePtFiveTlos, tlosDecimals, usdtDecimals, conversionRateFromTlosToUsdt);
        const onePointFiveTlosConvertedToUsdt = formatUnits(onePointFiveTlosConvertedToUsdtBn, usdtDecimals);
        expect(onePointFiveTlosConvertedToUsdt).toBe('0.3');

        const oneHundredFiftyTlosConvertedToUsdtBn = convertCurrency(oneHundredFiftyTlos, tlosDecimals, usdtDecimals, conversionRateFromTlosToUsdt);
        const oneHundredFiftyTlosConvertedToUsdt = formatUnits(oneHundredFiftyTlosConvertedToUsdtBn, usdtDecimals);
        expect(oneHundredFiftyTlosConvertedToUsdt).toBe('30.0');

        const oneUsdtConvertedToUsdBn = convertCurrency(oneUsdt, usdtDecimals, usdDecimals, conversionRateOneToOne);
        const oneUsdtConvertedToUsd = formatUnits(oneUsdtConvertedToUsdBn, usdDecimals);
        expect(oneUsdtConvertedToUsd).toBe('1.0');

        const oneUsdtConvertedToTlosBn = convertCurrency(oneUsdt, usdtDecimals, tlosDecimals, conversionRateFromUsdtToTlos);
        const oneUsdtConvertedToTlos = formatUnits(oneUsdtConvertedToTlosBn, tlosDecimals);
        expect(oneUsdtConvertedToTlos).toBe('5.0');

        const twoHundredThirtyFiveUsdtConvertedToTlosBn = convertCurrency(twoHundredThirtyFiveUsdt, usdtDecimals, tlosDecimals, conversionRateFromUsdtToTlos);
        const twoHundredThirtyFiveUsdtConvertedToTlos = formatUnits(twoHundredThirtyFiveUsdtConvertedToTlosBn, tlosDecimals);
        expect(twoHundredThirtyFiveUsdtConvertedToTlos).toBe('1175.0');

        const onePointFiveUsdtConvertedToTlosBn = convertCurrency(onePointFiveUsdt, usdtDecimals, tlosDecimals, conversionRateFromUsdtToTlos);
        const onePointFiveUsdtConvertedToTlos = formatUnits(onePointFiveUsdtConvertedToTlosBn, tlosDecimals);
        expect(onePointFiveUsdtConvertedToTlos).toBe('7.5');

        const onePointOneTwoFiveSevenThreeUsdtConvertedToTlosBn = convertCurrency(onePointOneTwoFiveSevenThreeUsdt, usdtDecimals, tlosDecimals, conversionRateFromUsdtToTlos);
        const onePointOneTwoFiveSevenThreeUsdtConvertedToTlos = formatUnits(onePointOneTwoFiveSevenThreeUsdtConvertedToTlosBn, tlosDecimals);
        expect(onePointOneTwoFiveSevenThreeUsdtConvertedToTlos).toBe('5.62865');

        const oneUsdConvertedToTlosBn = convertCurrency(oneUsd, usdDecimals, tlosDecimals, conversionRateFromUsdToTlos);
        const oneUsdConvertedToTlos = formatUnits(oneUsdConvertedToTlosBn, tlosDecimals);
        expect(oneUsdConvertedToTlos).toBe('5.0');

        const oneUsdcConvertedToTlosBn = convertCurrency(oneUsdc, usdcDecimals, tlosDecimals, conversionRateFromUsdcToTlos);
        const oneUsdcConvertedToTlos = formatUnits(oneUsdcConvertedToTlosBn, tlosDecimals);
        expect(oneUsdcConvertedToTlos).toBe('5.263157894736842105');

        const oneTlosConvertedToUsdcBn = convertCurrency(oneTlos, tlosDecimals, usdcDecimals, conversionRateFromTlosToUsdc);
        const oneTlosConvertedToUsdc = formatUnits(oneTlosConvertedToUsdcBn, usdcDecimals);
        expect(oneTlosConvertedToUsdc).toBe('0.19');

        // sanity check - one wei should be preserved
        const tinyTlosConvertedToOtherBn = convertCurrency(BigNumber.from(1), tlosDecimals, tlosDecimals, '3');
        const tinyTlosConvertedToOther = formatUnits(tinyTlosConvertedToOtherBn, tlosDecimals);
        expect(tinyTlosConvertedToOther).toBe('0.000000000000000003');
    });
});

describe('getFloatReciprocal', () => {
    it('should throw when passed an invalid value', () => {
        expect(() => getFloatReciprocal(-1)).toThrow();
        expect(() => getFloatReciprocal('a')).toThrow();
        expect(() => getFloatReciprocal('')).toThrow();
        expect(() => getFloatReciprocal(0)).toThrow();
        expect(() => getFloatReciprocal('0')).toThrow();
        expect(() => getFloatReciprocal('0.0')).toThrow();
        expect(() => getFloatReciprocal(0.0)).toThrow();
        expect(() => getFloatReciprocal('000')).toThrow();
    });

    it('should accurately invert floats', () => {
        expect(getFloatReciprocal(0.2)).toBe('5');
        expect(getFloatReciprocal('0.2')).toBe('5');
        expect(getFloatReciprocal(5)).toBe('0.2');
        expect(getFloatReciprocal('5')).toBe('0.2');
        expect(getFloatReciprocal('0.19')).toBe('5.263157894736842105');
    });
});
