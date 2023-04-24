import { shallowMount, VueWrapper } from '@vue/test-utils';
import AddressQR from 'components/evm/AddressQR.vue';
import QRious from 'qrious';

const SIZE_A = 400;
const ADDRESS_A = '0x1234567890123456789012345678901234567890';
const ADDRESS_B = '0x0000000000000000000000000000000000000000';
const BACKGROUND_COLOR = 'rgb(0, 0, 0)';

jest.mock('qrious', () => jest.fn());

Object.defineProperty(window, 'getComputedStyle', {
    value: () => ({
        getPropertyValue: () => BACKGROUND_COLOR,
    }),
});

interface WrapperVM {$nextTick: ()=>Promise<void>}

describe('AddressQR.vue', () => {
    const getNewWrapper = () => shallowMount(AddressQR, {
        props: {
            address: ADDRESS_A,
            size: SIZE_A,
        },
        attachTo: document.body,
        global: {
            mocks: {
                $style: {
                    '--header-bg-color': BACKGROUND_COLOR,
                },
            },
        },
    }) as VueWrapper<never>;

    let wrapper: VueWrapper<never>;

    beforeEach(() => {
        wrapper = getNewWrapper();
    });

    afterEach(() => {
        wrapper.unmount();
        (QRious as jest.Mock).mockReset();
    });

    it('should render correctly', async () => {
        expect(wrapper.element).toMatchSnapshot();
    });

    it('should have the correct name', () => {
        expect(AddressQR.name).toBe('AddressQR');
    });

    it('should render a canvas element with the id "qr-code"', () => {
        expect(wrapper.find('#qr-code').exists()).toBe(true);
    });

    it('should call QRious with the correct options', () => {
        expect(QRious).toHaveBeenCalledWith({
            background: BACKGROUND_COLOR,
            level: 'H',
            size: SIZE_A,
            element: expect.any(HTMLElement),
            value: ADDRESS_A,
        });
    });

    it('should update the QR code when the address prop is changed', async () => {
        wrapper.setProps({ address: ADDRESS_B });
        await (wrapper.vm as WrapperVM).$nextTick();
        expect(QRious).toHaveBeenCalledWith({
            background: BACKGROUND_COLOR,
            level: 'H',
            size: SIZE_A,
            element: expect.any(HTMLElement),
            value: ADDRESS_B,
        });
    });


    it('should not call QRious if the address prop is an empty string', async () => {
        // expect to be called once in beforeEach
        expect(QRious).toHaveBeenCalledTimes(1);
        wrapper.setProps({ address: '' });
        await (wrapper.vm as WrapperVM).$nextTick();

        // expect to not be called again
        expect(QRious).toHaveBeenCalledTimes(1);
    });

});
