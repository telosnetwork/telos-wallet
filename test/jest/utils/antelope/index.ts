import { useChainStore } from 'test/jest/utils/antelope/store-chain';
import { useAccountStore } from 'test/jest/utils/antelope/store-account';
import { useEVMStore } from 'test/jest/utils/antelope/store-evm';
import { useFeedbackStore } from 'test/jest/utils/antelope/store-feedback';
import { usePlatformStore } from 'test/jest/utils/antelope/store-platform';

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

const CURRENT_CONTEXT = 'current';

jest.mock('src/antelope', () => ({
    useChainStore,
    useAccountStore,
    useEVMStore,
    useFeedbackStore,
    usePlatformStore,
    getAntelope,
    CURRENT_CONTEXT,
}));


jest.mock('src/antelope/config', () => ({
    errorToString: jest.fn().mockImplementation(e => e),
}));

export * from 'test/jest/utils/antelope/ethers';
export * from 'test/jest/utils/antelope/mockData';
export * from 'test/jest/utils/antelope/store-account';
export * from 'test/jest/utils/antelope/store-chain';
export * from 'test/jest/utils/antelope/store-evm';
export * from 'test/jest/utils/antelope/store-feedback';
export * from 'test/jest/utils/antelope/store-platform';
export * from 'test/jest/utils/antelope/wagmi-web3';
export * from 'test/jest/utils/antelope/globalProps';

