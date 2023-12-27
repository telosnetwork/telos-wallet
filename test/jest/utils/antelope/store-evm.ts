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

const getEventIface = jest.fn().mockImplementation(() => ({
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



const getNFT = jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation((cb: any) => cb()),
}));

const addInjectedProvider = jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation((cb: any) => cb()),
}));

const EVMGetters = {
};

const EVMActions = {
    initInjectedProvider,
    isProviderOnTheCorrectChain,
    ensureCorrectChain,
    switchChainInjected,
    getFunctionIface,
    getEventIface,
    supportsInterface,
    isTokenType,
    getNFT,
    addInjectedProvider,
};

const EVMStore = { ...EVMActions, ...EVMGetters };

const useEVMStore = jest.fn().mockImplementation(() => EVMStore);

export {
    EVMStore,
    useEVMStore,
};
