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
    HyperionActionsFilter,
    PriceChartData,
} from 'src/antelope/types';
import EvmContract from 'src/antelope/stores/utils/EvmContract';
import { ethers } from 'ethers';


export default abstract class EVMChainSettings implements ChainSettings {
    // Short Name of the network
    protected network: string;

    // External query API support
    protected hyperion: AxiosInstance = axios.create({ baseURL: this.getHyperionEndpoint() });

    // External trusted metadata bucket for EVM contracts
    protected contractsBucket: AxiosInstance = axios.create({ baseURL: this.getHyperionEndpoint() });

    // Token list promise
    tokenListPromise: Promise<EvmToken[]> | null = null;

    // EvmContracts cache mapped by address
    protected contracts: Record<string, EvmContract> = {};

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

    getContract(address: string): EvmContract | null {
        return this.contracts[address] ?? null;
    }

    addContract(address: string, contract: EvmContract) {
        if (!this.contracts[address]) {
            this.contracts[address] = contract;
        }
    }

    async getTransactions(filter: HyperionActionsFilter): Promise<EvmTransaction[]> {
        const account = filter.account || '';
        const page = filter.page || 1;
        const limit = filter.limit || 10;
        const skip = Math.max(0, page - 1) * limit;
        const notified = filter.notified || '';
        const sort = filter.sort || 'desc';
        const after = filter.after || '';
        const before = filter.before || '';
        const address = filter.address || '';
        const block = filter.block || '';
        const hash = filter.hash || '';

        let aux = {};
        if (account) {
            aux = { account, ...aux };
        }
        if (limit) {
            aux = { limit, ...aux };
        }
        if (skip) {
            aux = { skip, ...aux };
        }
        if (notified) {
            aux = { notified, ...aux };
        }
        if (sort) {
            aux = { sort, ...aux };
        }
        if (after) {
            aux = { after, ...aux };
        }
        if (before) {
            aux = { before, ...aux };
        }
        if (address) {
            aux = { address, ...aux };
        }
        if (block) {
            aux = { block, ...aux };
        }
        if (hash) {
            aux = { hash, ...aux };
        }
        if (filter.extras) {
            aux = { ...aux, ...filter.extras };
        }

        const params: AxiosRequestConfig = aux as AxiosRequestConfig;

        return this.hyperion.get('/v2/evm/get_transactions', { params })
            .then(response => response.data.transactions as EvmTransaction[]);
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
                // defaults values
                logo: t.logoURI ?? require('src/assets/logo--tlos.svg'),
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
