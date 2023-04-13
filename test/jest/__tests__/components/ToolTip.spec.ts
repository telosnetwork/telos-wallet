import { shallowMount } from '@vue/test-utils';
import ToolTip from 'components/ToolTip.vue';
import { stubWithSlot } from 'test/jest/testing-helpers';

describe('ToolTip.vue', () => {
    it('should render correctly', async () => {
        const wrapper = shallowMount(ToolTip, {
            global: {
                stubs: {
                    'q-tooltip': stubWithSlot('q-tooltip'),
                },
            },
            props: {
                text: 'Test',
            },
        });

        // no warning text
        expect(wrapper.element).toMatchSnapshot();

        await wrapper.setProps({
            warnings: ['test', 'test2'],
        });

        // with warning text
        expect(wrapper.element).toMatchSnapshot();
    });
});
