require('dotenv').config();

const sharedEnv = {
    NETWORK_PROTOCOL: 'https',
    NETWORK_PORT: 443,
    TELOS_ORIGIN: 'http://localhost:3030',
    TOKENMANAGER_CONTRACT: 'tokenmanager',
    GOOGLE_ANALYTICS: 'UA-154600181-2',
    IMGUR_CLIENT_ID: 'b6f46df9d1da9d9',
    EVM_CONTRACT: 'eosio.evm',
    PROJECT_ID: '2392473d6d98499c7138cd2d705a791f',
    APP_NAME: 'Telos Web Wallet',
};

const TESTNET = {
    ...sharedEnv,
    NETWORK_EXPLORER: 'https://explorer-test.telos.net',
    CHAIN_NAME: 'telos-testnet',
};

const MAINNET = {
    ...sharedEnv,
    NETWORK_EXPLORER: 'https://explorer.telos.net',
    CHAIN_NAME: 'telos',
};

const env = process.env.NETWORK === 'mainnet' ? MAINNET : TESTNET;

module.exports = env;
