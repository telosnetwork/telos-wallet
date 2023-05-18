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
    IndexerAccountBalances,
    IndexerTokenMarketData,
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

    // External indexer API support
    protected indexer: AxiosInstance = axios.create({ baseURL: this.getIndexerApiEndpoint() });

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
        this.indexer.interceptors.request.use(requestHandler);

        // Axios Response Interceptor
        this.hyperion.interceptors.response.use(responseHandler, erorrHandler);
        this.indexer.interceptors.response.use(responseHandler, erorrHandler);

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
    abstract getImportantTokensIdList(): string[];
    abstract getIndexerApiEndpoint(): string;
    abstract hasIndexSupport(): boolean;

    async getAllBalances(account: string): Promise<EvmToken[]> {
        if (!this.hasIndexSupport()) {
            console.error('Indexer API not supported for this chain:', this.getNetwork());
            return [];
        }
        return Promise.all([
            this.indexer.get(`v1/account/${account}/balances`, {
                params: {
                    limit: 50,
                    offset: 0,
                    includePagination: false,
                },
            }),
            this.getUsdPrice(),
        ]).then(([response, systemTokenPrice]) => {
            // parse to IndexerAccountBalances
            const balances = response.data as IndexerAccountBalances;

            return this.getTokenList().then((tokenList:EvmToken[]) => {
                const tokens: EvmToken[] = [];
                for (const result of balances.results) {
                    const token = tokenList.find(t => t.address.toLowerCase() === result.contract.toLowerCase());
                    const contractData = balances.contracts[result.contract] ?? {};
                    const callDataStr = contractData.calldata as unknown as string;
                    try {
                        if (typeof callDataStr === 'string') {
                            const callData = JSON.parse(callDataStr);
                            contractData.calldata = callData;
                        } else if (token?.isSystem) {
                            // system token systemTokenPrice
                            contractData.calldata = {
                                price: systemTokenPrice.toString(),
                            } as IndexerTokenMarketData;
                        }
                    } catch (e) {
                        console.error('Error parsing calldata', `"${callDataStr}"`, e);
                    }

                    if (token) {
                        const balance = ethers.BigNumber.from(result.balance);
                        token.balance = ethers.utils.formatUnits(balance, token.decimals);
                        token.balanceBn = balance;
                        token.fullBalance = token.balance;
                        if (typeof contractData.calldata === 'object') {
                            token.price = parseFloat(contractData.calldata.price);
                            token.fiatBalance = (token.price * parseFloat(token.balance)).toFixed(2);
                        }
                        tokens.push(token);
                    }
                }
                return tokens;
            });
        }).catch((error) => {
            console.error(error);
            return [];
        });
    }

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

        type PartialToken = {chainId:number, logoURI: string, address: string};

        const url =  'https://raw.githubusercontent.com/telosnetwork/token-list/main/telosevm.tokenlist.json';
        this.tokenListPromise = axios.get(url)
            .then(results => results.data.tokens as unknown as PartialToken[])
            .then(tokens => tokens.filter(({ chainId }) => chainId === +this.getChainId()))
            .then(tokens => tokens.map(t => ({
                ...t,
                logoURI: t.logoURI?.replace('ipfs://', 'https://w3s.link/ipfs/') ?? require('src/assets/logo--tlos.svg'),
            })))
            .then(tokens => [this.getSystemToken() as unknown as PartialToken].concat(tokens))
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
