import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { RpcEndpoint } from 'universal-authenticator-library';
import { api } from 'src/api';
import { EvmToken, PriceChartData } from 'src/antelope/types';

const LOGO = 'https://raw.githubusercontent.com/telosnetwork/images/master/logos_2021/Symbol%202.svg';
const CHAIN_ID = '41';
const NETWORK = 'telos-evm-testnet';
const DISPLAY = 'Telos EVM Testnet';
const TOKEN = {
    name: 'Telos',
    symbol: 'TLOS',
    decimals: 18,
    address: 'evm-native',
    logo: LOGO,
    isNative: false,
    isSystem: true,
} as EvmToken;

const RPC_ENDPOINT = {
    protocol: 'https',
    host: 'testnet.telos.net',
    port: 443,
    path: '/evm',
};

const WEI_PRECISION = 18;
const EXPLORER_URL = 'https://testnet.teloscan.io';
const NETWORK_EVM_ENDPOINT = 'https://testnet.telos.caleos.io';
const CONTRACTS_BUCKET = 'https://verified-evm-contracts-testnet.s3.amazonaws.com';

export default class TelosTestnetEVM extends EVMChainSettings {
    getNetwork(): string {
        return NETWORK;
    }

    getChainId(): string {
        return CHAIN_ID;
    }

    getDisplay(): string {
        return DISPLAY;
    }

    getHyperionEndpoint(): string {
        return NETWORK_EVM_ENDPOINT;
    }

    getRPCEndpoint(): RpcEndpoint {
        return RPC_ENDPOINT;
    }

    getPriceData(): Promise<PriceChartData> {
        return api.getEmptyPriceChartData();
    }

    getSystemToken(): EvmToken {
        return TOKEN;
    }

    getUsdPrice(): Promise<number> {
        return Promise.resolve(0);
    }

    getLargeLogoPath(): string {
        return LOGO;
    }

    getSmallLogoPath(): string {
        return LOGO;
    }

    getWeiPrecision(): number {
        return WEI_PRECISION;
    }

    getExplorerUrl(): string {
        return EXPLORER_URL;
    }

    getTrustedContractsBucket(): string {
        return CONTRACTS_BUCKET;
    }
}
