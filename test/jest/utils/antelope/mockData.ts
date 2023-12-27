/* eslint-disable @typescript-eslint/no-explicit-any */
import { BigNumber } from 'ethers';
import { AccountModel } from 'src/antelope/stores/account';
import { TokenBalance, TokenClass, TokenSourceInfo } from 'src/antelope/types/TokenClass';

// BALANCE ---
const BALANCE_SYSTEM_TOKEN   = BigNumber.from('123'.concat('4'.repeat(18)));
const BALANCE_WRAPPED_TOKEN  = BigNumber.from('321'.concat('5'.repeat(18)));
const BALANCE_STAKED_TOKEN   = BigNumber.from('456'.concat('7'.repeat(18)));
const BALANCE_A_TOKEN        = BigNumber.from('789'.concat('8'.repeat(18)));
const BALANCE_B_TOKEN        = BigNumber.from('987'.concat('9'.repeat(18)));

// ADDRESS ---
const ADDRESS_SYSTEM_TOKEN   = '0x5e734c1C5c3eE6aEeB7cD7b1c2d2bE7Ee0Ee0Ee0';
const ADDRESS_WRAPPED_TOKEN  = '0xc8Fee563f0Ee0Ee0Ee0Ee0Ee0Ee0Ee0Ee0Ee0Ee0';
const ADDRESS_STAKED_TOKEN   = '0x5e3c8Fee56C135Aecb733cd708cC31A5657aA30b';
const ADDRESS_A_TOKEN        = '0x5ed708cC31A5657aA30b3c8Fee56C135Aecb733c';
const ADDRESS_B_TOKEN        = '0x5e331A5657aA30b5Aecc8Fee56C13708cCb733cd';
const ADDRESS_USER_1         = '0xA30b56C13708cCb5e331A5657aAecc8Fee5733cd';
const ADDRESS_USER_2         = '0x5e331A5657aAecc8Fee56C13708cCb733cdA30b5';

const CHAIN_ID = '999';
const TEST_NETWORK = 'test-network';
const TEST_NETWORK_NAME = 'Test Network';
const EXPLORER_URL = 'https://explorer.testnet.telos.net';
const ECOSYSTEM_URL = 'https://ecosystem.telos.net';
const ENDPOINT_URL = 'https://test-network.telos.net';
const ENDPOINT_PROTOCOL = 'http';
const ENDPOINT_PORT = 1234;
const ENDPOINT_PATH = '/api';
const ENDPOINT = {
    protocol: ENDPOINT_PROTOCOL,
    host: ENDPOINT_URL,
    port: ENDPOINT_PORT,
    path: ENDPOINT_PATH,
};

const commonToken = {
    decimals: 18,
    network: TEST_NETWORK,
};

const SYSTEM_TOKEN = new TokenClass({
    address: ADDRESS_SYSTEM_TOKEN,
    symbol: 'SYSTEM',
    isSystem: true,
    ...commonToken,
} as TokenSourceInfo);

const WRAPPED_TOKEN = new TokenClass({
    address: ADDRESS_WRAPPED_TOKEN,
    symbol: 'WRAPPED',
    ...commonToken,
} as TokenSourceInfo);

const STAKED_TOKEN = new TokenClass({
    address: ADDRESS_STAKED_TOKEN,
    symbol: 'STAKED',
    ...commonToken,
} as TokenSourceInfo);

const A_TOKEN = new TokenClass({
    address: ADDRESS_A_TOKEN,
    symbol: 'A',
    ...commonToken,
} as TokenSourceInfo);

const B_TOKEN = new TokenClass({
    address: ADDRESS_B_TOKEN,
    symbol: 'B',
    ...commonToken,
} as TokenSourceInfo);



const BalancesMapping = {
    [ADDRESS_SYSTEM_TOKEN]: BALANCE_SYSTEM_TOKEN,
    [ADDRESS_WRAPPED_TOKEN]: BALANCE_WRAPPED_TOKEN,
    [ADDRESS_STAKED_TOKEN]: BALANCE_STAKED_TOKEN,
    [ADDRESS_A_TOKEN]: BALANCE_A_TOKEN,
    [ADDRESS_B_TOKEN]: BALANCE_B_TOKEN,
} as Record<string, BigNumber>;


const EvmAuthenticator = {
    getSystemTokenBalance: () => BALANCE_SYSTEM_TOKEN,
    getERC20TokenBalance: (user:string, token:string) => ({
        then: jest.fn().mockImplementation((cb: any) => {
            cb(BalancesMapping[token]);
            return {
                catch: jest.fn(),
            };
        }),
    }),
};

const Account = {
    account: ADDRESS_USER_1,
    authenticator: EvmAuthenticator,
} as unknown as AccountModel;


const MockData = {
    Chain: {
        id: CHAIN_ID,
        display: TEST_NETWORK_NAME,
        hyperionEndpoint: ENDPOINT_URL,
        stakedRatio: BigNumber.from('0600000000000000000'),
        unstakedRatio: BigNumber.from('1200000000000000000'),
    },
    Network: TEST_NETWORK,
    RpcEndpoint: ENDPOINT,
    ExplorerUrl: EXPLORER_URL,
    EcosystemUrl: ECOSYSTEM_URL,
    Balance: {
        SYSTEM_TOKEN: BALANCE_SYSTEM_TOKEN,
        WRAPPED_TOKEN: BALANCE_WRAPPED_TOKEN,
        STAKED_TOKEN: BALANCE_STAKED_TOKEN,
        A_TOKEN: BALANCE_A_TOKEN,
        B_TOKEN: BALANCE_B_TOKEN,
    },
    Address: {
        SYSTEM_TOKEN:  ADDRESS_SYSTEM_TOKEN,
        WRAPPED_TOKEN: ADDRESS_WRAPPED_TOKEN,
        STAKED_TOKEN:  ADDRESS_STAKED_TOKEN,
        A_TOKEN:       ADDRESS_A_TOKEN,
        B_TOKEN:       ADDRESS_B_TOKEN,
        USER_1:        ADDRESS_USER_1,
        USER_2:        ADDRESS_USER_2,
    },
    Token: {
        SYSTEM_TOKEN,
        WRAPPED_TOKEN,
        STAKED_TOKEN,
        A_TOKEN,
        B_TOKEN,
    },
    TokenList: [
        SYSTEM_TOKEN,
        WRAPPED_TOKEN,
        STAKED_TOKEN,
        A_TOKEN,
        B_TOKEN,
    ],
    TokenBalance: {
        SYSTEM_TOKEN: new TokenBalance(SYSTEM_TOKEN, BALANCE_SYSTEM_TOKEN),
        WRAPPED_TOKEN: new TokenBalance(WRAPPED_TOKEN, BALANCE_WRAPPED_TOKEN),
        STAKED_TOKEN: new TokenBalance(STAKED_TOKEN, BALANCE_STAKED_TOKEN),
        A_TOKEN: new TokenBalance(A_TOKEN, BALANCE_A_TOKEN),
        B_TOKEN: new TokenBalance(B_TOKEN, BALANCE_B_TOKEN),
    },
    Account,
    EvmAuthenticator,
    BalancesMapping,
};


export {
    MockData,
};
