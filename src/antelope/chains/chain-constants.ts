import { NETWORK as telosEvmNetwork } from 'src/antelope/chains/evm/telos-evm';
import { NETWORK as telosTestnetEvmNetwork } from 'src/antelope/chains/evm/telos-evm-testnet';

export const TELOS_CHAIN_IDS = ['40', '41'];
export const TELOS_NETWORK_NAMES = [telosEvmNetwork, telosTestnetEvmNetwork];
export const TELOS_ANALYTICS_EVENT_NAMES = {
    loginStarted: 'Login Started',
    loginSuccessful: 'Login Successful',
    loginSuccessfulMetamask: 'Login Successful - Metamask',
    loginFailedMetamask: 'Login Failed - Metamask',
    loginSuccessfulSafepal: 'Login Successful - Safepal',
    loginFailedSafepal: 'Login Failed - Safepal',
    loginSuccessfulOreId: 'Login Successful - OreId',
    loginFailedOreId: 'Login Failed - OreId',
    loginFailedWalletConnect: 'Login Failed - WalletConnect',
    loginSuccessfulWalletConnect: 'Login Successful - WalletConnect',
    loginSuccessfulBrave: 'Login Successful - Brave',
    loginFailedBrave: 'Login Failed - Brave',
};

export const ZERO_ADDRESS = '0x'.concat('0'.repeat(40));
