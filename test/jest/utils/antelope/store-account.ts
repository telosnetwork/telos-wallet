/* eslint-disable @typescript-eslint/no-explicit-any */
import { MockData } from 'test/jest/utils/antelope/mockData';


// -------- Account Store --------

const isAuthenticated = jest.fn().mockImplementation(() => null);
const loggedAccount = jest.fn().mockImplementation(() => ({}));
const loggedIsNative = jest.fn().mockImplementation(() => null);
const loggedEvmAccount = jest.fn().mockImplementation(() => null);
const loggedNativeAccount = jest.fn().mockImplementation(() => null);
const currentAccount = jest.fn().mockImplementation(() => null);
const currentEvmAccount = jest.fn().mockImplementation(() => null);
const currentIsLogged = jest.fn().mockImplementation(() => true);
const getAccount = jest.fn().mockImplementation(() => ({
    authenticator: jest.fn().mockImplementation(() => ({
        web3Provider: jest.fn().mockImplementation(() => 'do you need to get deeper?'),
    })),
}));
const getAuthenticator = jest.fn().mockImplementation(() => null);
const getEVMAuthenticator = jest.fn().mockImplementation(() => MockData.EvmAuthenticator);
const getNativeAuthenticator = jest.fn().mockImplementation(() => null);

const loginNative = jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation((cb: any) => cb()),
}));
const loginEVM = jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation((cb: any) => cb()),
}));
const logout = jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation((cb: any) => cb()),
}));
const autoLogin = jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation((cb: any) => cb()),
}));
const isConnectedToCorrectNetwork = jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation((cb: any) => cb()),
}));
const sendAction = jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation((cb: any) => cb()),
}));
const sendTransaction = jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation((cb: any) => cb()),
}));
const fetchAccountDataFor = jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation((cb: any) => cb()),
}));
const setCurrentAccount = jest.fn();
const setLoggedAccount = jest.fn();

const AccountGetters = {
    isAuthenticated,
    loggedAccount,
    loggedIsNative,
    loggedEvmAccount,
    loggedNativeAccount,
    currentAccount,
    currentEvmAccount,
    currentIsLogged,
    getAccount,
    getAuthenticator,
    getEVMAuthenticator,
    getNativeAuthenticator,
};

const AccountActions = {
    isAuthenticated,
    loggedAccount,
    loggedIsNative,
    loggedEvmAccount,
    loggedNativeAccount,
    currentAccount,
    currentEvmAccount,
    currentIsLogged,
    getAccount,
    getAuthenticator,
    getEVMAuthenticator,
    getNativeAuthenticator,
    loginNative,
    loginEVM,
    logout,
    autoLogin,
    isConnectedToCorrectNetwork,
    sendAction,
    sendTransaction,
    fetchAccountDataFor,
    setCurrentAccount,
    setLoggedAccount,
};

const AccountStore = { ...AccountGetters, ...AccountActions };

const useAccountStore = jest.fn().mockImplementation(() => AccountStore);

export {
    MockData,
    useAccountStore,
    AccountActions,
    AccountGetters,
};
