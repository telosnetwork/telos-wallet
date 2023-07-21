require('dotenv').config();

const sharedEnv = {
    NETWORK_PROTOCOL: 'https',
    NETWORK_PORT: 443,
    TELOS_ORIGIN: 'http://localhost:3030',
    TOKENMANAGER_CONTRACT: 'tokenmanager',
    GOOGLE_ANALYTICS: 'UA-154600181-2',
    IMGUR_CLIENT_ID: 'b6f46df9d1da9d9',
    EVM_CONTRACT: 'eosio.evm',
    PROJECT_ID: '14ec76c44bae7d461fa0f5fd5f8a9da1',
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
    APP_OREID_APP_ID: 't_23991cde82994c88bb582c019a9c45e1',
    // TODO: uncomment this line when the testnet app is ready - https://github.com/telosnetwork/telos-wallet/issues/492
    // APP_OREID_APP_ID: 't_75a4d9233ec441d18c4221e92b379197',
};

const MAINNET = {
    ...sharedEnv,
    FUEL_RPC: 'https://telos.greymass.com',
    APP_NAME: 'Telos Web Wallet',
    NETWORK_HOST: 'mainnet.telos.net',
    NETWORK_CHAIN_ID:
    '4667b205c6838ef70ff7988f6e8257e8be0e1284a2f59699054a018f743b1d11',
    TELOS_API_ENDPOINT: 'https://api.telos.net/v1',
    HYPERION_ENDPOINT: 'https://mainnet.telos.net',
    NETWORK_EXPLORER: 'https://explorer.telos.net',
    CHAIN_NAME: 'telos',
    APP_OREID_APP_ID: 'p_e5b81fcc20a04339993b0cc80df7e3fd',
};

const env = process.env.NETWORK === 'mainnet' ? MAINNET : TESTNET;

module.exports = env;
