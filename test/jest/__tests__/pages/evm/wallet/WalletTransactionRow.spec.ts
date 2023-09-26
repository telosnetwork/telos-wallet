import { shallowMount } from '@vue/test-utils';
import { stubWithSlot } from 'test/jest/testing-helpers';

const fakeExplorerUrl = 'example.com';
const locale = 'en-US';
const currency = 'USD';

const antelopeMock = {
    useChainStore: () => ({
        currentChain: {
            settings: {
                getExplorerUrl: () => fakeExplorerUrl,
                getSystemToken: () => ({
                    symbol: 'TLOS',
                }),
            },
        },
    }),
    useUserStore: () => ({
        fiatLocale: locale,
        fiatCurrency: currency,
    }),
};

import WalletTransactionRow from 'pages/evm/wallet/WalletTransactionRow.vue';
import { ShapedTransactionRow } from 'src/antelope/types';

jest.mock('src/antelope', () => antelopeMock);


describe('WalletTransactionRow.vue', () => {
    const fakeDateSeconds = 1681775186;

    beforeAll(() => {
        // used so that timestamp text is the same for each test run, not depending on the day it is run
        jest.useFakeTimers('modern').setSystemTime(new Date(fakeDateSeconds * 1000));
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    const defaultTxData: ShapedTransactionRow = {
        id: '0x'.concat('1'.repeat(40)),
        epoch: fakeDateSeconds,
        actionName: '',
        from: '0x'.concat('1'.repeat(40)),
        fromPrettyName: '',
        to: '0x'.concat('2'.repeat(40)),
        toPrettyName: '',
        valuesIn: [],
        valuesOut: [],
        nftsIn: [],
        nftsOut: [],
        gasUsed: 0.15,
        gasFiatValue: 0.03,
    };

    function getMountOptions(tx: ShapedTransactionRow, isMobile: boolean) {
        return {
            global: {
                mocks: {
                    $q: {
                        screen: {
                            lt: {
                                sm: isMobile,
                            },
                            gt: {
                                xs: !isMobile,
                            },
                        },
                    },
                },
                stubs: {
                    'q-icon': stubWithSlot('q-icon'),
                },
            },
            props: {
                transaction: tx,
            },
        };
    }

    function runExpects(tx: ShapedTransactionRow) {
        const mobileWrapper = shallowMount(WalletTransactionRow, getMountOptions(tx, true));
        const desktopWrapper = shallowMount(WalletTransactionRow, getMountOptions(tx, true));

        expect(mobileWrapper.element).toMatchSnapshot();
        expect(desktopWrapper.element).toMatchSnapshot();
    }


    it('should have the right name', () => {
        expect(WalletTransactionRow.name).toBe('WalletTransactionRow');
    });

    describe('row should be rendered correctly for', () => {
        test('failed transactions', () => {
            const tx = {
                ...defaultTxData,
                failed: true,
            };

            runExpects(tx);
        });

        test('addresses with an alias', () => {
            const sendTx = {
                ...defaultTxData,
                actionName: 'send',
                toPrettyName: 'SomeContract',
            };

            const otherTx= {
                ...defaultTxData,
                actionName: 'receive',
                fromPrettyName: 'AContract',
            };

            runExpects(sendTx);
            runExpects(otherTx);
        });

        test('transfers with no fiat price', () => {
            const tx = {
                ...defaultTxData,
                actionName: 'swap',
                toPrettyName: 'SomeContract',
                valuesIn: [{
                    amount: 100.54121,
                    symbol: 'NERD',
                }, {
                    amount: 357542547.674235,
                    symbol: 'SHIB',
                }, {
                    amount: 1307.45,
                    symbol: 'TLOS',
                    fiatValue: 54.45123513,
                }],
                valuesOut: [{
                    amount: 100,
                    symbol: 'sTLOS',
                    fiatValue: 100,
                }],
            };

            runExpects(tx);
        });

        test('transactions with an action name other than send/receive/swap', () => {
            const tx = {
                ...defaultTxData,
                actionName: 'approve',
            };

            runExpects(tx);
        });

        test('transactions with no known method name', () => {
            const tx = {
                ...defaultTxData,
            };

            runExpects(tx);
        });
    });
});
