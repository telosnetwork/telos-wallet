import NativeChainSettings from 'src/antelope/chains/NativeChainSettings';
import { RpcEndpoint } from 'universal-authenticator-library';
import { api } from 'src/api';
import { TokenClass, TokenSourceInfo, PriceChartData, Theme } from 'src/antelope/types';

const CHAIN_ID =
  'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906';
const NETWORK = 'eos';
const DISPLAY = 'EOS';
const TOKEN = new TokenClass({
    symbol: 'EOS',
    precision: 4,
    amount: 0,
    contract: 'eosio.token',
    isNative: true,
    isSystem: true,
} as TokenSourceInfo);
const HYPERION_ENDPOINT = 'https://eos.hyperion.eosrio.io';
const RPC_ENDPOINT = {
    protocol: 'https',
    host: 'eos.hyperion.eosrio.io',
    port: 443,
};
const FUEL_RPC_ENDPOINT = {
    protocol: 'https',
    host: 'eos.greymass.com',
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
        return FUEL_RPC_ENDPOINT;
    }

    getApiEndpoint(): string {
        return API_ENDPOINT;
    }

    getS3ProducerBucket(): string {
        return S3_PRODUCER_BUCKET;
    }

    getPriceData(): Promise<PriceChartData> {
        return api.getCoingeckoPriceChartData('eos');
    }

    getSystemToken(): TokenClass {
        return TOKEN;
    }

    getUsdPrice(): Promise<number> {
        return api.getCoingeckoUsdPrice('eos');
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
