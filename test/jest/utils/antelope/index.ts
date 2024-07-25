// -------- Core --------

const onEventSubscribe = jest.fn();
const AntelopeMock = {
    events: {
        onAccountChanged: {
            subscribe: onEventSubscribe,
            pipe: jest.fn().mockImplementation(() => ({
                subscribe: onEventSubscribe,
            })),
        },
        onClear: {
            subscribe: onEventSubscribe,
        },
        onLoggedIn: {
            subscribe: onEventSubscribe,
        },
        onLoggedOut: {
            subscribe: onEventSubscribe,
        },
        onNetworkChanged: {
            subscribe: onEventSubscribe,
        },
        onChainIndexerReady: {
            subscribe: onEventSubscribe,
        },
        onErrorMessage: {
            subscribe: onEventSubscribe,
        },
    },
    config: {
        errorToStringHandler: jest.fn(),
        transactionError: jest.fn(),
        debug: {
            trace: jest.fn(),
        },
    },
    wallets: {
        getEVMAuthenticator: () => ({
            newInstance: (label: string) => ({
                label,
                isConnectedTo: () => Promise.resolve(true),
            }),
        }),
    },
};
export const getAntelope = jest.fn().mockImplementation(() => AntelopeMock);

export const CURRENT_CONTEXT = 'current';

export * from 'test/jest/utils/antelope/debug';
export * from 'test/jest/utils/antelope/mockData';
export * from 'test/jest/utils/antelope/store-account';
export * from 'test/jest/utils/antelope/store-contract';
export * from 'test/jest/utils/antelope/store-chain';
export * from 'test/jest/utils/antelope/store-evm';
export * from 'test/jest/utils/antelope/store-feedback';
export * from 'test/jest/utils/antelope/store-platform';
export * from 'test/jest/utils/antelope/wagmi-web3';


