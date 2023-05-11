import { shallowMount } from '@vue/test-utils';

const fakeBuyMoreLink = 'test';
const chainStoreMock = {
    useChainStore: () => ({
        currentChain: {
            settings: {
                getBuyMoreOfTokenLink: () => fakeBuyMoreLink,
            },
        },
    }),
};

import WalletPageHeader from 'pages/evm/wallet/WalletPageHeader.vue';

jest.mock('vue-router', () => ({
    useRoute: jest.fn(),
    useRouter: jest.fn(() => ({
        push: jest.fn(),
    })),
}));

jest.mock('src/antelope', () => chainStoreMock);

describe('WalletPageHeader.vue', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let wrapper: any;

    beforeEach(() => {
        wrapper = shallowMount(WalletPageHeader, {
            props: {
                totalBalance: 123456.78,
            },
        });
    });

    it('should render properly', async () => {
        expect(wrapper.element).toMatchSnapshot();
    });

    it('should call goToRoute on click send', async () => {
        const sendLink = wrapper.findAll('.c-wallet-page-header__link')[0];
        const methodSpy = jest.spyOn(wrapper.vm, 'goToRoute');

        await sendLink.trigger('click');

        expect(methodSpy).toHaveBeenCalledTimes(1);
        expect(methodSpy).toHaveBeenCalledWith('evm-send');
    });

    it('should call goToRoute on click receive', async () => {
        const receiveLink = wrapper.findAll('.c-wallet-page-header__link')[1];
        const methodSpy = jest.spyOn(wrapper.vm, 'goToRoute');

        await receiveLink.trigger('click');

        expect(methodSpy).toHaveBeenCalledTimes(1);
        expect(methodSpy).toHaveBeenCalledWith('evm-receive');
    });

    describe('goToRoute', () => {

        it('should call push with named route', () => {
            const fakeRoute = 'fake-route';
            wrapper.vm.goToRoute(fakeRoute);

            expect(wrapper.vm.router.push).toHaveBeenCalledTimes(1);
            expect(wrapper.vm.router.push).toHaveBeenCalledWith({ name: fakeRoute });
        });
    });

    describe('goToBuy', () => {

        it('should call window.open', () => {
            const originalWindowOpen = window.open;
            window.open = jest.fn();

            wrapper.vm.goToBuy();

            expect(window.open).toHaveBeenCalledTimes(1);
            expect(window.open).toHaveBeenCalledWith(fakeBuyMoreLink, '_blank');

            window.open = originalWindowOpen;
        });
    });

});
