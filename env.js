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
    METAKEEP_APP_ID_NATIVE: 'ad5e05fb-280a-41ae-b186-5a2654567b92',
    METAKEEP_APP_ID_EVM: 'd190c88f-1bb5-4e16-bc48-96dbf33b77e0',
    // GOOGLE_APP_ID: '56634824599-ff3iu788c32c3s7ec65cs4bieop9gpgv.apps.googleusercontent.com',
    GOOGLE_APP_ID: '639241197544-kcubenhmti6u7ef3uj360n2lcl5cmn8c.apps.googleusercontent.com',
    // FIXME: This is a auxillary key for the app, it should be replaced for the one commented
};

const TESTNET = {
    ...sharedEnv,
    FUEL_RPC: '', // no Fuel support for Test-net yet
    APP_NAME: 'Telos Web Wallet (testnet)',
    NETWORK_HOST: 'testnet.telos.net',
    NETWORK_CHAIN_ID:
    '1eaa0824707c8c16bd25145493bf062aecddfeb56c736f6ba6397f3195f33c9f',
    // TELOS_API_ENDPOINT: 'https://api-dev.telos.net/v1',
    TELOS_API_ENDPOINT: 'http://localhost:9999/v1',
    HYPERION_ENDPOINT: 'https://testnet.telos.net',
    NETWORK_EXPLORER: 'https://explorer-test.telos.net',
    CHAIN_NAME: 'telos-testnet',
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
};

const env = process.env.NETWORK === 'mainnet' ? MAINNET : TESTNET;

module.exports = env;
