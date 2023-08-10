/* eslint-disable @typescript-eslint/no-explicit-any */
import { setActivePinia, createPinia } from 'pinia';

import {
    useFeedbackStore,
    FeedbackActions,
    MockData,
} from 'test/jest/utils/antelope/index';

import { useBalancesStore } from 'src/antelope/stores/balances';
import { TokenClass } from 'src/antelope/types';
import { ethers } from 'ethers';

describe('Antelope Balance Store', () => {
    let store: any;

    beforeEach(() => {
        jest.clearAllMocks();
        setActivePinia(createPinia());
        store = useBalancesStore();
    });

    describe('Initial state', () => {
        test('__balances should be {}', () => {
            expect(JSON.stringify(store.__balances)).toBe('{}');
        });
        test('__wagmiSystemTokenTransferConfig should be {}', () => {
            expect(JSON.stringify(store.__wagmiSystemTokenTransferConfig)).toBe('{"current":null,"logged":null}');
        });
        test('__wagmiTokenTransferConfig should be {}', () => {
            expect(JSON.stringify(store.__wagmiTokenTransferConfig)).toBe('{"current":null,"logged":null}');
        });
    });

    describe('Initializin the store', () => {
        test('should initialize the store', () => {
            expect(useFeedbackStore).not.toHaveBeenCalled();
            expect(FeedbackActions.setDebug).not.toHaveBeenCalled();

            store.init();

            expect(useFeedbackStore).toHaveBeenCalled();
            expect(FeedbackActions.setDebug).toHaveBeenCalled();
        });
    });

    describe('updateBalancesForAccount should update __balances', () => {
        test('with the minimun system tokens when has zero balances for all tokens', async () => {
            const label = 'label';

            const authenticator = {
                getSystemTokenBalance: () => ethers.constants.Zero,
                getERC20TokenBalance: () => ({
                    then: jest.fn().mockImplementation((cb: any) => {
                        cb(ethers.constants.Zero);
                        return {
                            catch: jest.fn(),
                        };
                    }),
                }),
            };

            const account = {
                ...MockData.Account,
                authenticator,
            };

            await store.updateBalancesForAccount(label, account);

            const expected = [
                MockData.Token.SYSTEM_TOKEN.symbol,
                MockData.Token.WRAPPED_TOKEN.symbol,
                MockData.Token.STAKED_TOKEN.symbol,
            ];

            expect((store.__balances[label] as TokenClass[]).map((x: TokenClass) => x.symbol)).toStrictEqual(expected);
        });

        test('with system token first despite not having the higher balance', async () => {
            const label = 'label';
            const account = MockData.Account;
            await store.updateBalancesForAccount(label, account);

            const expected = [
                MockData.Token.SYSTEM_TOKEN.symbol,
                MockData.Token.B_TOKEN.symbol,
                MockData.Token.A_TOKEN.symbol,
                MockData.Token.STAKED_TOKEN.symbol,
                MockData.Token.WRAPPED_TOKEN.symbol,
            ];

            expect((store.__balances[label] as TokenClass[]).map((x: TokenClass) => x.symbol)).toStrictEqual(expected);
        });
    });


});

