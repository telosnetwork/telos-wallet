/* eslint-disable @typescript-eslint/no-explicit-any */
import { ethers } from 'ethers';
import { setActivePinia, createPinia } from 'pinia';
import { useBalancesStore } from 'src/antelope/stores/balances';

const tokenList = [{
    address: 'address-TEST',
    symbol: 'TEST',
    decimals: 18,
    tokenId: 2,
}];

const tokenSys = {
    address: 'no-address',
    symbol: 'TLOS',
    decimals: 18,
    tokenId: 1,
};

const SYSTEM_TOKEN_BALANCE = ethers.BigNumber.from('123'.concat('1'.repeat(18)));
const TOKEN_BALANCE = ethers.BigNumber.from('321'.concat('9'.repeat(18)));

jest.mock('src/antelope/stores/evm', () => ({
    useEVMStore: jest.fn().mockImplementation(() => ({
        getContract: jest.fn().mockImplementation(() => ({
            then: jest.fn().mockImplementation((cb1: any) => {
                cb1({
                    getContractInstance: jest.fn().mockImplementation(() => ({
                        transfer: jest.fn(),
                        balanceOf: jest.fn().mockImplementation(() => ({
                            then: jest.fn().mockImplementation((cb: any) => {
                                cb(TOKEN_BALANCE);
                            }),
                        })),
                    })),
                });
            }),
        })),
        toWei: jest.fn().mockImplementation((value: any) => value),
        sendSystemToken: jest.fn(),
        rpcProvider: {
            getBalance: jest.fn().mockImplementation(() => ({
                then: jest.fn().mockImplementation((cb: any) => {
                    cb(SYSTEM_TOKEN_BALANCE);
                }),
            })),
        },
    })),
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
    useAccountStore: jest.fn().mockImplementation(() => ({
        loggedAccount: {},
        currentIsLogged: true,
        sendAction: jest.fn(),
    })),
}));

jest.mock('src/antelope/stores/feedback', () => ({
    createTraceFunction: jest.fn().mockImplementation(() => jest.fn()),
    useFeedbackStore: jest.fn().mockImplementation(() => ({
        setDebug: jest.fn(),
        setLoading: jest.fn(),
        unsetLoading: jest.fn(),
    })),
    isTracingAll: jest.fn().mockImplementation(() => false),
}));

jest.mock('src/antelope', () => ({
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
        const account = { account: 'address' };
        await store.updateBalancesForAccount(label, account);

        const expected = {
            label: [
                {
                    ...tokenSys,
                    balance: ethers.utils.formatUnits(SYSTEM_TOKEN_BALANCE, 18).slice(0, 8),
                    fullBalance: ethers.utils.formatUnits(SYSTEM_TOKEN_BALANCE, 18),
                    balanceBn: SYSTEM_TOKEN_BALANCE,
                },
                {
                    ...tokenList[0],
                    balance: ethers.utils.formatUnits(TOKEN_BALANCE, 18).slice(0, 8),
                    fullBalance: ethers.utils.formatUnits(TOKEN_BALANCE, 18),
                    balanceBn: TOKEN_BALANCE,
                },
            ],
        };
        expect(JSON.stringify(store.__balances)).toBe(JSON.stringify(expected));
    });

});

