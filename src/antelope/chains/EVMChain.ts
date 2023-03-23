import { PriceChartData, Token } from 'src/types';
// import { Theme } from 'src/types';
import { RpcEndpoint } from 'universal-authenticator-library';
import { ChainSettings } from 'src/types';

export default abstract class EVMChain implements ChainSettings {
    protected network: string;

    constructor(network: string) {
        this.network = network;
    }

    isNative() {
        return false;
    }

    getNetwork(): string {
        return this.network;
    }

    getLargeLogoPath(): string {
        return `~/assets/${this.network}/logo_lg.svg`;
    }

    getSmallLogoPath(): string {
        return `~/assets/${this.network}/logo_sm.svg`;
    }

    abstract getSystemToken(): Token;
    abstract getChainId(): string;
    abstract getDisplay(): string;
    // abstract getHyperionEndpoint(): string;
    abstract getRPCEndpoint(): RpcEndpoint;
    // abstract getFuelRPCEndpoint(): RpcEndpoint | null;
    // abstract getApiEndpoint(): string;
    // abstract getS3ProducerBucket(): string;
    abstract getPriceData(): Promise<PriceChartData>;
    abstract getUsdPrice(): Promise<number>;
    // abstract getMapDisplay(): boolean;
    // abstract getTheme(): Theme;
    // abstract getFiltersSupported(prop: string): boolean;

    // new methods
    abstract getWeiPrecision(): number;
    abstract getExplorerUrl(): string;
}
