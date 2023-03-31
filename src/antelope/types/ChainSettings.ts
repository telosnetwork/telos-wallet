import { RpcEndpoint } from 'universal-authenticator-library';
import { PriceChartData } from 'src/antelope/types/PriceData';
import { Token } from 'src/antelope/types/Actions';

export interface ChainSettings {
    isNative(): boolean;
    getNetwork(): string;
    getSystemToken(): Token;
    getDisplay(): string;
    getSmallLogoPath(): string;
    getLargeLogoPath(): string;
    getChainId(): string;
    getRPCEndpoint(): RpcEndpoint;
    getPriceData(): Promise<PriceChartData>;
    getUsdPrice(): Promise<number>;
}
