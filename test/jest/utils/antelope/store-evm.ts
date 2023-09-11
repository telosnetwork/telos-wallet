/* eslint-disable @typescript-eslint/no-explicit-any */

// -------- Evm Store --------

const initInjectedProvider = jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation((cb: any) => cb()),
}));

const isProviderOnTheCorrectChain = jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation((cb: any) => {
        cb(true);
    }),
}));

const ensureCorrectChain = jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation((cb: any) => cb()),
}));

const switchChainInjected = jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation((cb: any) => {
        cb(true);
    }),
}));

const getFunctionIface = jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation((cb: any) => cb()),
}));

const getTokenTypeFromLog = jest.fn().mockImplementation(() => '');

const getEventIface = jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation((cb: any) => cb()),
}));

const getContractCreation = jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation((cb: any) => cb()),
}));

const getContract = jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation((cb1: any) => {
        cb1({
            getContractInstance: jest.fn().mockImplementation(() => ({
                previewDeposit: jest.fn(),
            })),
        });
    }),
}));

const checkBucket = jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation((cb: any) => cb()),
}));

const getVerifiedContract = jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation((cb: any) => cb()),
}));

const getEmptyContract = jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation((cb: any) => cb()),
}));

const supportsInterface = jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation((cb: any) => {
        cb(true);
    }),
}));

const isTokenType = jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation((cb: any) => {
        cb('');
    }),
}));

const getTokenABI = jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation((cb: any) => cb()),
}));

const getContractFromAbi = jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation((cb: any) => cb()),
}));

const getToken = jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation((cb: any) => cb()),
}));

const getNFT = jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation((cb: any) => cb()),
}));

const getContractFromTokenLis = jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation((cb: any) => cb()),
}));

const addInjectedProvider = jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation((cb: any) => cb()),
}));

const EVMGetters = {
    isMetamaskSupported: true,
};

const EVMActions = {
    initInjectedProvider,
    isProviderOnTheCorrectChain,
    ensureCorrectChain,
    switchChainInjected,
    getFunctionIface,
    getTokenTypeFromLog,
    getEventIface,
    getContractCreation,
    getContract,
    checkBucket,
    getVerifiedContract,
    getEmptyContract,
    supportsInterface,
    isTokenType,
    getTokenABI,
    getContractFromAbi,
    getToken,
    getNFT,
    getContractFromTokenLis,
    addInjectedProvider,
};

const EVMStore = { ...EVMActions, ...EVMGetters };

const useEVMStore = jest.fn().mockImplementation(() => EVMStore);

jest.mock('src/antelope/stores/evm', () => ({
    useEVMStore,
}));

export {
    EVMStore,
    useEVMStore,
};
