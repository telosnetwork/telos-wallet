/* eslint-disable no-trailing-spaces */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable jest/no-commented-out-tests */

import { setActivePinia, createPinia } from 'pinia';
import { jest } from '@jest/globals';

import {
    useFeedbackStore,
} from 'test/jest/utils/antelope/store-feedback';

import {
    createTraceFunction,
} from 'test/jest/utils/antelope/debug';

// Mocking the createTraceFunction
jest.mock('src/antelope/config', () => ({
    createTraceFunction,
}));

import {
    useAccountStore,
} from 'test/jest/utils/antelope/store-account';

// Mocking the useAccountStore
jest.mock('src/antelope/stores/account', () => ({
    useAccountStore,
}));

import {
    useChainStore,
} from 'test/jest/utils/antelope/store-chain';

// Mocking the useChainStore
jest.mock('src/antelope', () => ({
    useChainStore: useChainStore,
    CURRENT_CONTEXT: 'mockedCurrentContext',
    useFeedbackStore: useFeedbackStore,
}));

// Import the real artifact to test
import { AntelopeWallets } from 'src/antelope/wallets/AntelopeWallets';


describe('AntelopeWallets', () => {
    let wallets: AntelopeWallets;

    beforeEach(() => {
        jest.clearAllMocks();
        setActivePinia(createPinia());
        wallets = new AntelopeWallets();
    });

    describe('Initial state', () => {
        it('should have the correct initial state', () => {
            // trace should be a function
            expect(typeof wallets['trace']).toBe('function');

            // authenticators should be an empty Map
            expect(wallets['evmAuthenticators']).toBeInstanceOf(Map);
            expect(wallets['evmAuthenticators'].size).toBe(0);
        });
    });

    describe('addEVMAuthenticator function', () => {
        it('should add an authenticator to the authenticators Map', () => {
            const traceSpy = jest.spyOn(wallets as any, 'trace');
            const authenticator = {
                getName: () => 'mockedName',
            };
            wallets.addEVMAuthenticator(authenticator as any);
            expect(traceSpy).toHaveBeenCalledWith('addEVMAuthenticator', 'mockedName', authenticator);
            expect(wallets['evmAuthenticators'].size).toBe(1);
            expect(wallets['evmAuthenticators'].get('mockedName')).toBe(authenticator);
        });
    });

    describe('getAuthenticator function', () => {
        it('should return the authenticator with the given name', () => {
            const traceSpy = jest.spyOn(wallets as any, 'trace');
            const authenticator = {
                getName: () => 'mockedName',
            };
            wallets['evmAuthenticators'].set('mockedName', authenticator as any);
            expect(wallets.getEVMAuthenticator('mockedName')).toBe(authenticator);
            expect(traceSpy).toHaveBeenCalledWith('getEVMAuthenticator', 'mockedName');
        });
    });

});
