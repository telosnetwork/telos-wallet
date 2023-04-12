import { shallowMount } from '@vue/test-utils';

import * as antelope from 'src/antelope';
jest.mock('src/antelope', () => ({
    useUserStore: () => ({
        locale: 'en-US',
        currency: 'USD',
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
