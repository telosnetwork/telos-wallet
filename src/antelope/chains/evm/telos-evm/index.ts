import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { RpcEndpoint } from 'universal-authenticator-library';
import { api } from 'src/api';
import { EvmToken, PriceChartData } from 'src/antelope/types';

const LOGO = 'https://raw.githubusercontent.com/telosnetwork/images/master/logos_2021/Symbol%202.svg';
const CHAIN_ID = '40';
const NETWORK = 'telos-evm';
const DISPLAY = 'Telos EVM Mainnet';
const TOKEN = {
    name: 'Telos',
    symbol: 'TLOS',
    decimals: 18,
    address: '',
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

    getIndexerEndpoint(): string {
        return INDEXER_ENDPOINT;
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

    getUsdPrice(): Promise<number> {
        return api.getCoingeckoUsdPrice('telos');
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
}
