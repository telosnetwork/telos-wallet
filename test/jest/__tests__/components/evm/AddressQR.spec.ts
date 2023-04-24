import { shallowMount, VueWrapper } from '@vue/test-utils';
import AddressQR from 'components/evm/AddressQR.vue';
import QRious from 'qrious';
import { ComponentPublicInstance } from 'vue';

const CANVAS_ID = 'qr-code';
const DEFAULT_CANVAS_SIZE = 400;
const ADDRESS_A = '0x1234567890123456789012345678901234567890';
const ADDRESS_B = '0x0000000000000000000000000000000000000000';
const BACKGROUND_COLOR = 'rgb(0, 0, 0)';

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
        },
        attachTo: document.body,
        global: {
            mocks: {
                $style: {
                    '--header-bg-color': BACKGROUND_COLOR,
                },
            },
        },
    }) as VueWrapper<InstanceType<typeof AddressQR>>;

    let wrapper: VueWrapper<InstanceType<typeof AddressQR>>;

    beforeEach(() => {
        wrapper = getNewWrapper();
        wrapper.vm.hasOwnProperty = Object.hasOwnProperty;
    });

    afterEach(() => {
        wrapper.unmount();
    });

    it('renders correctly', async () => {
        expect(wrapper.element).toMatchSnapshot();
    });

    it('has the correct name', () => {
        expect(AddressQR.name).toBe('AddressQR');
    });

    it('calls generateQrCode on mount', async () => {
        const methodSpy = jest.spyOn(AddressQR.methods as any, 'generateQrCode');

        shallowMount(AddressQR, { props: { address: ADDRESS_A } }) as VueWrapper<ComponentPublicInstance>;

        expect(methodSpy).toHaveBeenCalledTimes(1);
    });

    it('calls generateQrCode when the address prop is changed', async () => {
        const methodSpy = jest.spyOn(wrapper.vm, 'generateQrCode');

        wrapper.setProps({ address: ADDRESS_B });
        await (wrapper.vm as WrapperVM).$nextTick();

        expect(methodSpy).toHaveBeenCalledTimes(1);
    });

    describe('generateQrCode', () => {
        it.skip('generates a unique QR Code based on address value', async () => {
            expect((wrapper.vm.qrInstance as QRious).value).toBe(ADDRESS_A);

            // get raw image data
            const testCanvasA = document.getElementById(CANVAS_ID) as HTMLCanvasElement;
            const canvasContextA = testCanvasA.getContext('2d');
            const testImageDataA =  canvasContextA?.getImageData(0, 0, testCanvasA.width, testCanvasA.height).data;

            wrapper.setProps({ address: ADDRESS_B });
            await wrapper.vm.$nextTick();

            expect((wrapper.vm.qrInstance as QRious).value).toBe(ADDRESS_B);

            // get raw image data
            const testCanvasB = document.getElementById(CANVAS_ID) as HTMLCanvasElement;
            const canvasContextB = testCanvasB.getContext('2d');
            const testImageDataB =  canvasContextB?.getImageData(0, 0, testCanvasB.width, testCanvasB.height).data;


            // // set address back to original address and confirm img data matches initial
            // wrapper.setProps({ address: ADDRESS_A });
            // await (wrapper.vm as WrapperVM).$nextTick();

            // expect((wrapper.vm as AddressQR).qrInstance.value).toBe(ADDRESS_A);

            // const testCanvasC = document.getElementById(CANVAS_ID) as HTMLCanvasElement;
            // const canvasContextC = testCanvasC.getContext('2d');
            // const testImageDataC =  (canvasContextC?.getImageData(0, 0, testCanvasC.width, testCanvasC.height))?.data;

            expect(testImageDataA).not.toEqual(testImageDataB);
            // expect(testImageDataA).toEqual(testImageDataC);
        });

        it('sets qrious instance to null if the address prop is an empty string', async () => {
            expect(wrapper.vm.qrInstance).not.toBeNull();

            wrapper.setProps({ address: '' });
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.qrInstance).toBeNull();
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
});
