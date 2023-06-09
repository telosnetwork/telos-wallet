import { boot } from 'quasar/wrappers';
import { configureChains, createClient } from '@wagmi/core';
import { telos, telosTestnet } from '@wagmi/core/chains';
import { w3mProvider, w3mConnectors, EthereumClient } from '@web3modal/ethereum';

// create wagmi client and make globally available for autologin
const projectId = process.env.PROJECT_ID || '';
const chains = [telos, telosTestnet];
const { provider } = configureChains(chains, [w3mProvider({ projectId })]);

const wagmi = createClient({
    autoConnect: true,
    connectors: w3mConnectors({ projectId, version: 1, chains }),
    provider,
});

const wagmiClient = new EthereumClient(wagmi, chains);

export default boot(async ({ app }) => {
    app.provide('$wagmi', wagmiClient);
});
