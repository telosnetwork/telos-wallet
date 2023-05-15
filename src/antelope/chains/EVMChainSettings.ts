import { RpcEndpoint } from 'universal-authenticator-library';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, Method } from 'axios';
import {
    AbiSignature,
    ChainSettings,
    EvmBlockData,
    EvmContractCreationInfo,
    EvmToken,
    EvmTransaction,
    HyperionAbiSignatureFilter,
    PriceChartData,
    IndexerTransactionsFilter,
} from 'src/antelope/types';
import EvmContract from 'src/antelope/stores/utils/EvmContract';
import { ethers } from 'ethers';

export default abstract class EVMChainSettings implements ChainSettings {
    // Short Name of the network
    protected network: string;

    // External query API support
    protected hyperion: AxiosInstance = axios.create({ baseURL: this.getHyperionEndpoint() });
    protected indexer: AxiosInstance = axios.create({ baseURL: this.getIndexerEndpoint() });

    // External trusted metadata bucket for EVM contracts
    protected contractsBucket: AxiosInstance = axios.create({ baseURL: this.getHyperionEndpoint() });

    // Token list promise
    tokenListPromise: Promise<EvmToken[]> | null = null;

    // EvmContracts cache mapped by address
    protected contracts: Record<string, EvmContract | false> = {};

