import { RpcEndpoint } from 'universal-authenticator-library';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, Method } from 'axios';
import {
    AbiSignature,
    ChainSettings,
    EvmBlockData,
    EvmContractCreationInfo,
    HyperionAbiSignatureFilter,
    IndexerAccountBalances,
    IndexerTokenMarketData,
    PriceChartData,
    IndexerTransactionsFilter,
    IndexerAccountTransactionsResponse,
    TokenClass,
    TokenSourceInfo,
    TokenBalance,
    MarketSourceInfo,
    TokenMarketData,
    IndexerHealthResponse,
    NFT,
    NFTContractClass,
    IndexerTransfersFilter,
    IndexerAccountTransfersResponse,
    constructNft,
    IndexerCollectionNftsFilter,
    IndexerAccountNftsFilter,
    IndexerAccountNftsResponse,
    GenericIndexerNft,
    IndexerNftContract,
    NftRawData,
    IndexerCollectionNftsResponse,
} from 'src/antelope/types';
import EvmContract from 'src/antelope/stores/utils/contracts/EvmContract';
import { ethers } from 'ethers';
import { toStringNumber } from 'src/antelope/stores/utils/currency-utils';
import { dateIsWithinXMinutes } from 'src/antelope/stores/utils/date-utils';
import { getAntelope } from 'src/antelope';


export default abstract class EVMChainSettings implements ChainSettings {
    // to avoid init() being called twice
    protected ready = false;

    protected initPromise: Promise<void>;

    // Short Name of the network
    protected network: string;

    // External query API support
    protected hyperion: AxiosInstance = axios.create({ baseURL: this.getHyperionEndpoint() });

    // External trusted metadata bucket for EVM contracts
    protected contractsBucket: AxiosInstance = axios.create({ baseURL: this.getTrustedContractsBucket() });

    // External indexer API support
    protected indexer: AxiosInstance = axios.create({ baseURL: this.getIndexerApiEndpoint() });

    // indexer health check promise
    protected _indexerHealthState: {
        promise: Promise<IndexerHealthResponse> | null;
        state: IndexerHealthResponse
    } = {
        promise: null,
        state: this.deathHealthResponse,
    };

    // Token list promise
    tokenListPromise: Promise<TokenClass[]> | null = null;

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

