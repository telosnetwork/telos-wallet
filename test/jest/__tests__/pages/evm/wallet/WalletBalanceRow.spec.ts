import { shallowMount } from '@vue/test-utils';

const fakeBuyMoreLink = 'fake';
const fakeStlosContractAddress = '0x'.concat('9'.repeat(40));
const fakeWtlosContractAddress = '0x'.concat('8'.repeat(40));
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
        'q-btn-dropdown': stubWithSlot('q-btn-dropdown'),
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
        test('TLOS', () => {
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
        });

        test('STLOS', () => {
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

            // snapshot contains c-wallet-balance-row__overflow-li for stake, contract, send
            expect(wrapper.element).toMatchSnapshot();
        });

        test('WTLOS', () => {
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
        });

        test('not a system token', () => {
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
                        address: '0x'.concat('1'.repeat(40)),
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
        });
    });
});
