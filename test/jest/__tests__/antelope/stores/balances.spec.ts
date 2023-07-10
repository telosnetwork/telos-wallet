/* eslint-disable @typescript-eslint/no-explicit-any */
import { ethers } from 'ethers';
import { setActivePinia, createPinia } from 'pinia';
import { TokenBalance, TokenClass, TokenSourceInfo } from 'src/antelope/types';


const TEST_NETWORK = 'testnet';

const tokenList = [new TokenClass({
    address: 'address-TEST',
    symbol: 'TEST',
    decimals: 18,
    network: TEST_NETWORK,
} as TokenSourceInfo)];

const tokenSys = new TokenClass({
    address: 'no-address',
    symbol: 'TLOS',
    decimals: 18,
    network: TEST_NETWORK,
} as TokenSourceInfo);

const SYSTEM_TOKEN_BALANCE = ethers.BigNumber.from('123'.concat('1'.repeat(18)));
const TOKEN_BALANCE = ethers.BigNumber.from('321'.concat('9'.repeat(18)));


const FeedbackStore = jest.fn().mockImplementation(() => ({
    setDebug: jest.fn(),
    setLoading: jest.fn(),
    unsetLoading: jest.fn(),
}));

const EVMStore = jest.fn().mockImplementation(() => ({
    getContract: jest.fn().mockImplementation(() => ({
        then: jest.fn().mockImplementation((cb1: any) => {
            cb1({
                getContractInstance: jest.fn().mockImplementation((cb2: any) => {
                    cb2({
                        transfer: jest.fn(),
                        balanceOf: jest.fn().mockImplementation(() => ({
                            then: jest.fn().mockImplementation((cb: any) => {
                                cb(TOKEN_BALANCE);
                            }),
                        })),
                    });
                }),
            });
        }),
    })),
    toWei: jest.fn().mockImplementation((value: any) => value),
    getERC20TokenBalance: jest.fn().mockImplementation(() => ({
        then: jest.fn().mockImplementation((cb: any) => {
            cb(TOKEN_BALANCE);
        }),
    })),
    sendSystemToken: jest.fn(),
    rpcProvider: {
        getBalance: jest.fn().mockImplementation(() => ({
            then: jest.fn().mockImplementation((cb: any) => {
                cb(SYSTEM_TOKEN_BALANCE);
            }),
        })),
    },
}));

const evmAuthenticatorMock = {
    getSystemTokenBalance: () => SYSTEM_TOKEN_BALANCE,
    getERC20TokenBalance: () => ({
        then: jest.fn().mockImplementation((cb: any) => {
            cb(TOKEN_BALANCE);
        }),
    }),
};

const AccountStore = jest.fn().mockImplementation(() => ({
    loggedAccount: {},
    currentIsLogged: true,
    getEVMAuthenticator: jest.fn().mockImplementation(() => evmAuthenticatorMock),
    sendAction: jest.fn(),
}));

const ChainStore = jest.fn().mockImplementation(() => ({
    getChain: jest.fn().mockImplementation(() => ({
        settings: {
            isNative: jest.fn(),
            getTokens: jest.fn(),
            getTokenList: jest.fn().mockImplementation(() => tokenList),
            getSystemToken: jest.fn().mockImplementation(() => tokenSys),
            getUsdPrice: jest.fn().mockImplementation(() => 1),
            hasIndexerSupport: jest.fn().mockImplementation(() => false),
            isIndexerHealthy: jest.fn().mockImplementation(() => false),
            getNetwork: jest.fn().mockImplementation(() => TEST_NETWORK),
            getSystemTokens: jest.fn().mockImplementation(() => [tokenSys]),
        },
    })),
    loggedChain: {
        settings: {
            isNative: jest.fn(),
            getTokens: jest.fn(),
            getTokenList: jest.fn().mockImplementation(() => tokenList),
        },
    },
}));

jest.mock('src/antelope/stores/evm', () => ({
    useEVMStore: EVMStore,
}));

jest.mock('src/antelope/stores/chain', () => ({
    useChainStore: jest.fn().mockImplementation(() => ({
        getChain: jest.fn().mockImplementation(() => ({
            settings: {
                isNative: jest.fn(),
                getTokens: jest.fn(),
                getTokenList: jest.fn().mockImplementation(() => tokenList),
                getSystemToken: jest.fn().mockImplementation(() => tokenSys),
                getUsdPrice: jest.fn().mockImplementation(() => 1),
                getSystemTokens: jest.fn().mockImplementation(() => [tokenSys]),
                hasIndexerSupport: jest.fn().mockImplementation(() => false),
                isIndexerHealthy: jest.fn().mockImplementation(() => false),
                getNetwork: jest.fn().mockImplementation(() => TEST_NETWORK),
            },
        })),
        loggedChain: {
            settings: {
                isNative: jest.fn(),
                getTokens: jest.fn(),
                getTokenList: jest.fn().mockImplementation(() => tokenList),
            },
        },
    })),
}));

jest.mock('src/antelope/stores/account', () => ({
    useAccountStore: AccountStore,
}));


jest.mock('src/antelope/stores/feedback', () => ({
    createTraceFunction: jest.fn().mockImplementation(() => jest.fn()),
    useFeedbackStore: FeedbackStore,
    isTracingAll: jest.fn().mockImplementation(() => false),
}));

jest.mock('src/antelope', () => ({
    useChainStore: ChainStore,
    useAccountStore: AccountStore,
    useEVMStore: EVMStore,
    useFeedbackStore: FeedbackStore,
    getAntelope: jest.fn().mockImplementation(() => ({
        events: {
            onAccountChanged: {
                subscribe: jest.fn(),
            },
        },
        config: {
            errorToStringHandler: jest.fn(),
        },
    })),
}));

jest.mock('src/antelope/config', () => ({
    errorToString: jest.fn().mockImplementation(e => e),
}));


import { useBalancesStore } from 'src/antelope/stores/balances';

describe('Antelope Balance Store', () => {
    let store: any;

    beforeEach(() => {
        setActivePinia(createPinia());
        store = useBalancesStore();
    });

    test('initial state of __balances should be {}', () => {
        expect(JSON.stringify(store.__balances)).toBe('{}');
    });

    test('updateBalancesForAccount should update __balances', async () => {
        const label = 'label';
        const account = { account: 'address', authenticator: evmAuthenticatorMock };
        await store.updateBalancesForAccount(label, account);

        const sysBalance = new TokenBalance(tokenSys, SYSTEM_TOKEN_BALANCE);
        const tokenBalance = new TokenBalance(tokenList[0], TOKEN_BALANCE);

        const expected = {
            label: [sysBalance, tokenBalance],
        };
        expect(JSON.stringify(store.__balances)).toBe(JSON.stringify(expected));
    });

});

