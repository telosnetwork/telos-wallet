import { shallowMount } from '@vue/test-utils';

const fakeBuyMoreLink = 'fake';
const stlosContractAddressMock = jest.fn();
const wtlosContractAddressMock = jest.fn();
const chainStoreMock = {
    useChainStore: () => ({
        currentChain: {
            settings: {
                getBuyMoreOfTokenLink: () => fakeBuyMoreLink,
                getStlosContractAddress: stlosContractAddressMock,
                getWtlosContractAddress: wtlosContractAddressMock,
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
                    address: stlosContractAddressMock(),
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
                    address: stlosContractAddressMock(),
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

        });

        test('STLOS', () => {

        });

        test('WTLOS', () => {

        });

        describe('not a system token and', () => {
            it('has a reliable fiat value', () => {

            });

            it('does not have a reliable fiat value', () => {

            });
        });
    });
});
