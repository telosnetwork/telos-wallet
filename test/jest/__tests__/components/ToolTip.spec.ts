import { shallowMount } from '@vue/test-utils';
import ToolTip from 'components/ToolTip.vue';
import { stubWithSlot } from 'test/jest/testing-helpers';

describe('ToolTip.vue', () => {
    const globalOpts = {
        stubs: {
            'q-tooltip': stubWithSlot('q-tooltip'),
        },
    };

    it('should render correctly with default options', async () => {
        const wrapper = shallowMount(ToolTip, {
            global: { ...globalOpts },
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

    it('should render correctly with hidden icon', () => {
        const wrapper = shallowMount(ToolTip, {
            global: { ...globalOpts },
            props: {
                text: 'Test',
                hideIcon: true,
            },
        });

        // no warning text
        expect(wrapper.element).toMatchSnapshot();
    });

    it('should render correctly with something in its slot', () => {
        const wrapper = shallowMount(ToolTip, {
            global: { ...globalOpts },
            props: {
                text: 'Test',
            },
            slots: {
                default: 'slot content',
            },
        });

        // no warning text
        expect(wrapper.element).toMatchSnapshot();
    });
});
