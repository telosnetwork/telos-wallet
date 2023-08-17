/* eslint-disable @typescript-eslint/no-explicit-any */

import { MockData } from 'test/jest/utils/antelope/mockData';

// -------- Chain Store --------

const ChainSettings = {
    initialized: jest.fn(),
    getChainId: jest.fn().mockImplementation(() => MockData.Chain.id),
    isNative: jest.fn(),
    getTokens: jest.fn(),
    getTokenList: jest.fn().mockImplementation(() => MockData.TokenList),
    getSystemToken: jest.fn().mockImplementation(() => MockData.Token.SYSTEM_TOKEN),
    getUsdPrice: jest.fn().mockImplementation(() => 1),
    hasIndexerSupport: jest.fn().mockImplementation(() => false),
    isIndexerHealthy: jest.fn().mockImplementation(() => false),
    getNetwork: jest.fn().mockImplementation(() => MockData.Network),
    getDisplay: jest.fn().mockImplementation(() => MockData.Network),
    getSystemTokens: jest.fn().mockImplementation(() => [MockData.Token.SYSTEM_TOKEN, MockData.Token.WRAPPED_TOKEN, MockData.Token.STAKED_TOKEN]),
    getExplorerUrl: jest.fn().mockImplementation(() => MockData.ExplorerUrl),
};

const Chain = {
    apy: '8.0%',
    settings: ChainSettings,
    tokens: MockData.TokenList,
};

// getters -
const loggedChain = Chain;
const currentChain = Chain;
const loggedEvmChain = Chain;
const currentEvmChain = Chain;
const loggedNativeChain = null;
const currentNativeChain = null;
const getChain = jest.fn().mockImplementation(() => Chain);
const getTokens = jest.fn().mockImplementation(() => Chain.tokens);
const getExplorerUrl = jest.fn().mockImplementation(() => MockData.ExplorerUrl);
const getEcosystemUrl = jest.fn().mockImplementation(() => MockData.EcosystemUrl);
const getNetworkSettings = jest.fn().mockImplementation(() => ChainSettings);

// actions -
const updateChainData = jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation((cb: any) => cb()),
}));
const updateSettings = jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation((cb: any) => cb()),
}));
const updateApy = jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation((cb: any) => cb()),
}));
const updateGasPrice = jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation((cb: any) => cb()),
}));
const updateTokenList = jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation((cb: any) => cb()),
}));
const setLoggedChain = jest.fn();
const setCurrentChain = jest.fn();
const setChain = jest.fn();

const ChainGetters = {
    loggedChain,
    currentChain,
    loggedEvmChain,
    currentEvmChain,
    loggedNativeChain,
    currentNativeChain,
    getChain,
    getTokens,
    getExplorerUrl,
    getEcosystemUrl,
    getNetworkSettings,
};

const ChainActions = {
    updateChainData,
    updateSettings,
    updateApy,
    updateGasPrice,
    updateTokenList,
    setLoggedChain,
    setCurrentChain,
    setChain,
};

const ChainStore = { ...ChainGetters, ...ChainActions };

const useChainStore = jest.fn().mockImplementation(() => ChainStore);

jest.mock('src/antelope/stores/chain', () => ({
    useChainStore,
}));

export {
    ChainStore,
    ChainGetters,
    ChainActions,
    useChainStore,
};
