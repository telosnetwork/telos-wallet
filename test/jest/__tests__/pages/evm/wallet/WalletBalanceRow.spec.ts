import { shallowMount } from '@vue/test-utils';

const fakeBuyMoreLink = 'fake';
const fakeStlosContractAddress = '0x'.concat('9'.repeat(40));
const fakeWtlosContractAddress = '0x'.concat('8'.repeat(40));
const fakeTokenContractAddress = '0x'.concat('7'.repeat(40));
const chainStoreMock = {
    useChainStore: () => ({
        currentChain: {
            settings: {
                getBuyMoreOfTokenLink: () => fakeBuyMoreLink,
                getStlosContractAddress: () => fakeStlosContractAddress,
                getWtlosContractAddress: () => fakeWtlosContractAddress,
            },
        },
    }),
};

import WalletBalanceRow from 'pages/evm/wallet/WalletBalanceRow.vue';
import * as antelope from 'src/antelope';
import { stubWithSlot } from 'test/jest/testing-helpers';

jest.mock('src/antelope', () => chainStoreMock);
describe('WalletBalanceRow.vue', () => {
    const stubs = {
        'q-tooltip': stubWithSlot('q-tooltip'),
        'q-menu': stubWithSlot('q-menu'),
        'q-btn': stubWithSlot('q-btn'),
    };

    it('should have the correct name', () => {
        expect(WalletBalanceRow.name).toBe('WalletBalanceRow');
    });

    it('should render correctly on desktop devices', () => {
        const wrapper = shallowMount(WalletBalanceRow, {
            global: {
                stubs,
                mocks: {
                    $q: {
                        screen: {
                            lt: {
                                lg: false,
                            },
                        },
                    },
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
                },
            },
        });
        expect(wrapper.element).toMatchSnapshot();
    });

    it('should render correctly on mobile devices', () => {
        const wrapper = shallowMount(WalletBalanceRow, {
            global: {
                stubs,
                mocks: {
                    $q: {
                        screen: {
                            lt: {
                                lg: true,
                            },
                        },
                    },
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
                },
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
            process.env.EVM_NETWORK_EXPLORER = 'fake-url';
        });

        beforeEach(() => {
            jest.clearAllMocks();
        });

        afterAll(() => {
            window.open = originalWindowOpen;
            process.env.EVM_NETWORK_EXPLORER = undefined;
        });

        test('TLOS', async () => {
            const wrapper = shallowMount(WalletBalanceRow, {
                global: {
                    stubs,
                    mocks: {
                        $router: routerMock,
                        $q: {
                            screen: {
                                lt: {
                                    lg: true,
                                },
                            },
                        },
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
                    },
                    tokenIsTlos: true,
                },
            });

            // snapshot contains c-wallet-balance-row__overflow-li for stake, buy, wrap, send
            expect(wrapper.element).toMatchSnapshot();

            const [
                stakeLink,
                buyLink,
                wrapLink,
                sendLink,
            ] = wrapper.findAll('.c-wallet-balance-row__overflow-li');

            await stakeLink.trigger('click');
            await buyLink.trigger('click');
            await wrapLink.trigger('click');
            await sendLink.trigger('click');

            expect(window.open).toHaveBeenCalledTimes(1);
            expect(routerMock.push).toHaveBeenCalledTimes(3);

            expect(routerMock.push.mock.calls[0][0]).toEqual(expect.objectContaining({
                name: 'evm-staking',
            }));

            expect(routerMock.push.mock.calls[1][0]).toEqual(expect.objectContaining({
                name: 'evm-wrap',
            }));

            expect(routerMock.push.mock.calls[2][0]).toEqual(expect.objectContaining({
                name: 'evm-send',
                query: { },
            }));

            expect(window.open).toHaveBeenCalledWith(fakeBuyMoreLink, '_blank');
        });

        test('STLOS', async () => {
            const wrapper = shallowMount(WalletBalanceRow, {
                global: {
                    stubs,
                    mocks: {
                        $router: routerMock,
                        $q: {
                            screen: {
                                lt: {
                                    lg: true,
                                },
                            },
                        },
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
                    },
                },
            });

            // snapshot contains c-wallet-balance-row__overflow-li for stake, contract, send
            expect(wrapper.element).toMatchSnapshot();

            const [
                stakeLink,
                contractLink,
                sendLink,
            ] = wrapper.findAll('.c-wallet-balance-row__overflow-li');

            await stakeLink.trigger('click');
            await contractLink.trigger('click');
            await sendLink.trigger('click');

            expect(window.open).toHaveBeenCalledTimes(1);
            expect(routerMock.push).toHaveBeenCalledTimes(2);

            expect(routerMock.push.mock.calls[0][0]).toEqual(expect.objectContaining({
                name: 'evm-staking',
            }));

            expect(routerMock.push.mock.calls[1][0]).toEqual(expect.objectContaining({
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
                    mocks: {
                        $router: routerMock,
                        $q: {
                            screen: {
                                lt: {
                                    lg: true,
                                },
                            },
                        },
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
                    },
                },
            });

            // snapshot contains c-wallet-balance-row__overflow-li for unwrap, contract, send
            expect(wrapper.element).toMatchSnapshot();

            const [
                unwrapLink,
                contractLink,
                sendLink,
            ] = wrapper.findAll('.c-wallet-balance-row__overflow-li');

            await unwrapLink.trigger('click');
            await contractLink.trigger('click');
            await sendLink.trigger('click');

            expect(window.open).toHaveBeenCalledTimes(1);
            expect(routerMock.push).toHaveBeenCalledTimes(2);

            expect(routerMock.push.mock.calls[0][0]).toEqual(expect.objectContaining({
                name: 'evm-wrap',
                query: { tab: 'unwrap' },
            }));

            expect(routerMock.push.mock.calls[1][0]).toEqual(expect.objectContaining({
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
                    mocks: {
                        $router: routerMock,
                        $q: {
                            screen: {
                                lt: {
                                    lg: true,
                                },
                            },
                        },
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
                    },
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
