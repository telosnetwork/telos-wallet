import { RpcEndpoint } from 'universal-authenticator-library';
import { PriceChartData, TokenClass } from 'src/antelope/types';

export interface ChainSettings {
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
    getImportantTokensIdList(): string[];
}
