import { shallowMount } from '@vue/test-utils';
import { ethers } from 'ethers';
import {
    MarketSourceInfo,
    NativeCurrencyAddress,
    TokenBalance,
    TokenClass,
    TokenMarketData,
    TokenSourceInfo,
} from 'src/antelope/types';

const fakeBuyMoreLink = 'fake';
const fakeStlosContractAddress = '0x'.concat('9'.repeat(40));
const fakeWtlosContractAddress = '0x'.concat('8'.repeat(40));
const fakeTokenContractAddress = '0x'.concat('7'.repeat(40));

const fakeStakedToken = new TokenClass({
    name: 'Staked TLOS',
    symbol: 'STLOS',
    network: 'NETWORK',
    decimals: 18,
    address: fakeStlosContractAddress,
    logoURI: 'https://raw.githubusercontent.com/telosnetwork/teloscan/master/public/stlos-logo.png',
} as TokenSourceInfo);


const fakeWrappedToken = new TokenClass({
    name: 'Wrapped TLOS',
    symbol: 'WTLOS',
    network: 'NETWORK',
    decimals: 18,
    address: fakeWtlosContractAddress,
    logoURI: 'https://raw.githubusercontent.com/telosnetwork/token-list/main/logos/wtlos.png',
} as TokenSourceInfo);

import WalletBalanceRow from 'pages/evm/wallet/WalletBalanceRow.vue';
import { stubWithSlot } from 'test/jest/testing-helpers';

jest.mock('src/antelope', () => ({
    useChainStore: () => ({
        currentChain: {
            settings: {
                getBuyMoreOfTokenLink: () => fakeBuyMoreLink,
                getStakedSystemToken: () => fakeStakedToken,
                getWrappedSystemToken: () => fakeWrappedToken,
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
}));

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

    const createTokenBalance = (_token: Partial<TokenSourceInfo>, price?: string): TokenBalance => {
        const token = new TokenClass(_token as TokenSourceInfo);
        const market = new TokenMarketData({ price } as MarketSourceInfo);
        if (price) {
            token.market = market;
        }
        const balanceBn = ethers.utils.parseUnits(_token.fullBalance || '0', token.decimals);
        const balance = new TokenBalance(token, balanceBn);
        return balance;
    };

    it('should have the correct name', () => {
        expect(WalletBalanceRow.name).toBe('WalletBalanceRow');
    });

    it('should render correctly on desktop devices (Staked TLOS 1)', () => {
        const wrapper = shallowMount(WalletBalanceRow, {
            global: {
                stubs,
                directives,
                mocks: {
                    ...qScreenMock(false),
                },
            },
            props: {
                balance: createTokenBalance({
                    address: fakeStlosContractAddress,
                    symbol: 'STLOS',
                    name: 'Staked TLOS',
                    logoURI: 'https://raw.githubusercontent.com/telosnetwork/token-list/main/logos/wtlos.png',
                    decimals: 18,
                    balance: '3642.0243',
                    fullBalance: '3642.024318091460206147',
                },
                '0.19',
                ),
            },
        });
        expect(wrapper.element).toMatchSnapshot();
    });

    it('should render correctly on mobile devices (Staked TLOS 2)', () => {
        const wrapper = shallowMount(WalletBalanceRow, {
            global: {
                stubs,
                directives,
                mocks: {
                    ...qScreenMock(true),
                },
            },
            props: {
                balance: createTokenBalance({
                    address: fakeStlosContractAddress,
                    symbol: 'STLOS',
                    name: 'Staked TLOS',
                    logoURI: 'https://raw.githubusercontent.com/telosnetwork/teloscan/master/public/stlos-logo.png',
                    decimals: 18,
                    balance: '3642.0243',
                    fullBalance: '3642.024318091460206147',
                },
                '0.19',
                ),
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
                    balance: createTokenBalance({
                        symbol: 'TLOS',
                        name: 'Telos',
                        logoURI: 'https://raw.githubusercontent.com/telosnetwork/teloscan/master/public/stlos-logo.png',
                        decimals: 18,
                        balance: '3642.0243',
                        fullBalance: '3642.024318091460206147',
                        address: NativeCurrencyAddress,
                    },
                    '0.19',
                    ),
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
                    balance: createTokenBalance({
                        ... fakeStakedToken.sourceInfo,
                        balance: '3642.0243',
                        fullBalance: '3642.024318091460206147',
                    }),
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
                    balance: createTokenBalance({
                        ... fakeWrappedToken.sourceInfo,
                        balance: '3642.0243',
                        fullBalance: '3642.024318091460206147',
                    },
                    '0.19',
                    ),
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
                    balance: createTokenBalance({
                        address: fakeTokenContractAddress,
                        symbol: 'SHIB',
                        name: 'Shiba',
                        logoURI: 'https://raw.githubusercontent.com/telosnetwork/teloscan/master/public/stlos-logo.png',
                        decimals: 18,
                        balance: '3642.0243',
                        fullBalance: '3642.024318091460206147',
                    }),
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
