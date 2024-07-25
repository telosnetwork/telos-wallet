import NativeChainSettings from 'src/antelope/chains/NativeChainSettings';
import { RpcEndpoint } from 'universal-authenticator-library';
import { api } from 'src/api';
import { TokenClass, TokenSourceInfo, PriceChartData, Theme } from 'src/antelope/types';

const LOGO = 'https://raw.githubusercontent.com/telosnetwork/token-list/main/logos/telos.png';
const CHAIN_ID =
  '4667b205c6838ef70ff7988f6e8257e8be0e1284a2f59699054a018f743b1d11';
const NETWORK = 'telos';
const DISPLAY = 'Telos Zero';
const TOKEN = new TokenClass({
    symbol: 'TLOS',
    precision: 4,
    amount: 0,
    contract: 'eosio.token',
    isNative: true,
    isSystem: true,
} as TokenSourceInfo);

const HYPERION_ENDPOINT = 'https://mainnet.telos.net';

const RPC_ENDPOINT = {
    protocol: 'https',
    host: 'mainnet.telos.net',
    port: 443,
};
const FUEL_RPC_ENDPOINT = {
    protocol: 'https',
    host: 'telos.greymass.com',
    port: 443,
};
const NFT_ACCOUNTS = ['tlos.tbond', 'marble.code'];
const API_ENDPOINT = 'https://api.telos.net/v1';
const S3_PRODUCER_BUCKET = 'https://telos-producer-validation.s3.amazonaws.com';
const DISPLAY_MAP = true;
const THEME = {
    primary: '#571aff',
    secondary: '#071A5F',
    accent: '#9C27B0',
    dark: '#1d1d1d',
    positive: '#21BA45',
    negative: '#ff0000',
    info: '#31CCEC',
    warning: '#F2C037',
    'color-map': '#4325c2',
    'color-primary-gradient': 'linear-gradient(90deg, #071A5F 0%, #571AFF 100%)',
    'color-secondary-gradient':
    'linear-gradient(180deg, #071A5F 0%, #571aff 147.34%)',
    'color-tertiary-gradient':
    'linear-gradient(90deg, #CBCAF5 0%, #A9CAF3 56.77%, #63C9EF 100%)',
    'color-progress-gradient':
    'linear-gradient(90deg, #571AFF 0%, #A088F9 48.44%, #CBCAF5 100%)',
    'color-producer-card-background': '#f5f4fe',
    'color-select-box-background': '#e0dffb',
};

export default class Telos extends NativeChainSettings {
    getNetwork(): string {
        return NETWORK;
    }

    getNftAccounts(): string[] {
        return NFT_ACCOUNTS;
    }

    getChainId(): string {
        return CHAIN_ID;
    }

    getDisplay(): string {
        return DISPLAY;
    }

    getHyperionEndpoint(): string {
        return HYPERION_ENDPOINT;
    }

    getRPCEndpoint(): RpcEndpoint {
        return RPC_ENDPOINT;
    }

    getFuelRPCEndpoint(): RpcEndpoint | null {
        return FUEL_RPC_ENDPOINT;
    }

    getApiEndpoint(): string {
        return API_ENDPOINT;
    }

    getS3ProducerBucket(): string {
        return S3_PRODUCER_BUCKET;
    }

    getPriceData(): Promise<PriceChartData> {
        return api.getCoingeckoPriceChartData('telos');
    }

    getSystemToken(): TokenClass {
        return TOKEN;
    }

    getUsdPrice(): Promise<number> {
        return api.getCoingeckoUsdPrice('telos');
    }

    getLargeLogoPath(): string {
        return LOGO;
    }

    getSmallLogoPath(): string {
        return LOGO;
    }

    getMapDisplay(): boolean {
        return DISPLAY_MAP;
    }

    getTheme(): Theme {
        return THEME;
    }

    getFiltersSupported(prop: string): boolean {
        if (prop === 'notified') {
            return true;
        }
        return true;
    }

    getSystemTokens(): TokenClass[] {
        return [TOKEN];
    }

    trackAnalyticsEvent(): void {
        console.warn(`trackAnalyticsEvent not implemented for ${NETWORK}`);
    }
}
