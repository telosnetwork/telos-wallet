import EVMChain from 'src/antelope/chains//EVMChain';
import { RpcEndpoint } from 'universal-authenticator-library';
import { api } from 'src/api';
import { PriceChartData } from 'src/types/PriceChartData';
import { Token } from 'src/types/Actions';

const LOGO = 'https://raw.githubusercontent.com/telosnetwork/images/master/logos_2021/Symbol%202.svg';
const CHAIN_ID = '41';
const NETWORK = 'telos-evm-testnet';
const DISPLAY = 'Telos EVM Testnet';
const TOKEN = {
    name: 'Telos',
    symbol: 'TLOS',
    precision: 18,
    contract: 'evm-native',
    logo: LOGO,
    isNative: false,
    isSystem: true,
} as Token;

const RPC_ENDPOINT = {
    protocol: 'https',
    host: 'testnet.telos.net',
    port: 443,
    path: '/evm',
};

const WEI_PRECISION = 18;
const EXPLORER_URL = 'https://testnet.teloscan.io';

export default class TelosTestnetEVM extends EVMChain {
    getNetwork(): string {
        return NETWORK;
    }

    getChainId(): string {
        return CHAIN_ID;
    }

    getDisplay(): string {
        return DISPLAY;
    }

    // getHyperionEndpoint(): string {
    //     return HYPERION_ENDPOINT;
    // }

    getRPCEndpoint(): RpcEndpoint {
        return RPC_ENDPOINT;
    }

    // getFuelRPCEndpoint(): RpcEndpoint | null {
    //     return FUEL_RPC_ENDPOINT;
    // }

    //getApiEndpoint(): string {
    //    return API_ENDPOINT;
    //}

    // getS3ProducerBucket(): string {
    //     return S3_PRODUCER_BUCKET;
    // }

    getPriceData(): Promise<PriceChartData> {
        return api.getEmptyPriceChartData();
    }

    getSystemToken(): Token {
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

    // getMapDisplay(): boolean {
    //     return DISPLAY_MAP;
    // }

    // getTheme(): Theme {
    //     return THEME;
    // }

    // getFiltersSupported(prop: string): boolean {
    //     if (prop === 'notified') {
    //         return true;
    //     }
    //     return true;
    // }

    getWeiPrecision(): number {
        return WEI_PRECISION;
    }

    getExplorerUrl(): string {
        return EXPLORER_URL;
    }
}
