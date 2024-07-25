import NativeChainSettings from 'src/antelope/chains/NativeChainSettings';
import { RpcEndpoint } from 'universal-authenticator-library';
import { api } from 'src/api';
import { PriceChartData, Theme, TokenClass, TokenSourceInfo } from 'src/antelope/types';

const CHAIN_ID =
  '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4';
const NETWORK = 'wax';
const DISPLAY = 'WAX';
const TOKEN = new TokenClass({
    symbol: 'WAX',
    precision: 4,
    amount: 0,
    contract: 'eosio.token',
    isNative: true,
    isSystem: true,
} as TokenSourceInfo);
const HYPERION_ENDPOINT = 'https://wax.eosusa.io';
const RPC_ENDPOINT = {
    protocol: 'https',
    host: 'wax.eosusa.io',
    port: 443,
};
const NFT_ACCOUNTS = [] as string[];
const API_ENDPOINT = 'https://example.com';
const S3_PRODUCER_BUCKET = 'https://telos-producer-validation.s3.amazonaws.com';
const DISPLAY_MAP = true;
const THEME = {};

export default class EOS extends NativeChainSettings {
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
        return null;
    }

    getApiEndpoint(): string {
        return API_ENDPOINT;
    }

    getS3ProducerBucket(): string {
        return S3_PRODUCER_BUCKET;
    }

    getPriceData(): Promise<PriceChartData> {
        return api.getCoingeckoPriceChartData('wax');
    }

    getSystemToken(): TokenClass {
        return TOKEN;
    }

    getUsdPrice(): Promise<number> {
        return api.getCoingeckoUsdPrice('wax');
    }

    getLargeLogoPath(): string {
        return 'chains/wax/logo_lg.png';
    }

    getSmallLogoPath(): string {
        return 'chains/wax/logo_lg.png';
    }

    getMapDisplay(): boolean {
        return DISPLAY_MAP;
    }

    getTheme(): Theme {
        return THEME;
    }

    getFiltersSupported(prop: string): boolean {
        if (prop === 'notified') {
            return false;
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
