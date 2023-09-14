import { RpcEndpoint } from 'universal-authenticator-library';
import {
    IndexerAccountNftsFilter,
    IndexerCollectionNftsFilter,
    NFT,
    PriceChartData,
    TokenClass,
} from 'src/antelope/types';

export interface ChainSettings {
    init(): Promise<void>;
    isNative(): boolean;
    getNetwork(): string;
    getSystemToken(): TokenClass;
    getTokenList(): Promise<TokenClass[]>;
    getDisplay(): string;
    getSmallLogoPath(): string;
    getLargeLogoPath(): string;
    getChainId(): string;
    getRPCEndpoint(): RpcEndpoint;
    getPriceData(): Promise<PriceChartData>;
    getUsdPrice(): Promise<number>;
    getSystemTokens(): TokenClass[];
    getNftsForAccount(address: string, filter: IndexerAccountNftsFilter): Promise<NFT[]>;
    getNftsForCollection(contract: string, filter: IndexerCollectionNftsFilter): Promise<NFT[]>;
    trackAnalyticsEvent(params: Record<string, unknown>): void;
}
