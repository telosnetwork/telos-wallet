import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { RpcEndpoint } from 'universal-authenticator-library';
import { api } from 'src/api';
import { EvmToken, NativeCurrencyAddress, PriceChartData } from 'src/antelope/types';
import { useUserStore } from 'src/antelope';
import { getFiatPriceFromIndexer } from 'src/api/price';

const LOGO = 'https://raw.githubusercontent.com/telosnetwork/images/master/logos_2021/Symbol%202.svg';
const CHAIN_ID = '41';
const NETWORK = 'telos-evm-testnet';
const DISPLAY = 'Telos EVM Testnet';
const TOKEN = {
    name: 'Telos',
    symbol: 'TLOS',
    decimals: 18,
    address: NativeCurrencyAddress,
    logo: LOGO,
    logoURI: LOGO,
    isNative: false,
    isSystem: true,
} as EvmToken;

const RPC_ENDPOINT = {
    protocol: 'https',
    host: 'testnet.telos.net',
    port: 443,
    path: '/evm',
};

const WEI_PRECISION = 18;
const EXPLORER_URL = 'https://testnet.teloscan.io';
const ECOSYSTEM_URL = 'https://www.telos.net/ecosystem';
const NETWORK_EVM_ENDPOINT = 'https://testnet.telos.net';
const INDEXER_ENDPOINT = 'https://api.testnet.teloscan.io';
const CONTRACTS_BUCKET = 'https://verified-evm-contracts-testnet.s3.amazonaws.com';

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
            return await getFiatPriceFromIndexer(nativeTokenSymbol, NativeCurrencyAddress, fiatCode, this.indexer);
        } else {
            return await api.getCoingeckoUsdPrice('telos');
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

    getEcosystemUrl(): string {
        return ECOSYSTEM_URL;
    }

    getTrustedContractsBucket(): string {
        return CONTRACTS_BUCKET;
    }

    getBuyMoreOfTokenLink(): string {
        return 'https://www.telos.net/#buy-tlos-simplex';
    }

    getStakedNativeTokenAddress() {
        return '0xa9991E4daA44922D00a78B6D986cDf628d46C4DD';
    }

    getWrappedNativeTokenAddress() {
        return '0xaE85Bf723A9e74d6c663dd226996AC1b8d075AA9';
    }

    getImportantTokensIdList(): string[] {
        return [
            this.constructTokenId(TOKEN),
            this.constructTokenId({ symbol: 'STLOS', address: this.getStakedNativeTokenAddress() } as EvmToken),
            this.constructTokenId({ symbol: 'WTLOS', address: this.getWrappedNativeTokenAddress() } as EvmToken),
        ];
    }

    getIndexerApiEndpoint(): string {
        return INDEXER_ENDPOINT;
    }

    hasIndexSupport(): boolean {
        return false;
    }

    getEvmNativeContractAccount(): string {
        return 'eosio.evm';
    }

}
