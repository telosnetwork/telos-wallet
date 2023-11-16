/* eslint-disable no-trailing-spaces */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable jest/no-commented-out-tests */

import { setActivePinia, createPinia } from 'pinia';
import { jest } from '@jest/globals';

import {
    useFeedbackStore,
    createTraceFunction,
    isTracingAll,
} from 'test/jest/utils/antelope/store-feedback';

// Mocking the createTraceFunction
jest.mock('src/antelope/stores/feedback', () => ({
    useFeedbackStore,
    createTraceFunction,
    isTracingAll,
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

    /*
    // Code to test: 
    export class AntelopeWallets {

        private trace: (message: string, ...args: unknown[]) => void;
        private authenticators: Map<string, EVMAuthenticator> = new Map();
        constructor() {
            this.trace = createTraceFunction(name);
        }

        init() {
            useFeedbackStore().setDebug(name, isTracingAll());
        }
    }
    */

    describe('Initial state', () => {
        it('should have the correct initial state', () => {
            // trace should be a function
            expect(typeof wallets['trace']).toBe('function');

            // authenticators should be an empty Map
            expect(wallets['authenticators']).toBeInstanceOf(Map);
            expect(wallets['authenticators'].size).toBe(0);
        });
    });

    describe('init function', () => {
        it('should initialize the feedback store', () => {
            const setDebugSpy = jest.spyOn(useFeedbackStore(), 'setDebug');
            wallets.init();
            expect(setDebugSpy).toHaveBeenCalledWith('AntelopeWallets', false);
        });
    });

    /*
    // Code to test:

    /*
    // Code to test: 
    export class AntelopeWallets {
        addEVMAuthenticator(authenticator: EVMAuthenticator) {
            this.trace('addEVMAuthenticator', authenticator.getName(), authenticator);
            this.authenticators.set(authenticator.getName(), authenticator);
        }

        getAuthenticator(name: string) {
            this.trace('getAuthenticator', name);
            return this.authenticators.get(name);
        }
    }
    */

    describe('addEVMAuthenticator function', () => {
        it('should add an authenticator to the authenticators Map', () => {
            const traceSpy = jest.spyOn(wallets as any, 'trace');
            const authenticator = {
                getName: () => 'mockedName',
            };
            wallets.addEVMAuthenticator(authenticator as any);
            expect(traceSpy).toHaveBeenCalledWith('addEVMAuthenticator', 'mockedName', authenticator);
            expect(wallets['authenticators'].size).toBe(1);
            expect(wallets['authenticators'].get('mockedName')).toBe(authenticator);
        });
    });

    describe('getAuthenticator function', () => {
        it('should return the authenticator with the given name', () => {
            const traceSpy = jest.spyOn(wallets as any, 'trace');
            const authenticator = {
                getName: () => 'mockedName',
            };
            wallets['authenticators'].set('mockedName', authenticator as any);
            expect(wallets.getAuthenticator('mockedName')).toBe(authenticator);
            expect(traceSpy).toHaveBeenCalledWith('getAuthenticator', 'mockedName');
        });
    });

});
