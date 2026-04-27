import { boot } from 'quasar/wrappers';
import { configureChains, createConfig } from '@wagmi/core';
import type { Chain } from '@wagmi/core/chains';
import { w3mProvider, w3mConnectors, EthereumClient } from '@web3modal/ethereum';
import { Web3ModalConfig } from '@web3modal/html';

const projectId = process.env.PROJECT_ID || '';
const telos: Chain = {
    id: 40,
    name: 'Telos',
    network: 'telos',
    nativeCurrency: {
        decimals: 18,
        name: 'Telos',
        symbol: 'TLOS',
    },
    rpcUrls: {
        default: { http: ['https://rpc.telos.net'] },
        public: { http: ['https://rpc.telos.net'] },
    },
    blockExplorers: {
        default: { name: 'Teloscan', url: 'https://www.teloscan.io/' },
    },
    contracts: {
        multicall3: {
            address: '0xcA11bde05977b3631167028862bE2a173976CA11' as `0x${string}`,
            blockCreated: 246530709,
        },
    },
};

const telosTestnet: Chain = {
    id: 41,
    name: 'Telos',
    network: 'telosTestnet',
    nativeCurrency: {
        decimals: 18,
        name: 'Telos',
        symbol: 'TLOS',
    },
    rpcUrls: {
        default: { http: ['https://rpc.testnet.telos.net'] },
        public: { http: ['https://rpc.testnet.telos.net'] },
    },
    blockExplorers: {
        default: { name: 'Teloscan (testnet)', url: 'https://testnet.teloscan.io/' },
    },
    testnet: true,
};

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
const wagmiOptions: Web3ModalConfig = {
    projectId,
    explorerRecommendedWalletIds,
    explorerExcludedWalletIds,
    enableExplorer: false,
};

export default boot(async ({ app }) => {
    app.provide('$wagmi', wagmiClient);
    app.config.globalProperties.$wagmi = wagmiClient;
    app.config.globalProperties.$wagmiOptions = wagmiOptions;
});