        // Check indexer health state periodically
        this.initPromise = new Promise((resolve) => {
            this.updateIndexerHealthState().then(() => {
                // we resolve the promise that will be returned by init()
                resolve();
            });
        });
    }

    async initialized() {
        return this.initPromise;
    }

    async init(): Promise<void> {
        // this is called only when this chain is needed to avoid initialization of all chains
        if (this.ready) {
            return this.initPromise;
        }
        this.ready = true;

        // this setTimeout is a work arround because we can't call getAntelope() function before it initializes
        setTimeout(() => {
            setInterval(() => {
                this.updateIndexerHealthState();
            }, getAntelope().config.indexerHealthCheckInterval);
        }, 1000);

        // Update system token price
        this.getUsdPrice().then((value:number) => {
            const sys_token = this.getSystemToken();
            const price = value.toString();
            const marketInfo = { price } as MarketSourceInfo;
            const marketData = new TokenMarketData(marketInfo);
            sys_token.market = marketData;

            const wsys_token = this.getWrappedSystemToken();
            wsys_token.market = marketData;
        });

        return this.initPromise;
    }

    get deathHealthResponse() {
        return {
            success: false,
            blockNumber: 0,
            blockTimestamp: '',
            secondsBehind: Number.POSITIVE_INFINITY,
        } as IndexerHealthResponse;
    }

    async updateIndexerHealthState() {
        // resolve if this chain has indexer api support and is working fine

        const promise =
            Promise.resolve(this.hasIndexerSupport())
                .then(hasIndexerSupport =>
                    hasIndexerSupport ?
                        this.indexer.get('/v1/health') :
                        Promise.resolve({ data: this.deathHealthResponse } as AxiosResponse<IndexerHealthResponse>),
                )
                .then(response => response.data as unknown as IndexerHealthResponse)
                .catch((error) => {
                    console.error('Indexer API not working for this chain:', this.getNetwork(), error);
                    return this.deathHealthResponse as IndexerHealthResponse;
                });

        // initial state
        this._indexerHealthState = {
            promise,
            state: this.deathHealthResponse,
        };

        // update indexer health state
        promise.then((state) => {
            this._indexerHealthState.state = state;
        });

        return promise;
    }

    isIndexerHealthy(): boolean {
        return (
            this._indexerHealthState.state.success &&
            this._indexerHealthState.state.secondsBehind < getAntelope().config.indexerHealthThresholdSeconds
        );
    }

    get indexerHealthState(): IndexerHealthResponse {
        return this._indexerHealthState.state;
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

    abstract getSystemToken(): TokenClass;
    abstract getStakedSystemToken(): TokenClass;
    abstract getWrappedSystemToken(): TokenClass;
    abstract getChainId(): string;
    abstract getDisplay(): string;
    abstract getHyperionEndpoint(): string;
    abstract getRPCEndpoint(): RpcEndpoint;
    abstract getPriceData(): Promise<PriceChartData>;
    abstract getUsdPrice(): Promise<number>;
    abstract getBuyMoreOfTokenLink(): string;
    abstract getWeiPrecision(): number;
    abstract getExplorerUrl(): string;
    abstract getEcosystemUrl(): string;
    abstract getTrustedContractsBucket(): string;
    abstract getSystemTokens(): TokenClass[];
    abstract getIndexerApiEndpoint(): string;
    abstract hasIndexerSupport(): boolean;
    abstract trackAnalyticsEvent(params: Record<string, unknown>): void;

    async getBalances(account: string): Promise<TokenBalance[]> {
        if (!this.hasIndexerSupport()) {
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
        ]).then(async ([response, systemTokenPrice]) => {
            // parse to IndexerAccountBalances
            const balances = response.data as IndexerAccountBalances;

            const tokenList = await this.getTokenList();
            const tokens: TokenBalance[] = [];

            for (const result of balances.results) {
                const token = tokenList.find(t => t.address.toLowerCase() === result.contract.toLowerCase());
                const contractData = balances.contracts[result.contract] ?? {};
                const callDataStr = contractData.calldata as string | object;

                try {
                    if (typeof callDataStr === 'string') {
                        contractData.calldata = JSON.parse(callDataStr);
                    } else if (token?.isSystem) {
                        // system token systemTokenPrice
                        contractData.calldata = {
                            price: systemTokenPrice,
                        } as IndexerTokenMarketData;
                    }
                } catch (e) {
                    console.error('Error parsing calldata', `"${callDataStr}"`, e);
                }

                if (token) {
                    const balance = ethers.BigNumber.from(result.balance);
                    const tokenBalance = new TokenBalance(token, balance);
                    tokens.push(tokenBalance);
                    const priceUpdatedWithinTenMins = !!contractData.calldata.marketdata_updated && dateIsWithinXMinutes(+contractData.calldata.marketdata_updated, 10);

                    // If we have market data we use it, as long as the price was updated within the last 10 minutes
                    if (typeof contractData.calldata === 'object' && priceUpdatedWithinTenMins) {
                        const price = (+(contractData.calldata.price ?? 0)).toFixed(12);
                        const marketInfo = { ...contractData.calldata, price } as MarketSourceInfo;
                        const marketData = new TokenMarketData(marketInfo);
                        token.market = marketData;
                    }
                }
            }
            return tokens;
        }).catch((error) => {
            console.error(error);
            return [];
        });
    }

    // get the NFTs belonging to a particular contract (collection)
    async getNftsForCollection(collection: string, params: IndexerCollectionNftsFilter): Promise<NFT[]> {
        if (!this.hasIndexerSupport()) {
            console.error('Error fetching NFTs, Indexer API not supported for this chain:', this.getNetwork());
            return [];
        }
        const url = `v1/contract/${collection}/nfts`;
        const response = (await this.indexer.get(url, { params })).data as IndexerCollectionNftsResponse;

        // the indexer NFT data which will be used to construct NFTs
        const shapedIndexerNftData: GenericIndexerNft[] = response.results.map(nftResponse => ({
            owner: nftResponse.owner,
            metadata: JSON.parse(nftResponse.metadata),
            tokenId: nftResponse.tokenId,
            contract: nftResponse.contract,
            updated: nftResponse.updated,
            imageCache: nftResponse.imageCache,
            tokenUri: nftResponse.tokenUri,
            quantity: nftResponse.quantity,
        })).filter(
            // filter out NFTs with 0 balance; undefined means ERC721
            ({ quantity }) => quantity === undefined || quantity > 0,
        );

        this.processNftContractsCalldata(response.contracts);
        const shapedNftData = this.shapeNftRawData(shapedIndexerNftData, response.contracts);
        return this.processNftRawData(shapedNftData);
    }

    // get the NFTs belonging to a particular account
    async getNftsForAccount(account: string, params: IndexerAccountNftsFilter): Promise<NFT[]> {
        if (!this.hasIndexerSupport()) {
            console.error('Error fetching NFTs, Indexer API not supported for this chain:', this.getNetwork());
            return [];
        }
        const url = `v1/account/${account}/nfts`;
        const response = (await this.indexer.get(url, { params })).data as IndexerAccountNftsResponse;

        // the indexer NFT data which will be used to construct NFTs
        const shapedIndexerNftData: GenericIndexerNft[] = response.results.map(nftResponse => ({
            owner: account,
            metadata: JSON.parse(nftResponse.metadata),
            tokenId: nftResponse.tokenId,
            contract: nftResponse.contract,
            updated: nftResponse.updated,
            imageCache: nftResponse.imageCache,
            tokenUri: nftResponse.tokenUri,
            quantity: nftResponse.amount,
        })).filter(
            // filter out NFTs with 0 balance; undefined means ERC721
            ({ quantity }) => quantity === undefined || quantity > 0,
        );

        this.processNftContractsCalldata(response.contracts);
        const shapedNftData = this.shapeNftRawData(shapedIndexerNftData, response.contracts);
        return this.processNftRawData(shapedNftData);
    }

    // ensure NFT contract calldata is an object
    processNftContractsCalldata(contracts: Record<string, IndexerNftContract>) {
        for (const contract of Object.values(contracts)) {
            try {
                contract.calldata = typeof contract.calldata === 'string' ? JSON.parse(contract.calldata) : contract.calldata;
            } catch (e) {
                console.error('Error parsing metadata', `"${contract.calldata}"`, e);
            }
        }
    }

    // shape the raw data from the indexer into a format that can be used to construct NFTs
    shapeNftRawData(
        raw: GenericIndexerNft[],
        contracts: Record<string, IndexerNftContract>,
    ): NftRawData[] {
        const shaped = [] as NftRawData[];
        for (const item_source of raw) {
            const contract_source = contracts[item_source.contract];

            if (!contract_source) {
                // this case only happens if the indexer fails to index contract data
                continue;
            }
            const contract = new NFTContractClass(contract_source);

            shaped.push({
                data: item_source,
                contract,
            });
        }

        return shaped;
    }

    // process the shaped raw data into NFTs
    processNftRawData(shapedRawNfts: NftRawData[]): NFT[] {
        // the same ERC1155 NFT can be returned multiple times by the indexer, once for each owner
        // so we need to group these together and construct a single NFT for each unique NFT.
        // in the constructNft factory function, we will aggregate all of the data for each unique ERC1155 NFT
        const erc1155RawData = shapedRawNfts
            .filter(({ contract }) => contract.supportedInterfaces.includes('erc1155'))
            .reduce((acc, nftSource) => {
                const { data, contract } = nftSource;
                const key = `${contract.address}-${data.tokenId}`;

                if (!acc[key]) {
                    acc[key] = {
                        data: [],
                        contract,
                    };
                }
                acc[key].data.push(data);
                return acc;
            }, {} as Record<string, { data: GenericIndexerNft[], contract: NFTContractClass }>);
        // note that the 'data' object sent to the constructNft factory function is an array for the ERC1155 case;
        // each item contains the same information, but with a different 'owner' and 'quantity' field
        const erc1155Nfts = Object.values(erc1155RawData).map(({ data, contract }) => constructNft(contract, data));

        const erc721RawData = shapedRawNfts.filter(({ contract }) => contract.supportedInterfaces.includes('erc721'));
        const erc721Nfts = erc721RawData.map(({ data, contract }) => constructNft(contract, data));

        return [...erc1155Nfts, ...erc721Nfts];
    }

    constructTokenId(token: TokenSourceInfo): string {
        return `${token.symbol}-${token.address}-${this.getNetwork()}`;
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

    async getEVMTransactions(filter: IndexerTransactionsFilter): Promise<IndexerAccountTransactionsResponse> {
        const address = filter.address;
        const limit = filter.limit;
        const offset = filter.offset;
        const includeAbi = filter.includeAbi;
        const sort = filter.sort;
        const includePagination = true;
        const logTopic = filter.logTopic;
        const full = filter.full ?? true;

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

        const params: AxiosRequestConfig = aux as AxiosRequestConfig;
        const url = `v1/address/${address}/transactions`;

        // The following performs a GET request to the indexer endpoint.
        // Then it pipes the response to the IndexerAccountTransactionsResponse type.
        // Notice that the promise is not awaited, but returned instead immediately.
        return this.indexer.get(url, { params })
            .then(response => response.data as IndexerAccountTransactionsResponse);
    }

    async getEvmNftTransfers({
        account,
        type,
        limit,
        offset,
        includePagination,
        endBlock,
        startBlock,
        contract,
        includeAbi,
    }: IndexerTransfersFilter): Promise<IndexerAccountTransfersResponse> {
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
        if (type !== undefined) {
            aux = { type, ...aux };
        }
        if (includePagination !== undefined) {
            aux = { includePagination, ...aux };
        }
        if (endBlock !== undefined) {
            aux = { endBlock, ...aux };
        }
        if (startBlock !== undefined) {
            aux = { startBlock, ...aux };
        }
        if (contract !== undefined) {
            aux = { contract, ...aux };
        }

        const params = aux as AxiosRequestConfig;
        const url = `v1/account/${account}/transfers`;

        return this.indexer.get(url, { params })
            .then(response => response.data as IndexerAccountTransfersResponse);
    }

    async getTokenList(): Promise<TokenClass[]> {
        if (this.tokenListPromise) {
            return this.tokenListPromise;
        }

        const url =  'https://raw.githubusercontent.com/telosnetwork/token-list/main/telosevm.tokenlist.json';
        this.tokenListPromise = axios.get(url)
            .then(results => results.data.tokens as unknown as {chainId:number, logoURI: string}[])
            .then(tokens => tokens.filter(({ chainId }) => chainId === +this.getChainId()))
            .then(tokens => tokens.map(t => ({
                ...t,
                network: this.getNetwork(),
                logoURI: t.logoURI?.replace('ipfs://', 'https://w3s.link/ipfs/') ?? require('src/assets/logo--tlos.svg'),
            }) as unknown as TokenSourceInfo))
            .then(tokens => tokens.map(t => new TokenClass(t)))
            .then(tokens => [this.getSystemToken(), this.getWrappedSystemToken(), this.getStakedSystemToken(), ...tokens]);

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

    getIndexer() {
        return this.indexer;
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
        const price = ethers.utils.parseUnits(toStringNumber(tokenPrice), 18);
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
