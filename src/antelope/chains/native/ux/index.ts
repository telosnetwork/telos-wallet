import NativeChainSettings from 'src/antelope/chains/NativeChainSettings';
import { RpcEndpoint } from 'universal-authenticator-library';
import { api } from 'src/api';
import { TokenClass, TokenSourceInfo, PriceChartData, Theme } from 'src/antelope/types';

const CHAIN_ID =
  '8fc6dce7942189f842170de953932b1f66693ad3788f766e777b6f9d22335c02';
const NETWORK = 'ux';
const DISPLAY = 'UX';
const TOKEN = new TokenClass({
    symbol: 'UTX',
    precision: 4,
    amount: 0,
    contract: 'eosio.token',
    isNative: true,
    isSystem: true,
} as TokenSourceInfo);
const HYPERION_ENDPOINT = 'https://ux.eosusa.io';
const RPC_ENDPOINT = {
    protocol: 'https',
    host: 'ux.eosusa.io',
    port: 443,
};
const NFT_ACCOUNTS = [] as string[];
const API_ENDPOINT = 'https://example.com';
const S3_PRODUCER_BUCKET = 'https://telos-producer-validation.s3.amazonaws.com';
const DISPLAY_MAP = true;
const THEME = {};

export default class UX extends NativeChainSettings {
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
        return api.getEmptyPriceChartData();
    }

    getSystemToken(): TokenClass {
        return TOKEN;
    }

    getUsdPrice(): Promise<number> {
        return Promise.resolve(0);
    }

    getLargeLogoPath(): string {
        return 'chains/ux/logo_sm.jpeg';
    }

    getSmallLogoPath(): string {
        return 'chains/ux/logo_sm.jpeg';
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
