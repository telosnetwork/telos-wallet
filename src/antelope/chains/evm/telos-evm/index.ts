import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { RpcEndpoint } from 'universal-authenticator-library';
import { api } from 'src/api';
import { NativeCurrencyAddress, PriceChartData } from 'src/antelope/types';
import { TokenClass, TokenSourceInfo } from 'src/antelope/types';
import { useUserStore } from 'src/antelope/stores/user';
import { getFiatPriceFromIndexer } from 'src/api/price';

const LOGO = 'https://raw.githubusercontent.com/telosnetwork/images/master/logos_2021/Symbol%202.svg';
const CHAIN_ID = '40';
const NETWORK = 'telos-evm';
const DISPLAY = 'Telos EVM Mainnet';
const TOKEN = new TokenClass({
    name: 'Telos',
    symbol: 'TLOS',
    network: NETWORK,
    decimals: 18,
    address: NativeCurrencyAddress,
    logo: LOGO,
    logoURI: LOGO,
    isNative: false,
    isSystem: true,
} as TokenSourceInfo);

const S_TOKEN = new TokenClass({
    name: 'Staked Telos',
    symbol: 'STLOS',
    network: NETWORK,
    decimals: 18,
    address: '0xB4B01216a5Bc8F1C8A33CD990A1239030E60C905',
    isNative: false,
    isSystem: false,
} as TokenSourceInfo);

const W_TOKEN = new TokenClass({
    name: 'Wrapped Telos',
    symbol: 'WTLOS',
    network: NETWORK,
    decimals: 18,
    address: '0xD102cE6A4dB07D247fcc28F366A623Df0938CA9E',
    isNative: false,
    isSystem: false,
} as TokenSourceInfo);

const RPC_ENDPOINT = {
    protocol: 'https',
    host: 'mainnet.telos.net',
    port: 443,
    path: '/evm',
};

const WEI_PRECISION = 18;
const EXPLORER_URL = 'https://teloscan.io';
const ECOSYSTEM_URL = 'https://www.telos.net/ecosystem';
const NETWORK_EVM_ENDPOINT = 'https://mainnet.telos.net';
const INDEXER_ENDPOINT = 'https://api.teloscan.io';
const CONTRACTS_BUCKET = 'https://verified-evm-contracts.s3.amazonaws.com';

export default class TelosEVMTestnet extends EVMChainSettings {
    getNetwork(): string {
        return NETWORK;
    }

    getChainId(): string {
        return CHAIN_ID;
    }

    getDisplay(): string {
        return DISPLAY;
    }

    getHyperionEndpoint(): string {
        return NETWORK_EVM_ENDPOINT;
    }

    getRPCEndpoint(): RpcEndpoint {
        return RPC_ENDPOINT;
    }

    getPriceData(): Promise<PriceChartData> {
        return api.getCoingeckoPriceChartData('telos');
    }

    getSystemToken(): TokenClass {
        return TOKEN;
    }

    getStakedSystemToken(): TokenClass {
        return S_TOKEN;
    }

    getWrappedSystemToken(): TokenClass {
        return W_TOKEN;
    }

    async getUsdPrice(): Promise<number> {
        if (this.hasIndexerSupport()) {
            const nativeTokenSymbol = this.getSystemToken().symbol;
            const fiatCode = useUserStore().fiatCurrency;
            const fiatPrice = await getFiatPriceFromIndexer(nativeTokenSymbol, NativeCurrencyAddress, fiatCode, this.indexer);

            if (fiatPrice !== 0) {
                return fiatPrice;
            }
        }

        return await api.getCoingeckoUsdPrice('telos');
    }

    getLargeLogoPath(): string {
        return LOGO;
    }

    getSmallLogoPath(): string {
        return LOGO;
    }

    getWeiPrecision(): number {
        return WEI_PRECISION;
    }

    getExplorerUrl(): string {
        return EXPLORER_URL;
    }

    getEcosystemUrl(): string {
        return ECOSYSTEM_URL;
    }

    getTrustedContractsBucket(): string {
        return CONTRACTS_BUCKET;
    }

    getBuyMoreOfTokenLink(): string {
        return 'https://www.telos.net/#buy-tlos-simplex';
    }

    getImportantTokensIdList(): string[] {
        return [TOKEN.id, S_TOKEN.id, W_TOKEN.id];
    }

    getIndexerApiEndpoint(): string {
        return INDEXER_ENDPOINT;
    }

    hasIndexerSupport(): boolean {
        return true;
    }
}
