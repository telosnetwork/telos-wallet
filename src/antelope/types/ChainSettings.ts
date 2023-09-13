import { RpcEndpoint } from 'universal-authenticator-library';
import { IndexerTransactionsFilter, NFT, PriceChartData, TokenClass } from 'src/antelope/types';

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
    getNFTsInventory(address: string, filter: IndexerTransactionsFilter): Promise<NFT[]>;
    getNFTsCollection(contract: string, filter: IndexerTransactionsFilter): Promise<NFT[]>;
    trackAnalyticsEvent(params: Record<string, unknown>): void;
}
