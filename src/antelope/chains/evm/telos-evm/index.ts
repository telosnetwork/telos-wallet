import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { RpcEndpoint } from 'universal-authenticator-library';
import { api } from 'src/api';
import { EvmToken, PriceChartData } from 'src/antelope/types';
import { useUserStore } from 'src/antelope';
import { getFiatPriceFromIndexer } from 'src/api/price';

const LOGO = 'https://raw.githubusercontent.com/telosnetwork/images/master/logos_2021/Symbol%202.svg';
const CHAIN_ID = '40';
const NETWORK = 'telos-evm';
const DISPLAY = 'Telos EVM Mainnet';
const TOKEN = {
    name: 'Telos',
    symbol: 'TLOS',
    decimals: 18,
    address: '___NATIVE_CURRENCY___',
    logo: LOGO,
    logoURI: LOGO,
    isNative: false,
    isSystem: true,
} as EvmToken;

const RPC_ENDPOINT = {
    protocol: 'https',
    host: 'mainnet.telos.net',
    port: 443,
    path: '/evm',
};

const WEI_PRECISION = 18;
const EXPLORER_URL = 'https://teloscan.io';
const NETWORK_EVM_ENDPOINT = 'https://mainnet.telos.net';
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

    getSystemToken(): EvmToken {
        return { ...TOKEN, tokenId: this.constructTokenId(TOKEN) } as EvmToken;
    }

    async getUsdPrice(): Promise<number> {
        if (this.hasIndexSupport()) {
            const nativeTokenSymbol = this.getSystemToken().symbol;
            const fiatCode = useUserStore().fiatCurrency;
            return getFiatPriceFromIndexer(nativeTokenSymbol, fiatCode, this.indexer);
        } else {
            return api.getCoingeckoUsdPrice('telos');
        }
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

    getTrustedContractsBucket(): string {
        return CONTRACTS_BUCKET;
    }

    getBuyMoreOfTokenLink(): string {
        return 'https://www.telos.net/#buy-tlos-simplex';
    }

    getStlosContractAddress() {
        return '0xB4B01216a5Bc8F1C8A33CD990A1239030E60C905';
    }

    getWtlosContractAddress() {
        return '0xD102cE6A4dB07D247fcc28F366A623Df0938CA9E';
    }

    getImportantTokensIdList(): string[] {
        return [
            this.constructTokenId(TOKEN),
            this.constructTokenId({ symbol: 'STLOS', address: this.getStlosContractAddress() } as EvmToken),
            this.constructTokenId({ symbol: 'WTLOS', address: this.getWtlosContractAddress() } as EvmToken),
        ];
    }

    getIndexerApiEndpoint(): string {
        return 'https://api.teloscan.io/';
    }

    hasIndexSupport(): boolean {
        return true;
    }
}
