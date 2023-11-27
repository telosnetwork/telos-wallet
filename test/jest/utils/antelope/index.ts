// -------- Core --------
export const getAntelope = jest.fn().mockImplementation(() => ({
    events: {
        onAccountChanged: {
            subscribe: jest.fn(),
            pipe: jest.fn().mockImplementation(() => ({
                subscribe: jest.fn(),
            })),
        },
    },
    config: {
        errorToStringHandler: jest.fn(),
    },
    wallets: {
        getAuthenticator: () => ({
            newInstance: (label: string) => ({
                label,
                isConnectedTo: () => Promise.resolve(true),
            }),
        }),
    },
}));

export const CURRENT_CONTEXT = 'current';

export * from 'test/jest/utils/antelope/debug';
export * from 'test/jest/utils/antelope/ethers';
export * from 'test/jest/utils/antelope/mockData';
export * from 'test/jest/utils/antelope/store-account';
export * from 'test/jest/utils/antelope/store-chain';
export * from 'test/jest/utils/antelope/store-evm';
export * from 'test/jest/utils/antelope/store-feedback';
export * from 'test/jest/utils/antelope/store-platform';
export * from 'test/jest/utils/antelope/wagmi-web3';
export * from 'test/jest/utils/antelope/globalProps';


