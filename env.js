require('dotenv').config();

const sharedEnv = {
    NETWORK_PROTOCOL: 'https',
    NETWORK_PORT: 443,
    TELOS_ORIGIN: 'http://localhost:3030',
    TOKENMANAGER_CONTRACT: 'tokenmanager',
    GOOGLE_ANALYTICS: 'UA-154600181-2',
    IMGUR_CLIENT_ID: 'b6f46df9d1da9d9',
    EVM_CONTRACT: 'eosio.evm',
};

const TESTNET = {
    ...sharedEnv,
    FUEL_RPC: '', // no Fuel support for Test-net yet
    APP_NAME: 'Telos Web Wallet (testnet)',
    NETWORK_HOST: 'testnet.telos.net',
    NETWORK_CHAIN_ID:
    '1eaa0824707c8c16bd25145493bf062aecddfeb56c736f6ba6397f3195f33c9f',
    TELOS_API_ENDPOINT: 'https://api-dev.telos.net/v1',
    HYPERION_ENDPOINT: 'https://testnet.telos.net',
    NETWORK_EXPLORER: 'https://explorer-test.telos.net',
    CHAIN_NAME: 'telos-testnet',
};

const MAINNET = {
    ...sharedEnv,
    FUEL_RPC: 'telos.greymass.com',
    APP_NAME: 'Telos Web Wallet',
    NETWORK_HOST: 'mainnet.telos.net',
    NETWORK_CHAIN_ID:
    '4667b205c6838ef70ff7988f6e8257e8be0e1284a2f59699054a018f743b1d11',
    TELOS_API_ENDPOINT: 'https://api.telos.net/v1',
    HYPERION_ENDPOINT: 'https://mainnet.telos.net',
    NETWORK_EXPLORER: 'https://explorer.telos.net',
    CHAIN_NAME: 'telos',
};

const env = process.env.NETWORK === 'mainnet' ? MAINNET : TESTNET;

module.exports = env;
