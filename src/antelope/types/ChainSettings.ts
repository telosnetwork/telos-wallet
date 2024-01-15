import { RpcEndpoint } from 'universal-authenticator-library';
import {
    IndexerAccountNftsFilter,
    IndexerCollectionNftsFilter,
    Collectible,
    PriceChartData,
    TokenClass,
} from 'src/antelope/types';

export interface ChainSettings {
    init(): Promise<void>;
    isNative(): boolean;
    isTestnet(): boolean;
    getNetwork(): string;
    getSystemToken(): TokenClass;
    getTokenList(): Promise<TokenClass[]>;
    getDisplay(): string;
    getSmallLogoPath(): string;
    getLargeLogoPath(): string;
    getChainId(): string;
    getHyperionEndpoint(): string;
    getRPCEndpoint(): RpcEndpoint;
    getApiEndpoint(): string;
    getPriceData(): Promise<PriceChartData>;
    getUsdPrice(): Promise<number>;
    getSystemTokens(): TokenClass[];
    getNftsForAccount(address: string, filter: IndexerAccountNftsFilter): Promise<Collectible[]>;
    getNftsForCollection(contract: string, filter: IndexerCollectionNftsFilter): Promise<Collectible[]>;
    trackAnalyticsEvent(eventName: string): void;
    getApy(): Promise<string>;
}
