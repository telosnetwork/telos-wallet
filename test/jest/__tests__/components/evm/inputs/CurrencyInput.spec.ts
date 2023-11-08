import CurrencyInput from 'components/evm/inputs/CurrencyInput.vue';
import { shallowMount } from '@vue/test-utils';
import { BigNumber } from 'ethers';
import { oneEthInWei, oneThousandFiveHundredEthInWei, stubWithSlot } from 'test/jest/testing-helpers';

jest.mock('src/antelope', () => ({
    usePlatformStore: () => ({
        isIOSMobile: false,
    }),
}));

describe('CurrencyInput.vue', () => {
    const stubs = {
        'ToolTip': stubWithSlot('ToolTip'),
        'q-spinner': stubWithSlot('q-spinner'),
    };

    it('should have the correct name', () => {
        expect(CurrencyInput.name).toEqual('CurrencyInput');
    });

    it('should emit the correct values when currencies are not swapped', async () => {
        const wrapper = shallowMount(CurrencyInput, {
            global: {
                stubs,
            },
            propsData: {
                modelValue: BigNumber.from(0),
                symbol: 'TLOS',
                decimals: 18,
                secondaryCurrencyConversionFactor: '0.19',
                secondaryCurrencyCode: 'USD',
                secondaryCurrencyDecimals: 2,
                locale: 'en-US',
                label: 'TLOS / USD',
                name: 'test',
            },
        });
        const inputElement = wrapper.find('input');

        expect(wrapper.element).toMatchSnapshot(); // blank
        await inputElement.setValue('1');
        expect(wrapper.emitted('update:modelValue')?.length).toBe(1);
        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([BigNumber.from(oneEthInWei)]);

        await wrapper.setProps({
            modelValue: BigNumber.from(oneEthInWei),
        });

        // no new value should be emitted when modelValue is updated to the same value as was emitted
        expect(wrapper.emitted('update:modelValue')?.length).toBe(1);
        expect(wrapper.element).toMatchSnapshot(); // 1 in the input, 0.19 in the secondary currency
        expect(inputElement.element.value).toBe('1');

        await inputElement.setValue('1,500');
        expect(wrapper.emitted('update:modelValue')?.length).toBe(2);
        expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([BigNumber.from(oneThousandFiveHundredEthInWei)]);

        await wrapper.setProps({
            modelValue: BigNumber.from(oneThousandFiveHundredEthInWei),
        });

        expect(wrapper.emitted('update:modelValue')?.length).toBe(2);
        expect(wrapper.element).toMatchSnapshot(); // 1,500 in the input, 285 in the secondary currency
        expect(inputElement.element.value).toBe('1,500');
    });

    it('should emit the correct values when currencies are swapped', async () => {
        const wrapper = shallowMount(CurrencyInput, {
            global: {
                stubs,
            },
            propsData: {
                modelValue: BigNumber.from(0),
                symbol: 'TLOS',
                decimals: 18,
                secondaryCurrencyConversionFactor: '0.2',
                secondaryCurrencyCode: 'USD',
                secondaryCurrencyDecimals: 2,
                locale: 'en-US',
                label: 'TLOS / USD',
                name: 'test-2',
            },
        });
        const inputElement = wrapper.find('input');

        await wrapper.find('.c-currency-input__currency-switcher').trigger('click');
        expect(wrapper.emitted('update:modelValue')?.length).toBe(undefined);

        await inputElement.setValue('0.2');

        expect(wrapper.emitted('update:modelValue')?.length).toBe(1);
        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([BigNumber.from(oneEthInWei)]);

        await wrapper.setProps({
            modelValue: BigNumber.from(oneEthInWei),
        });
        expect(wrapper.emitted('update:modelValue')?.length).toBe(1);
        expect(wrapper.element).toMatchSnapshot(); // 0.2 in the input, 1 in the secondary currency
    });
});
