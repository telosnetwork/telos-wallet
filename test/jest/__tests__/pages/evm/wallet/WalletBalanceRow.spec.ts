import { shallowMount } from '@vue/test-utils';

const fakeBuyMoreLink = 'fake';
const fakeStlosContractAddress = '0x'.concat('9'.repeat(40));
const fakeWtlosContractAddress = '0x'.concat('8'.repeat(40));
const fakeTokenContractAddress = '0x'.concat('7'.repeat(40));
const storeMock = {
    useChainStore: () => ({
        currentChain: {
            settings: {
                getBuyMoreOfTokenLink: () => fakeBuyMoreLink,
                getStakedNativeTokenAddress: () => fakeStlosContractAddress,
                getWrappedNativeTokenAddress: () => fakeWtlosContractAddress,
                getExplorerUrl: () => 'fake-url',
            },
        },
    }),
    useUserStore: () => ({
        fiatLocale: 'en-US',
        fiatCurrency: 'USD',
    }),
    useEVMStore: () => ({
        isMetamaskSupported: false,
    }),
};

import WalletBalanceRow from 'pages/evm/wallet/WalletBalanceRow.vue';
import { EvmToken, NativeCurrencyAddress } from 'src/antelope/types';

import { stubWithSlot } from 'test/jest/testing-helpers';

jest.mock('src/antelope', () => storeMock);

