import { shallowMount } from '@vue/test-utils';

jest.mock('src/antelope', () => ({
    useUserStore: () => ({
        fiatLocale: 'en-US',
        fiatCurrency: 'USD',
    }),
}));

import BigFiatText from 'components/evm/BigFiatText.vue';
describe('BigFiatText.vue', () => {
    it('should have the correct name', () => {
        expect(BigFiatText.name).toBe('BigFiatText');
    });

    it('should render correctly', () => {
        const wrapper = shallowMount(BigFiatText, {
            props: {
                amount: 12345,
            },
        });

        expect(wrapper.element).toMatchSnapshot();
    });
});
