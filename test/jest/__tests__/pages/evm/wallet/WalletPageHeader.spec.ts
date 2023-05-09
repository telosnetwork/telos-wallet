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

jest.mock('src/antelope', () => chainStoreMock);

describe('WalletPageHeader.vue', () => {
    const routerMock = {
        push: jest.fn(),
    };

    it('should render properly', async () => {
        const originalWindowOpen = window.open;

        const wrapper = shallowMount(WalletPageHeader, {
            global: {
                mocks: {
                    $router: routerMock,
                },
            },
        });

        window.open = jest.fn();

        expect(wrapper.element).toMatchSnapshot();

        const [
            sendLink,
            receiveLink,
            buyLink,
        ] = wrapper.findAll('.c-wallet-page-header__link');

        await sendLink.trigger('click');
        await receiveLink.trigger('click');
        await buyLink.trigger('click');

        expect(routerMock.push).toHaveBeenCalledTimes(2);
        expect(routerMock.push.mock.calls[0][0]).toEqual(expect.objectContaining({
            name: 'evm-send',
        }));
        expect(routerMock.push.mock.calls[1][0]).toEqual(expect.objectContaining({
            name: 'evm-receive',
        }));

        expect(window.open).toHaveBeenCalledTimes(1);
        expect(window.open).toHaveBeenCalledWith(fakeBuyMoreLink, '_blank');

        window.open = originalWindowOpen;
    });
});