describe('WalletBalanceRow.vue', () => {
    const stubs = {
        'ToolTip': stubWithSlot('ToolTip'),
        'q-menu': stubWithSlot('q-menu'),
        'q-btn': stubWithSlot('q-btn'),
    };

    const directives = {
        'close-popup': ()  => '',
    };

    const qScreenMock = (isMobile: boolean) => ({
        $q: {
            screen: {
                lt: {
                    sm: isMobile,
                },
            },
        },
    });

    it('should have the correct name', () => {
        expect(WalletBalanceRow.name).toBe('WalletBalanceRow');
    });

    it('should render correctly on desktop devices', () => {
        const wrapper = shallowMount(WalletBalanceRow, {
            global: {
                stubs,
                directives,
                mocks: {
                    ...qScreenMock(false),
                },
            },
            props: {
                token: {
                    address: fakeStlosContractAddress,
                    symbol: 'STLOS',
                    name: 'Staked TLOS',
                    logoURI: 'https://raw.githubusercontent.com/telosnetwork/teloscan/master/public/stlos-logo.png',
                    decimals: 18,
                    balance: '3642.0243',
                    fullBalance: '3642.024318091460206147',
                } as EvmToken,
            },
        });
        expect(wrapper.element).toMatchSnapshot();
    });

    it('should render correctly on mobile devices', () => {
        const wrapper = shallowMount(WalletBalanceRow, {
            global: {
                stubs,
                directives,
                mocks: {
                    ...qScreenMock(true),
                },
            },
            props: {
                token: {
                    address: fakeStlosContractAddress,
                    symbol: 'STLOS',
                    name: 'Staked TLOS',
                    logoURI: 'https://raw.githubusercontent.com/telosnetwork/teloscan/master/public/stlos-logo.png',
                    decimals: 18,
                    balance: '3642.0243',
                    fullBalance: '3642.024318091460206147',
                } as EvmToken,
            },
        });
        expect(wrapper.element).toMatchSnapshot();
    });

    describe('should render the right overflow items when the token is', () => {
        const routerMock = {
            push: jest.fn(),
        };

        const originalWindowOpen = window.open;

        beforeAll(() => {
            window.open = jest.fn();
        });

        beforeEach(() => {
            jest.clearAllMocks();
        });

        afterAll(() => {
            window.open = originalWindowOpen;
        });

        test('TLOS', async () => {
            const wrapper = shallowMount(WalletBalanceRow, {
                global: {
                    stubs,
                    directives,
                    mocks: {
                        $router: routerMock,
                        ...qScreenMock(true),
                    },
                },
                props: {
                    token: {
                        symbol: 'TLOS',
                        name: 'Telos',
                        logoURI: 'https://raw.githubusercontent.com/telosnetwork/teloscan/master/public/stlos-logo.png',
                        decimals: 18,
                        balance: '3642.0243',
                        fullBalance: '3642.024318091460206147',
                        address: NativeCurrencyAddress,
                    } as EvmToken,
                },
            });

            // snapshot contains c-wallet-balance-row__overflow-li for stake, buy, wrap, send
            expect(wrapper.element).toMatchSnapshot();

            const [
                // stakeLink,
                buyLink,
                // wrapLink,
                sendLink,
            ] = wrapper.findAll('.c-wallet-balance-row__overflow-li');

            // await stakeLink.trigger('click');
            await buyLink.trigger('click');
            // await wrapLink.trigger('click');
            await sendLink.trigger('click');

            expect(window.open).toHaveBeenCalledTimes(1);
            // expect(routerMock.push).toHaveBeenCalledTimes(3);
            expect(routerMock.push).toHaveBeenCalledTimes(1);

            // expect(routerMock.push.mock.calls[0][0]).toEqual(expect.objectContaining({
            //     name: 'evm-staking',
            // }));

            // expect(routerMock.push.mock.calls[1][0]).toEqual(expect.objectContaining({
            //     name: 'evm-wrap',
            // }));

            expect(routerMock.push.mock.calls[0][0]).toEqual(expect.objectContaining({
                name: 'evm-send',
                query: { },
            }));

            expect(window.open).toHaveBeenCalledWith(fakeBuyMoreLink, '_blank');
        });

        test('STLOS', async () => {
            const wrapper = shallowMount(WalletBalanceRow, {
                global: {
                    stubs,
                    directives,
                    mocks: {
                        $router: routerMock,
                        ...qScreenMock(true),
                    },
                },
                props: {
                    token: {
                        address: fakeStlosContractAddress,
                        symbol: 'STLOS',
                        name: 'Staked TLOS',
                        logoURI: 'https://raw.githubusercontent.com/telosnetwork/teloscan/master/public/stlos-logo.png',
                        decimals: 18,
                        balance: '3642.0243',
                        fullBalance: '3642.024318091460206147',
                    } as EvmToken,
                },
            });

            // snapshot contains c-wallet-balance-row__overflow-li for unstake, contract, send
            expect(wrapper.element).toMatchSnapshot();

            const [
                // stakeLink,
                contractLink,
                sendLink,
            ] = wrapper.findAll('.c-wallet-balance-row__overflow-li');

            // await stakeLink.trigger('click');
            await contractLink.trigger('click');
            await sendLink.trigger('click');

            expect(window.open).toHaveBeenCalledTimes(1);
            // expect(routerMock.push).toHaveBeenCalledTimes(2);
            expect(routerMock.push).toHaveBeenCalledTimes(1);

            // expect(routerMock.push.mock.calls[0][0]).toEqual(expect.objectContaining({
            //     name: 'evm-staking',
            // }));

            expect(routerMock.push.mock.calls[0][0]).toEqual(expect.objectContaining({
                name: 'evm-send',
                query: {
                    token: fakeStlosContractAddress,
                },
            }));

            expect(window.open).toHaveBeenCalledWith(
                `fake-url/address/${fakeStlosContractAddress}`,
                '_blank',
            );
        });

        test('WTLOS', async () => {
            const wrapper = shallowMount(WalletBalanceRow, {
                global: {
                    stubs,
                    directives,
                    mocks: {
                        $router: routerMock,
                        ...qScreenMock(true),
                    },
                },
                props: {
                    token: {
                        address: fakeWtlosContractAddress,
                        symbol: 'WTLOS',
                        name: 'Wrapped TLOS',
                        logoURI: 'https://raw.githubusercontent.com/telosnetwork/teloscan/master/public/stlos-logo.png',
                        decimals: 18,
                        balance: '3642.0243',
                        fullBalance: '3642.024318091460206147',
                    } as EvmToken,
                },
            });

            // snapshot contains c-wallet-balance-row__overflow-li for unwrap, contract, send
            expect(wrapper.element).toMatchSnapshot();

            const [
                // unwrapLink,
                contractLink,
                sendLink,
            ] = wrapper.findAll('.c-wallet-balance-row__overflow-li');

            // await unwrapLink.trigger('click');
            await contractLink.trigger('click');
            await sendLink.trigger('click');

            expect(window.open).toHaveBeenCalledTimes(1);
            // expect(routerMock.push).toHaveBeenCalledTimes(2);
            expect(routerMock.push).toHaveBeenCalledTimes(1);

            // expect(routerMock.push.mock.calls[0][0]).toEqual(expect.objectContaining({
            //     name: 'evm-wrap',
            //     query: { tab: 'unwrap' },
            // }));

            expect(routerMock.push.mock.calls[0][0]).toEqual(expect.objectContaining({
                name: 'evm-send',
                query: {
                    token: fakeWtlosContractAddress,
                },
            }));

            expect(window.open).toHaveBeenCalledWith(
                `fake-url/address/${fakeWtlosContractAddress}`,
                '_blank',
            );
        });

        test('not a system token', async () => {
            const wrapper = shallowMount(WalletBalanceRow, {
                global: {
                    stubs,
                    directives,
                    mocks: {
                        $router: routerMock,
                        ...qScreenMock(true),
                    },
                },
                props: {
                    token: {
                        address: fakeTokenContractAddress,
                        symbol: 'SHIB',
                        name: 'Shiba',
                        logoURI: 'https://raw.githubusercontent.com/telosnetwork/teloscan/master/public/stlos-logo.png',
                        decimals: 18,
                        balance: '3642.0243',
                        fullBalance: '3642.024318091460206147',
                    } as EvmToken,
                },
            });

            // snapshot contains c-wallet-balance-row__overflow-li for contract, send
            expect(wrapper.element).toMatchSnapshot();

            const [
                contractLink,
                sendLink,
            ] = wrapper.findAll('.c-wallet-balance-row__overflow-li');

            await contractLink.trigger('click');
            await sendLink.trigger('click');

            expect(window.open).toHaveBeenCalledTimes(1);
            expect(routerMock.push).toHaveBeenCalledTimes(1);

            expect(routerMock.push.mock.calls[0][0]).toEqual(expect.objectContaining({
                name: 'evm-send',
                query: {
                    token: fakeTokenContractAddress,
                },
            }));

            expect(window.open).toHaveBeenCalledWith(
                `fake-url/address/${fakeTokenContractAddress}`,
                '_blank',
            );
        });
    });
});
