import { boot } from 'quasar/wrappers';
import { configureChains, createConfig } from '@wagmi/core';
import { telos, telosTestnet } from '@wagmi/core/chains';
import { w3mProvider, w3mConnectors, EthereumClient } from '@web3modal/ethereum';
import { Web3ModalConfig } from '@web3modal/html';

const projectId = process.env.PROJECT_ID || '';
const chains = [telos, telosTestnet];

const { publicClient } = configureChains(chains, [w3mProvider({ projectId })]);

// Wagmi Client --
const wagmiConfig = createConfig({
    autoConnect: true,
    connectors: w3mConnectors({ projectId, chains }),
    publicClient,
});

const wagmiClient = new EthereumClient(wagmiConfig, chains);

// Wagmi Options --
const explorerRecommendedWalletIds = [
    // MetaMask
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
    // SafePal
    // '0b415a746fb9ee99cce155c2ceca0c6f6061b1dbca2d722b3ba16381d0562150',
];
const explorerExcludedWalletIds = 'ALL' as const; // Web3Modal option excludes all but recomended
const wagmiOptions: Web3ModalConfig = { projectId, explorerRecommendedWalletIds, explorerExcludedWalletIds };

export default boot(async ({ app }) => {
    app.provide('$wagmi', wagmiClient);
    app.config.globalProperties.$wagmi = wagmiClient;
    app.config.globalProperties.$wagmiOptions = wagmiOptions;
});
