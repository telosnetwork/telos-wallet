import { convertCurrency, prettyPrintCurrency } from 'src/antelope/stores/utils/currency-utils';
import { BigNumber } from 'ethers';
import {
    oneEthInWei, oneHundredFiftyEthInWei,
    onePointFiveEthInWei,
    onePointOneEthInWei,
    oneThousandFiveHundredEthInWei
} from 'test/jest/testing-helpers';
import { formatUnits, parseUnits } from 'ethers/lib/utils';

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
            prettyPrintCurrency(BigNumber.from(onePointOneEthInWei), 4, 'en-US', false, undefined, undefined, 18),
        ).toBe('1.1000');

        expect(
            prettyPrintCurrency(BigNumber.from(onePointOneEthInWei), 1, 'en-US', false, 'TLOS', undefined, 18),
        ).toBe('1.1 TLOS');

        expect(
            prettyPrintCurrency(BigNumber.from(oneThousandFiveHundredEthInWei), 4, 'en-US', undefined, undefined, undefined, 18),
        ).toBe('1,500.0000');

        expect(
            prettyPrintCurrency(BigNumber.from(oneThousandFiveHundredEthInWei), 4, 'en-US', true, undefined, undefined, 18),
        ).toBe('1.5K');

        expect(
            prettyPrintCurrency(BigNumber.from(oneThousandFiveHundredEthInWei), 4, 'en-US', true, 'TLOS', undefined, 18),
        ).toBe('1.5K TLOS');
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
        const usdDecimals = 2;
        const tlosDecimals = 18;

        // USDT has 6 decimals, hence 1 USDT = 1000000 USDT-wei
        const oneUsdt = 1000000;
        const onePointFiveUsdt = 1500000;
        const twoHundredThirtyFiveUsdt = 235000000;
        const onePointOneTwoFiveSevenThreeUsdt = 1125730;
        const oneUsd = 100;

        const conversionRateFromTlosToUsdt = 0.2; // 1 USDT = 0.2 TLOS
        const conversionFactorFromUsdtToTlos = 5; // 5 TLOS = 1 USDT

        const zeroTlosConvertedToUsdtBn = convertCurrency(BigNumber.from(0), tlosDecimals, usdtDecimals, conversionRateFromTlosToUsdt);
        const zeroTlosConvertedToUsdt = formatUnits(zeroTlosConvertedToUsdtBn, usdtDecimals);
        expect(zeroTlosConvertedToUsdt).toBe('0.0');

        const oneTlosConvertedToUsdtBn = convertCurrency(BigNumber.from(oneEthInWei), tlosDecimals, usdtDecimals, conversionRateFromTlosToUsdt);
        const oneTlosConvertedToUsdt = formatUnits(oneTlosConvertedToUsdtBn, usdtDecimals);
        expect(oneTlosConvertedToUsdt).toBe('0.2');

        const onePointFiveTlosConvertedToUsdtBn = convertCurrency(BigNumber.from(onePointFiveEthInWei), tlosDecimals, usdtDecimals, conversionRateFromTlosToUsdt);
        const onePointFiveTlosConvertedToUsdt = formatUnits(onePointFiveTlosConvertedToUsdtBn, usdtDecimals);
        expect(onePointFiveTlosConvertedToUsdt).toBe('0.3');

        const oneHundredFiftyTlosConvertedToUsdtBn = convertCurrency(BigNumber.from(oneHundredFiftyEthInWei), tlosDecimals, usdtDecimals, conversionRateFromTlosToUsdt);
        const oneHundredFiftyTlosConvertedToUsdt = formatUnits(oneHundredFiftyTlosConvertedToUsdtBn, usdtDecimals);
        expect(oneHundredFiftyTlosConvertedToUsdt).toBe('30.0');

        const oneUsdtConvertedToUsdBn = convertCurrency(BigNumber.from(oneUsdt), usdtDecimals, usdDecimals, 1);
        const oneUsdtConvertedToUsd = formatUnits(oneUsdtConvertedToUsdBn, usdDecimals);
        expect(oneUsdtConvertedToUsd).toBe('1.0');

        const oneUsdtConvertedToTlosBn = convertCurrency(BigNumber.from(oneUsdt), usdtDecimals, tlosDecimals, conversionFactorFromUsdtToTlos);
        const oneUsdtConvertedToTlos = formatUnits(oneUsdtConvertedToTlosBn, tlosDecimals);
        expect(oneUsdtConvertedToTlos).toBe('5.0');

        const twoHundredThirtyFiveUsdtConvertedToTlosBn = convertCurrency(BigNumber.from(twoHundredThirtyFiveUsdt), usdtDecimals, tlosDecimals, conversionFactorFromUsdtToTlos);
        const twoHundredThirtyFiveUsdtConvertedToTlos = formatUnits(twoHundredThirtyFiveUsdtConvertedToTlosBn, tlosDecimals);
        expect(twoHundredThirtyFiveUsdtConvertedToTlos).toBe('1175.0');

        const onePointFiveUsdtConvertedToTlosBn = convertCurrency(BigNumber.from(onePointFiveUsdt), usdtDecimals, tlosDecimals, conversionFactorFromUsdtToTlos);
        const onePointFiveUsdtConvertedToTlos = formatUnits(onePointFiveUsdtConvertedToTlosBn, tlosDecimals);
        expect(onePointFiveUsdtConvertedToTlos).toBe('7.5');

        const onePointOneTwoFiveSevenThreeUsdtConvertedToTlosBn = convertCurrency(BigNumber.from(onePointOneTwoFiveSevenThreeUsdt), usdtDecimals, tlosDecimals, conversionFactorFromUsdtToTlos);
        const onePointOneTwoFiveSevenThreeUsdtConvertedToTlos = formatUnits(onePointOneTwoFiveSevenThreeUsdtConvertedToTlosBn, tlosDecimals);
        expect(onePointOneTwoFiveSevenThreeUsdtConvertedToTlos).toBe('5.62865');

        // USD uses the same conversion factor as USDT in this example
        const oneUsdConvertedToTlosBn = convertCurrency(BigNumber.from(oneUsd), usdDecimals, tlosDecimals, conversionFactorFromUsdtToTlos);
        const oneUsdConvertedToTlos = formatUnits(oneUsdConvertedToTlosBn, tlosDecimals);
        expect(oneUsdConvertedToTlos).toBe('5.0');

        // sanity check - one wei should be preserved
        const tinyTlosConvertedToOtherBn = convertCurrency(BigNumber.from('1'), tlosDecimals, tlosDecimals, 3);
        const tinyTlosConvertedToOther = formatUnits(tinyTlosConvertedToOtherBn, tlosDecimals);
        expect(tinyTlosConvertedToOther).toBe('0.000000000000000003');
    });
});
