import { boot } from 'quasar/wrappers';
import { configureChains, createClient } from '@wagmi/core';
import { telos, telosTestnet } from '@wagmi/core/chains';
import { w3mProvider, w3mConnectors, EthereumClient } from '@web3modal/ethereum';
import { Web3ModalConfig } from '@web3modal/html';

// create wagmi client and make globally available for autologin
const projectId = process.env.PROJECT_ID || '';
const chains = [telos, telosTestnet];
const { provider } = configureChains(chains, [w3mProvider({ projectId })]);

// Wagmi Client --
const wagmi = createClient({
    autoConnect: true,
    connectors: w3mConnectors({ projectId, version: 2, chains }),
    provider,
});

const wagmiClient = new EthereumClient(wagmi, chains);

// Wagmi Options --
const explorerRecommendedWalletIds = [
    // MetaMask
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
];
const explorerExcludedWalletIds = 'ALL' as const; // Web3Modal option excludes all but recomended
const wagmiOptions: Web3ModalConfig = { projectId, explorerRecommendedWalletIds, explorerExcludedWalletIds };

export default boot(async ({ app }) => {
    app.provide('$wagmi', wagmiClient);
    app.config.globalProperties.$wagmi = wagmiClient;
    app.config.globalProperties.$wagmiOptions = wagmiOptions;
});
