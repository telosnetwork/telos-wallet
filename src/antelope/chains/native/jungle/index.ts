import NativeChainSettings from 'src/antelope/chains/NativeChainSettings';
import { RpcEndpoint } from 'universal-authenticator-library';
import { api } from 'src/api';
import { TokenClass, TokenSourceInfo, PriceChartData, Theme } from 'src/antelope/types';

const CHAIN_ID =
  '73e4385a2708e6d7048834fbc1079f2fabb17b3c125b146af438971e90716c4d';
const NETWORK = 'jungle';
const DISPLAY = 'Jungle 4';
const TOKEN = new TokenClass({
    symbol: 'EOS',
    precision: 4,
    amount: 0,
    contract: 'eosio.token',
    isNative: true,
    isSystem: true,
} as TokenSourceInfo);
const HYPERION_ENDPOINT = 'https://jungle.eosusa.news';
const S3_PRODUCER_BUCKET = 'https://telos-producer-validation.s3.amazonaws.com';
const RPC_ENDPOINT = {
    protocol: 'https',
    host: 'jungle.eosusa.news',
    port: 443,
};
const NFT_ACCOUNTS = [] as string[];
const API_ENDPOINT = 'https://example.com';
const DISPLAY_MAP = true;
const THEME = {};

export default class TelosTestnet extends NativeChainSettings {
    isTestnet() {
        return true;
    }

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
        return 'chains/eos/eos_large.png';
    }

    getSmallLogoPath(): string {
        return 'chains/eos/eos.png';
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