    constructor(network: string) {
        this.network = network;

        const MAX_REQUESTS_COUNT = 5;
        const INTERVAL_MS = 10;
        let pendingRequests = 0;

        // Interceptor handlers -- these handlers are used to limit the number of concurrent requests
        const requestHandler = (config: AxiosRequestConfig) => new Promise((resolve) => {
            const interval = setInterval(() => {
                if (pendingRequests < MAX_REQUESTS_COUNT) {
                    pendingRequests++;
                    clearInterval(interval);
                    resolve(config);
                }
            }, INTERVAL_MS);
        });

        const responseHandler = (response: AxiosResponse<unknown>) => {
            pendingRequests = Math.max(0, pendingRequests - 1);
            return Promise.resolve(response);
        };

        const erorrHandler = (error: unknown) => {
            pendingRequests = Math.max(0, pendingRequests - 1);
            return Promise.reject(error);
        };

        // Axios Request Interceptor
        this.hyperion.interceptors.request.use(requestHandler);

        // Axios Response Interceptor
        this.hyperion.interceptors.response.use(responseHandler, erorrHandler);

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

    abstract getSystemToken(): EvmToken;
    abstract getChainId(): string;
    abstract getDisplay(): string;
    abstract getHyperionEndpoint(): string;
    abstract getIndexerEndpoint(): string;
    abstract getRPCEndpoint(): RpcEndpoint;
    abstract getPriceData(): Promise<PriceChartData>;
    abstract getUsdPrice(): Promise<number>;
    abstract getBuyMoreOfTokenLink(): string;
    abstract getStlosContractAddress(): string;
    abstract getWtlosContractAddress(): string;

    // new methods
    abstract getWeiPrecision(): number;
    abstract getExplorerUrl(): string;
    abstract getTrustedContractsBucket(): string;
    abstract getImportantTokensIdList(): string[];

    constructTokenId(token: EvmToken): string {
        return `${token.symbol}-${token.address}-${this.getChainId()}`;
    }

    getContract(address: string): EvmContract | false | null {
        const key = address.toLowerCase();
        return this.contracts[key] ?? null;
    }

    addContract(address: string, contract: EvmContract) {
        const key = address.toLowerCase();
        if (!this.contracts[key]) {
            this.contracts[key] = contract;
        }
    }

    setContractAsNotExisting(address: string) {
        const key = address.toLowerCase();
        if (!this.contracts[key]) {
            this.contracts[key] = false;
        }
    }

    async getTransactions(filter: IndexerTransactionsFilter): Promise<EvmTransaction[]> {
        const address = filter.address;
        const limit = filter.limit;
        const offset = filter.offset;
        const includeAbi = filter.includeAbi;
        const sort = filter.sort;
        const includePagination = filter.includePagination;
        const logTopic = filter.logTopic;
        const full = filter.full;

        let aux = {};

        if (limit !== undefined) {
            aux = { limit, ...aux };
        }
        if (offset !== undefined) {
            aux = { offset, ...aux };
        }
        if (includeAbi !== undefined) {
            aux = { includeAbi, ...aux };
        }
        if (sort !== undefined) {
            aux = { sort, ...aux };
        }
        if (includePagination !== undefined) {
            aux = { includePagination, ...aux };
        }
        if (logTopic !== undefined) {
            aux = { logTopic, ...aux };
        }
        if (full !== undefined) {
            aux = { full, ...aux };
        }

        // eztodo refer to https://api.teloscan.io/v1/address/0x160505F3dfD1cb58B91e322c828Ae0F74c043c3C/transactions
        // eztodo figure out how to use contracts object in response
        const params: AxiosRequestConfig = aux as AxiosRequestConfig;
        const url = `v1/address/${address}/transactions`;

        return await this.indexer.get(url, { params })
            .then(response => response.data.results as EvmTransaction[])
            .catch((error) => {
                // eztodo better err handling
                console.log(error);
                return [];
            });
    }

    async getTokenList(): Promise<EvmToken[]> {
        if (this.tokenListPromise) {
            return this.tokenListPromise;
        }

        const url =  'https://raw.githubusercontent.com/telosnetwork/token-list/main/telosevm.tokenlist.json';
        this.tokenListPromise = axios.get(url)
            .then(results => results.data.tokens as unknown as {chainId:number, logoURI: string}[])
            .then(tokens => tokens.filter(({ chainId }) => chainId === +this.getChainId()))
            .then(tokens => tokens.map(t => ({
                ...t,
                logoURI: t.logoURI?.replace('ipfs://', 'https://w3s.link/ipfs/') ?? require('src/assets/logo--tlos.svg'),
            })))
            .then(tokens => tokens.map(t => ({
                // Token Id - '<symbol>-<address>-<chainId>'
                tokenId: `${(t as EvmToken).symbol}-${(t as EvmToken).address}-${t.chainId}`,
                // defaults value
                logo: t.logoURI,
                isNative: false,
                isSystem: false,
                price: 0,
                balance: '',
                fullBalance: '',
                fiatBalance: '',
                // actual token values
                ...t,
            })))
            .then(tokens => tokens.map(t => t as unknown as EvmToken));


        return this.tokenListPromise;
    }

    async getAbiSignature(filter: HyperionAbiSignatureFilter): Promise<AbiSignature> {
        const params: AxiosRequestConfig = filter as AxiosRequestConfig;
        return this.hyperion.get('/v2/evm/get_abi_signature', { params })
            .then(response => response.data as AbiSignature);
    }

    async getContractCreation(address: string): Promise<EvmContractCreationInfo> {
        return this.hyperion.get(`/v2/evm/get_contract?contract=${address}`)
            .then(response => response.data as EvmContractCreationInfo);
    }

    async getContractMetadata(checksumAddress: string): Promise<string> {
        return this.contractsBucket.get(`${checksumAddress}/metadata.json`)
            .then(response => response.data.content as string);
    }

    rpcCounter = 0;
    nextId(): number {
        return ++this.rpcCounter;
    }

    async doRPC<T>({ method, params }: AxiosRequestConfig): Promise<T> {
        const rpcPayload = {
            jsonrpc: '2.0',
            id: this.nextId(),
            method,
            params,
        };
        return this.hyperion.post('/evm', rpcPayload)
            .then(response => response.data as T);
    }

    async getGasPrice(): Promise<ethers.BigNumber> {
        return this.doRPC<{result:string}>({
            method: 'eth_gasPrice' as Method,
            params: [],
        }).then(response => ethers.BigNumber.from(response.result));
    }

    async getEstimatedGas(limit: number): Promise<{ system:ethers.BigNumber, fiat:ethers.BigNumber }> {
        const gasPrice: ethers.BigNumber = await this.getGasPrice();
        const tokenPrice: number = await this.getUsdPrice();
        const price = ethers.utils.parseUnits(tokenPrice.toString(), 18);
        const system = gasPrice.mul(limit);
        const fiatDouble = system.mul(price);
        const fiat = fiatDouble.div(ethers.utils.parseUnits('1', 18));
        return { system, fiat };
    }
    async getLatestBlock(): Promise<ethers.BigNumber> {
        return this.doRPC<{result:string}>({
            method: 'eth_blockNumber' as Method,
            params: [],
        }).then(response => ethers.BigNumber.from(response.result));
    }

    async getBlockByNumber(blockNumber: string): Promise<EvmBlockData> {
        return this.doRPC<{result:EvmBlockData}>({
            method: 'eth_getBlockByNumber' as Method,
            params: [parseInt(blockNumber).toString(16), false],
        }).then((response) => {
            console.error('type of response.result', typeof response.result, [response.result]);
            return response.result as EvmBlockData;
        });
    }
}
