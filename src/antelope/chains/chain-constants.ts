import { NETWORK as telosEvmNetwork } from 'src/antelope/chains/evm/telos-evm';
import { NETWORK as telosTestnetEvmNetwork } from 'src/antelope/chains/evm/telos-evm-testnet';

export const TELOS_CHAIN_IDS = ['40', '41'];
export const TELOS_NETWORK_NAMES = [telosEvmNetwork, telosTestnetEvmNetwork];
export const TELOS_ANALYTICS_EVENT_IDS = {
    loginStarted: 'JXIYBP1S',
    loginSuccessful: 'HIP11SFR',
    loginSuccessfulMetamask: 'ABGMND23',
    loginFailedMetamask: 'ZFGE6TFS',
    loginSuccessfulSafepal: 'LKCBKDU2',
    loginFailedSafepal: '6PSIWGNV',
    loginFailedWalletConnect: '9V4IV1BV',
    loginSuccessfulWalletConnect: '2EG2OR3H',
};

export const ZERO_ADDRESS = '0x'.concat('0'.repeat(40));
