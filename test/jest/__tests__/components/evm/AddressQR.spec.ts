/* eslint-disable @typescript-eslint/no-explicit-any */
import { shallowMount, VueWrapper } from '@vue/test-utils';
import AddressQR from 'components/evm/AddressQR.vue';

import QRious from 'qrious';

const CANVAS_ID = 'qr-code';
const DEFAULT_CANVAS_SIZE = 400;
const ADDRESS_A = '0x1234567890123456789012345678901234567890';
const BACKGROUND_COLOR = 'rgb(11, 22, 33)';

Object.defineProperty(window, 'getComputedStyle', {
    value: () => ({
        getPropertyValue: () => BACKGROUND_COLOR,
    }),
});

describe('AddressQR.vue', () => {
    const getNewWrapper = () => shallowMount(AddressQR, {
        props: {
            address: ADDRESS_A,
        },
        attachTo: document.body,
        global: {
            mocks: {
                $style: {
                    '--accent-color-5': BACKGROUND_COLOR,
                },
            },
        },
    }) as VueWrapper<any>;

    let wrapper: VueWrapper<any>;

    beforeEach(() => {
        wrapper = getNewWrapper();
    });

    afterEach(() => {
        wrapper.unmount();
    });

    it('renders correctly', async () => {
        expect(wrapper.element).toMatchSnapshot();
    });

    it('sets background color based on header bg color', () => {
        expect((wrapper.vm.qrInstance as QRious).background).toBe(BACKGROUND_COLOR);
    });

    it('sets level to H', () => {
        expect((wrapper.vm.qrInstance as QRious).level).toBe('H');
    });

    it('sets canvas size default to 400 if not provided', () => {
        expect((wrapper.vm.qrInstance as QRious).size).toBe(DEFAULT_CANVAS_SIZE);
    });

    it('sets canvas size to optional "size" prop value if provided', () => {
        const NEW_SIZE = 999;
        wrapper = shallowMount(AddressQR, {
            props: {
                address: ADDRESS_A,
                size: NEW_SIZE,
            },
        });
        expect((wrapper.vm.qrInstance as QRious).size).toBe(NEW_SIZE);
    });

    it('sets canvas element based on hard-coded canvas id', () => {
        expect(((wrapper.vm.qrInstance as QRious).element as HTMLCanvasElement).id).toBe(CANVAS_ID);
    });

    it('sets qr code value to required address prop', () => {
        expect((wrapper.vm.qrInstance as QRious).value).toBe(ADDRESS_A);
    });
});
