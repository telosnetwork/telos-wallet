import { PriceChartData, Token } from 'src/types';
import { RpcEndpoint } from 'universal-authenticator-library';
import { ChainSettings } from 'src/types';

export default abstract class EVMChainSettings implements ChainSettings {
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
    abstract getRPCEndpoint(): RpcEndpoint;
    abstract getPriceData(): Promise<PriceChartData>;
    abstract getUsdPrice(): Promise<number>;

    // new methods
    abstract getWeiPrecision(): number;
    abstract getExplorerUrl(): string;
}
