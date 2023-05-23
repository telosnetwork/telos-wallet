import { RpcEndpoint } from 'universal-authenticator-library';
import { PriceChartData } from 'src/antelope/types/PriceData';
import { TokenClass } from 'src/antelope/chains/Token';

export interface ChainSettings {
    isNative(): boolean;
    getNetwork(): string;
    getSystemToken(): TokenClass;
    getDisplay(): string;
    getSmallLogoPath(): string;
    getLargeLogoPath(): string;
    getChainId(): string;
    getRPCEndpoint(): RpcEndpoint;
    getPriceData(): Promise<PriceChartData>;
    getUsdPrice(): Promise<number>;
    getImportantTokensIdList(): string[];
    getTokenList(): Promise<TokenClass[]>
}
