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
    HYPERION_ENDPOINT: 'https://testnet.telos.net',
    NETWORK_EXPLORER: 'https://explorer-test.telos.net',
    CHAIN_NAME: 'telos-testnet',
    OREID_APP_ID: 't_75a4d9233ec441d18c4221e92b379197',
    OREID_APP_ID_NATIVE: 't_a61e9926d5204387a9ac113dfce7cbc5',
};

const MAINNET = {
    ...sharedEnv,
    HYPERION_ENDPOINT: 'https://mainnet.telos.net',
    NETWORK_EXPLORER: 'https://explorer.telos.net',
    CHAIN_NAME: 'telos',
    OREID_APP_ID: 'p_e5b81fcc20a04339993b0cc80df7e3fd',
    OREID_APP_ID_NATIVE: 'p_751f87258d5b40998b55c626d612fd4e',
};

const env = process.env.NETWORK === 'mainnet' ? MAINNET : TESTNET;

module.exports = env;
