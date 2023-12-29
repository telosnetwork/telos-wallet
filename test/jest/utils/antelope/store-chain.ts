/* eslint-disable @typescript-eslint/no-explicit-any */

import { MockData } from 'test/jest/utils/antelope/mockData';

const ChainSettings = {
    initialized: jest.fn(),
    getSystemToken: jest.fn().mockImplementation(() => MockData.Token.SYSTEM_TOKEN),
    getStakedSystemToken: jest.fn().mockImplementation(() => MockData.Token.STAKED_TOKEN),
    getWrappedSystemToken: jest.fn().mockImplementation(() => MockData.Token.WRAPPED_TOKEN),
    getChainId: jest.fn().mockImplementation(() => MockData.Chain.id),
    getDisplay: jest.fn().mockImplementation(() => MockData.Chain.display),
    getHyperionEndpoint: jest.fn().mockImplementation(() => MockData.Chain.hyperionEndpoint),
    isNative: jest.fn(),
    getTokens: jest.fn(),
    getTokenList: jest.fn().mockImplementation(() => MockData.TokenList),
    getUsdPrice: jest.fn().mockImplementation(() => 1),
    hasIndexerSupport: jest.fn().mockImplementation(() => false),
    isIndexerHealthy: jest.fn().mockImplementation(() => false),
    getNetwork: jest.fn().mockImplementation(() => MockData.Network),
    getSystemTokens: jest.fn().mockImplementation(() => [MockData.Token.SYSTEM_TOKEN, MockData.Token.WRAPPED_TOKEN, MockData.Token.STAKED_TOKEN]),
    getExplorerUrl: jest.fn().mockImplementation(() => MockData.ExplorerUrl),
    getRPCEndpoint: jest.fn().mockImplementation(() => MockData.RpcEndpoint),
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
const getStakedRatio = jest.fn().mockImplementation(() => MockData.Chain.stakedRatio);
const getUnstakedRatio = jest.fn().mockImplementation(() => MockData.Chain.unstakedRatio);

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
    getStakedRatio,
    getUnstakedRatio,
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

export {
    ChainStore,
    ChainGetters,
    ChainActions,
    useChainStore,
};
