import { RpcEndpoint } from 'universal-authenticator-library';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig, Method } from 'axios';
import { BlockscoutAdapter } from 'src/antelope/chains/utils/BlockscoutAdapter';
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
    Collectible,
    NFTContractClass,
    addressString,
    IndexerTransfersFilter,
    IndexerAccountTransfersResponse,
    constructNft,
    IndexerCollectionNftsFilter,
    IndexerAccountNftsFilter,
    IndexerAccountNftsResponse,
    GenericIndexerNft,
    IndexerContract,
    NftRawData,
    IndexerCollectionNftsResponse,
    Erc721Nft,
    getErc721Owner,
    Erc1155Nft,
    AntelopeError,
    IndexerAllowanceFilter,
    IndexerAllowanceResponseErc20,
    IndexerAllowanceResponseErc721,
    IndexerAllowanceResponseErc1155,
    getErc1155OwnersFromIndexer,
} from 'src/antelope/types';
import EvmContract from 'src/antelope/stores/utils/contracts/EvmContract';
import { ethers } from 'ethers';
import { toStringNumber } from 'src/antelope/stores/utils/currency-utils';
import { dateIsWithinXMinutes } from 'src/antelope/stores/utils/date-utils';
import { CURRENT_CONTEXT, getAntelope, useContractStore, useNftsStore } from 'src/antelope';
import { WEI_PRECISION, PRICE_UPDATE_INTERVAL_IN_MIN } from 'src/antelope/stores/utils';
import { BehaviorSubject, filter } from 'rxjs';
import { createTraceFunction } from 'src/antelope/config';


export default abstract class EVMChainSettings implements ChainSettings {
    // to avoid init() being called twice
    protected ready = false;

    protected initPromise: Promise<void>;

    // Short Name of the network
    protected network: string;

    // External query API support
    protected hyperion: AxiosInstance = axios.create({ baseURL: this.getHyperionEndpoint() });

    // External query API support
    protected api: AxiosInstance = axios.create({ baseURL: this.getApiEndpoint() });

    // External trusted metadata bucket for EVM contracts
    protected contractsBucket: AxiosInstance = axios.create({ baseURL: this.getTrustedContractsBucket() });

    // External indexer API support
    protected indexer: AxiosInstance = axios.create({ baseURL: this.getIndexerApiEndpoint() });

    // Blockscout adapter for API translation
    protected blockscoutAdapter: BlockscoutAdapter = new BlockscoutAdapter(this.indexer);

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
    protected contracts: Record<string, {
        promise: Promise<EvmContract | false>;
        resolve?: (value: EvmContract | false) => void;
    }> = {};

    // this variable helps to show the indexer health warning only once per session
    indexerHealthWarningShown = false;

    // This variable is used to simulate a bad indexer health state
    indexerBadHealthSimulated = false;

    // This observable is used to check if the indexer health state was already checked
    indexerChecked$ = new BehaviorSubject(false);

    // This function is used to trace the execution of the code
    trace = createTraceFunction('EVMChainSettings');

    simulateIndexerDown(isBad: boolean) {
        this.indexerBadHealthSimulated = isBad;
    }

    constructor(network: string) {
        this.network = network;

        const MAX_REQUESTS_COUNT = 5;
        const INTERVAL_MS = 10;
        let pendingRequests = 0;

        // Interceptor handlers -- these handlers are used to limit the number of concurrent requests
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const requestHandler = (value: InternalAxiosRequestConfig) => new Promise<InternalAxiosRequestConfig<any>>((resolve) => {
            const interval = setInterval(() => {
                if (pendingRequests < MAX_REQUESTS_COUNT) {
                    pendingRequests++;
                    clearInterval(interval);
                    resolve(value);
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
            this.updateIndexerHealthState().finally(() => {
                // we resolve the promise (in any case) that will be returned by init()
                resolve();
            });
        });
    }

    async initialized() {
        return this.initPromise;
    }

    async init(): Promise<void> {
        this.trace('init');
        // this is called only when this chain is needed to avoid initialization of all chains
        if (this.ready) {
            return this.initPromise;
        }
        this.ready = true;

        // this setTimeout is a work arround because we can't call getAntelope() function before it initializes
        setTimeout(() => {
            const timer = setInterval(async () => {
                try {
                    await this.updateIndexerHealthState();
                } catch (e) {
                    clearInterval(timer);
                    console.error('Indexer API not working for this chain:', this.getNetwork(), e);
                }
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
                        this.blockscoutAdapter.getHealth() :
                        Promise.resolve(this.deathHealthResponse),
                )
                .then(response => response as unknown as IndexerHealthResponse);

        // initial state
        this._indexerHealthState = {
            promise,
            state: this.deathHealthResponse,
        };

        // update indexer health state
        promise.then((state) => {
            this._indexerHealthState.state = state;
            this.indexerChecked$.next(true);
        });

        return promise;
    }

    /**
     * This function checks if the indexer is healthy and warns the user if it is not.
     * This warning should appear only once per session.
     */
    checkAndWarnIndexerHealth() {
        this.indexerChecked$.pipe(
            // This filter only allows to continue if the indexer health was already checked
            filter(indexerChecked => indexerChecked === true),
        ).subscribe(() => {
            if (!this.indexerHealthWarningShown && !this.isIndexerHealthy()) {
                this.indexerHealthWarningShown = true;
                const  ant = getAntelope();
                ant.config.notifyNeutralMessageHandler(
                    ant.config.localizationHandler('antelope.chain.indexer_bad_health_warning'),
                );
            }
        });
    }

    isIndexerHealthy(): boolean {
        if (this.indexerBadHealthSimulated) {
            return false;
        } else {
            return (
                this._indexerHealthState.state.success &&
                this._indexerHealthState.state.secondsBehind < getAntelope().config.indexerHealthThresholdSeconds
            );
        }
    }

    get indexerHealthState(): IndexerHealthResponse {
        return this._indexerHealthState.state;
    }

    isNative() {
        return false;
    }

    // only testnet chains should override this
    isTestnet() {
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
    abstract getEscrowContractAddress(): addressString;
    abstract getChainId(): string;
    abstract getDisplay(): string;
    abstract getHyperionEndpoint(): string;

    // Override to use a dedicated EVM JSON-RPC endpoint instead of hyperion/evm
    getEvmRpcEndpoint(): string | null {
        return null;
    }
    abstract getRPCEndpoint(): RpcEndpoint;
    abstract getApiEndpoint(): string;
    abstract getPriceData(): Promise<PriceChartData>;
    abstract getUsdPrice(): Promise<number>;
    abstract getBuyMoreOfTokenLink(): string;
    abstract getWeiPrecision(): number;
    abstract getExplorerUrl(): string;
    abstract getEcosystemUrl(): string;
    abstract getBridgeUrl(): string;
    abstract getTrustedContractsBucket(): string;
    abstract getSystemTokens(): TokenClass[];
    abstract getIndexerApiEndpoint(): string;
    abstract hasIndexerSupport(): boolean;
    abstract trackAnalyticsEvent(eventName: string): void;

    async getApy(): Promise<string> {
        const response = await this.api.get('apy/evm');
        return response.data as string;
    }

    async getBalances(account: string): Promise<TokenBalance[]> {
        this.trace('getBalances', account);
        if (!this.hasIndexerSupport()) {
            console.error('Indexer API not supported for this chain:', this.getNetwork());
            return [];
        }
        return Promise.all([
            this.blockscoutAdapter.getBalances(account, { limit: 50, offset: 0 }),
            this.getUsdPrice(),
        ]).then(async ([balances, systemTokenPrice]) => {
            // balances is already in IndexerAccountBalances format from adapter

            const tokenList = await this.getTokenList();
            const tokens: TokenBalance[] = [];

            for (const result of balances.results) {
                const token = tokenList.find(t => t.address.toLowerCase() === result.contract.toLowerCase());
                const contractData = balances.contracts[result.contract] ?? {};
                // fixing calldata
                const callDataStr = contractData.calldata as string | object ?? '{}';

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

                // Use token from list, or create one from Blockscout data
                const resolvedToken = token ?? new TokenClass({
                    name: contractData.name || 'Unknown',
                    symbol: contractData.symbol || '???',
                    network: this.getNetwork(),
                    decimals: contractData.decimals || 18,
                    address: result.contract,
                    logoURI: (contractData as { logoURI?: string }).logoURI || undefined,
                    isNative: false,
                    isSystem: false,
                } as TokenSourceInfo);

                if (resolvedToken) {
                    const balance = ethers.BigNumber.from(result.balance);
                    const tokenBalance = new TokenBalance(resolvedToken, balance);
                    tokens.push(tokenBalance);
                    const priceIsCurrent =
                        !!contractData.calldata?.marketdata_updated &&
                        dateIsWithinXMinutes(+contractData.calldata?.marketdata_updated, PRICE_UPDATE_INTERVAL_IN_MIN);

                    // If we have market data we use it, as long as the price was updated within the last 10 minutes
                    if (typeof contractData.calldata === 'object' && priceIsCurrent) {
                        const price = (+(contractData.calldata.price ?? 0)).toFixed(12);
                        const marketInfo = { ...contractData.calldata, price } as MarketSourceInfo;
                        const marketData = new TokenMarketData(marketInfo);
                        resolvedToken.market = marketData;
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
    async getNftsForCollection(collection: string, params: IndexerCollectionNftsFilter): Promise<Collectible[]> {
        this.trace('getNftsForCollection', collection, params);
        if (!this.hasIndexerSupport()) {
            console.error('Error fetching NFTs, Indexer API not supported for this chain:', this.getNetwork());
            return [];
        }
        // Use Blockscout adapter for NFT collection data
        const response = await this.blockscoutAdapter.getCollectionNfts(collection, params) as unknown as IndexerCollectionNftsResponse;

        // the indexer NFT data which will be used to construct NFTs
        const shapedIndexerNftData: GenericIndexerNft[] = response.results.map(nftResponse => ({
            metadata: nftResponse.metadata ? (typeof nftResponse.metadata === 'string' ? JSON.parse(nftResponse.metadata) : nftResponse.metadata) : {},
            tokenId: nftResponse.tokenId,
            contract: nftResponse.contract,
            updated: nftResponse.updated,
            imageCache: nftResponse.imageCache,
            tokenUri: nftResponse.tokenUri,
            supply: nftResponse.supply,
            owner: nftResponse.owner,
        }));
        this.trace('getNftsForCollection', { shapedIndexerNftData, response });

        // we fix the supportedInterfaces property if it is undefined in the response but present in the request
        Object.values(response.contracts).forEach((contract) => {
            contract.supportedInterfaces = contract.supportedInterfaces || (params.type ? [params.type.toLowerCase()] : undefined);
        });

        this.processNftContractsCalldata(response.contracts);
        const shapedNftData = this.shapeNftRawData(shapedIndexerNftData, response.contracts);
        this.trace('getNftsForCollection', { shapedNftData });
        const finalNftData =  this.processNftRawData(shapedNftData);
        this.trace('getNftsForCollection', { finalNftData });
        return finalNftData;
    }

    // get the NFTs belonging to a particular account
    async getNftsForAccount(account: string, params: IndexerAccountNftsFilter): Promise<Collectible[]> {
        if (!this.hasIndexerSupport()) {
            console.error('Error fetching NFTs, Indexer API not supported for this chain:', this.getNetwork());
            return [];
        }
        // Use Blockscout adapter for account NFTs
        const response = await this.blockscoutAdapter.getAccountNfts(account, params) as unknown as IndexerAccountNftsResponse;
        console.log('[NFT DEBUG] getAccountNfts response:', JSON.stringify({ resultCount: response.results?.length, contractKeys: Object.keys(response.contracts || {}), firstResult: response.results?.[0] }));

        // If the contract does not have the list of supported interfaces, we provide one
        Object.values(response.contracts).forEach((contract) => {
            if (contract.supportedInterfaces === null) {
                contract.supportedInterfaces = [params.type];
            }
        });

        // the indexer NFT data which will be used to construct NFTs
        const shapedIndexerNftData: GenericIndexerNft[] = response.results.map(nftResponse => ({
            metadata: nftResponse.metadata ? (typeof nftResponse.metadata === 'string' ? JSON.parse(nftResponse.metadata) : nftResponse.metadata) : {},
            tokenId: nftResponse.tokenId,
            contract: nftResponse.contract,
            updated: nftResponse.updated,
            imageCache: nftResponse.imageCache,
            tokenUri: nftResponse.tokenUri,
            supply: nftResponse.tokenIdSupply,
            owner: nftResponse.owner ?? account,
        }));

        this.processNftContractsCalldata(response.contracts);
        console.log('[NFT DEBUG] shapedIndexerNftData:', JSON.stringify(shapedIndexerNftData));
        console.log('[NFT DEBUG] contracts after calldata processing:', JSON.stringify(response.contracts));
        const shapedNftData = this.shapeNftRawData(shapedIndexerNftData, response.contracts);
        console.log('[NFT DEBUG] shapedNftData count:', shapedNftData.length);

        const result = await this.processNftRawData(shapedNftData);
        console.log('[NFT DEBUG] processNftRawData result count:', result.length);
        return result;
    }

    // ensure NFT contract calldata is an object
    processNftContractsCalldata(contracts: Record<string, IndexerContract>) {
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
        contracts: Record<string, IndexerContract>,
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
    async processNftRawData(shapedRawNfts: NftRawData[]): Promise<Collectible[]> {
        this.trace('processNftRawData', shapedRawNfts);
        const contractStore = useContractStore();
        const nftsStore = useNftsStore();

        // the same ERC1155 NFT can be returned multiple times by the indexer, once for each owner
        // so we need to filter out duplicates
        const erc1155RawData = shapedRawNfts.filter(({ contract }) => contract.supportedInterfaces.includes('erc1155'));
        const dedupedErc1155RawData = (() => {
            // filter out NFTs with the same contract address and tokenId
            const seen = new Set<string>();
            return erc1155RawData.filter(({ data }) => {
                const id = `${data.contract}-${data.tokenId}`;
                if (seen.has(id)) {
                    return false;
                }
                seen.add(id);
                return true;
            });
        })();
        const erc1155Nfts = Object.values(dedupedErc1155RawData)
            .map(async ({ data, contract }) => {
                const nft = (await constructNft(contract, data, this, contractStore, nftsStore)) as Erc1155Nft;
                const ownersUpdatedWithinThreeMins = dateIsWithinXMinutes(nft.ownerDataLastFetched, 3);

                if (!ownersUpdatedWithinThreeMins) {
                    const indexer = this.getIndexer();
                    const owners = await getErc1155OwnersFromIndexer(nft.contractAddress, nft.id, indexer);
                    nft.owners = owners;
                }

                return nft;
            });
        this.trace('processNftRawData', 'erc1155Nfts', erc1155Nfts);

        const erc721RawData = shapedRawNfts.filter(({ contract }) => contract.supportedInterfaces.includes('erc721'));
        const erc721Nfts = erc721RawData.map(async ({ data, contract }) => {
            const nft = (await constructNft(contract, data, this, contractStore, nftsStore)) as Erc721Nft;
            const ownersUpdatedWithinThreeMins = dateIsWithinXMinutes(nft.ownerDataLastFetched, 3);

            if (!ownersUpdatedWithinThreeMins) {
                const contractInstance = await (await contractStore.getContract(CURRENT_CONTEXT, nft.contractAddress))?.getContractInstance();
                if (!contractInstance) {
                    throw new AntelopeError('antelope.utils.error_contract_instance');
                }
                const owner = await getErc721Owner(contractInstance, nft.id);
                nft.owner = owner;
            }

            return nft;
        });
        this.trace('processNftRawData', 'erc721Nfts', erc721Nfts);

        const settledPromises = await Promise.allSettled([...erc1155Nfts, ...erc721Nfts]);

        const fulfilledPromises = settledPromises.filter(result => result.status === 'fulfilled') as PromiseFulfilledResult<Collectible>[];
        const rejectedPromises = settledPromises.filter(result => result.status === 'rejected') as PromiseRejectedResult[];

        rejectedPromises.forEach(({ reason }) => {
            console.error('Error constructing NFT', reason);
        });

        const nfts = fulfilledPromises.map(result => result.value as Collectible);
        this.trace('processNftRawData', 'nfts', nfts);

        return nfts;
    }

    constructTokenId(token: TokenSourceInfo): string {
        return `${token.symbol}-${token.address}-${this.getNetwork()}`;
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

        // Use Blockscout adapter for transactions
        return this.blockscoutAdapter.getTransactions(address, params as { limit?: number; offset?: number })
            .then(response => response as unknown as IndexerAccountTransactionsResponse);
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

        // Use Blockscout adapter for token transfers
        return this.blockscoutAdapter.getTokenTransfers(account, { type, limit, offset })
            .then(data => data as unknown as IndexerAccountTransfersResponse);
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
                logoURI: t.logoURI?.replace('ipfs://', 'https://w3s.link/ipfs/') ?? require('src/assets/tokens/telos.png'),
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

    async fetchContractCreationInfo(address: string): Promise<EvmContractCreationInfo> {
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
        const evmRpcEndpoint = this.getEvmRpcEndpoint();
        if (evmRpcEndpoint) {
            return axios.post(evmRpcEndpoint, rpcPayload)
                .then(response => response.data as T);
        }
        return this.hyperion.post('/evm', rpcPayload)
            .then(response => response.data as T);
    }

    getIndexer() {
        return this.indexer;
    }

    getBlockscoutAdapter() {
        return this.blockscoutAdapter;
    }

    /**
     * Get token holders for a specific contract/account
     * Used by allowances store for balance lookups
     */
    async getTokenHolders(contractAddress: string, params?: { account?: string; limit?: number; token_id?: string }) {
        return this.blockscoutAdapter.getTokenHolders(contractAddress, params);
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
        const price = ethers.utils.parseUnits(toStringNumber(tokenPrice), WEI_PRECISION);
        const system = gasPrice.mul(limit);
        const fiatDouble = system.mul(price);
        const fiat = fiatDouble.div(ethers.utils.parseUnits('1', WEI_PRECISION));
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

    // allowances

    /**
     * Fetch ERC-20 approvals by scanning the user's transaction history from Blockscout
     * for approve() calls (0x095ea7b3), then verifying current on-chain allowance.
     * This avoids eth_getLogs block range limits.
     */
    async fetchErc20Allowances(account: string, filter: IndexerAllowanceFilter): Promise<IndexerAllowanceResponseErc20> {
        const trace = createTraceFunction('EVMChainSettings');
        trace('fetchErc20Allowances', account);

        const APPROVE_SELECTOR = '0x095ea7b3';
        const ALLOWANCE_SELECTOR = '0xdd62ed3e';

        try {
            // Step 1: Get all transactions from Blockscout and find approve() calls
            const approvalMap = new Map<string, { contract: string; spender: string }>();
            let nextPageParams: string | null = null;
            let pageCount = 0;
            const maxPages = 10; // limit pagination to avoid excessive requests

            do {
                const txUrl: string = nextPageParams
                    ? `/api/v2/addresses/${account}/transactions?${nextPageParams}`
                    : `/api/v2/addresses/${account}/transactions`;

                const txResponse: AxiosResponse = await this.indexer.get(txUrl);
                const items: Array<{ raw_input?: string; method?: string; to?: { hash?: string } }> = txResponse.data.items || [];
                const nextPage: Record<string, string> | null = txResponse.data.next_page_params;

                for (const tx of items) {
                    const rawInput = tx.raw_input || '';
                    const method = tx.method || '';

                    // Check for approve(address spender, uint256 amount) calls
                    if (method === APPROVE_SELECTOR || (rawInput && rawInput.startsWith(APPROVE_SELECTOR))) {
                        if (rawInput && rawInput.length >= 138) {
                            const tokenContract = (tx.to?.hash || '').toLowerCase();
                            const spender = '0x' + rawInput.substring(34, 74).toLowerCase();
                            const key = `${tokenContract}:${spender}`;

                            if (tokenContract && !approvalMap.has(key)) {
                                approvalMap.set(key, { contract: tokenContract, spender });
                            }
                        }
                    }
                }

                // Build next page query string
                if (nextPage && typeof nextPage === 'object') {
                    nextPageParams = Object.entries(nextPage)
                        .map(([k, v]) => `${k}=${v}`)
                        .join('&');
                } else {
                    nextPageParams = null;
                }
                pageCount++;
            } while (nextPageParams && pageCount < maxPages);

            trace('fetchErc20Allowances', `Found ${approvalMap.size} unique approve calls`);

            // Step 2: Check current on-chain allowance for each
            const results: IndexerAllowanceResponseErc20['results'] = [];
            const contracts: IndexerAllowanceResponseErc20['contracts'] = {};
            const ownerPadded = account.slice(2).toLowerCase().padStart(64, '0');

            const allowanceChecks = Array.from(approvalMap.values()).map(async ({ contract, spender }) => {
                try {
                    const spenderPadded = spender.slice(2).toLowerCase().padStart(64, '0');
                    const callData = ALLOWANCE_SELECTOR + ownerPadded + spenderPadded;

                    const allowanceResponse = await this.doRPC<{ result: string }>({
                        method: 'eth_call',
                        params: [{ to: contract, data: callData }, 'latest'],
                    });

                    const amount = allowanceResponse.result || '0x0';
                    const amountBN = ethers.BigNumber.from(amount);

                    results.push({
                        owner: account.toLowerCase(),
                        contract: contract,
                        spender: spender,
                        amount: amountBN.toString(),
                        updated: Date.now(),
                    });

                    // Enrich contract info
                    if (!contracts[contract]) {
                        contracts[contract] = {
                            address: contract,
                            name: '',
                            symbol: '',
                            creator: '',
                            fromTrace: false,
                            trace_address: '',
                            supply: '0',
                            decimals: 18,
                            block: 0,
                            transaction: '',
                        } as IndexerContract;

                        try {
                            const tokenBalances = await this.blockscoutAdapter.getBalances(account);
                            const tokenInfo = tokenBalances.contracts[contract];
                            if (tokenInfo) {
                                contracts[contract].name = tokenInfo.name || '';
                                contracts[contract].symbol = tokenInfo.symbol || '';
                                contracts[contract].decimals = tokenInfo.decimals || 18;
                            }
                        } catch {
                            // keep defaults
                        }
                    }
                } catch (err) {
                    trace('fetchErc20Allowances', `Failed to check allowance for ${contract}:${spender}`, err);
                }
            });

            // Run in batches of 10
            for (let i = 0; i < allowanceChecks.length; i += 10) {
                await Promise.all(allowanceChecks.slice(i, i + 10));
            }

            return { results, contracts };
        } catch (err) {
            trace('fetchErc20Allowances', 'Failed to fetch approvals', err);
            return { results: [], contracts: {} };
        }
    }

    /**
     * Fetch ERC-721 approvals by scanning ApprovalForAll events.
     */
    async fetchErc721Allowances(account: string, filter: IndexerAllowanceFilter): Promise<IndexerAllowanceResponseErc721> {
        const trace = createTraceFunction('EVMChainSettings');
        trace('fetchErc721Allowances', account);

        // ApprovalForAll(address indexed owner, address indexed operator, bool approved)
        const APPROVAL_FOR_ALL_TOPIC = '0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31';
        const paddedOwner = '0x' + account.slice(2).toLowerCase().padStart(64, '0');

        try {
            const latestBlock = await this.getLatestBlock();
            const fromBlock = latestBlock.sub(2_000_000).lt(0)
                ? ethers.BigNumber.from(0)
                : latestBlock.sub(2_000_000);

            const logsResponse = await this.doRPC<{ result: Array<{
                address: string;
                topics: string[];
                data: string;
                blockNumber: string;
            }> }>({
                method: 'eth_getLogs',
                params: [{
                    fromBlock: fromBlock.toHexString(),
                    toBlock: 'latest',
                    topics: [APPROVAL_FOR_ALL_TOPIC, paddedOwner],
                }],
            });

            const logs = logsResponse.result || [];

            // Deduplicate by (contract, operator) — keep latest
            const approvalMap = new Map<string, { contract: string; operator: string; approved: boolean; blockNumber: number }>();
            for (const log of logs) {
                if (!log.topics || log.topics.length < 3) {
                    continue;
                }
                const contract = log.address.toLowerCase();
                const operator = '0x' + log.topics[2].slice(26);
                const approved = log.data !== '0x' + '0'.repeat(64); // data encodes bool
                const key = `${contract}:${operator}`;
                const blockNum = parseInt(log.blockNumber, 16);

                const existing = approvalMap.get(key);
                if (!existing || blockNum > existing.blockNumber) {
                    approvalMap.set(key, { contract, operator, approved, blockNumber: blockNum });
                }
            }

            const results = Array.from(approvalMap.values()).map(({ contract, operator, approved, blockNumber }) => ({
                owner: account.toLowerCase(),
                contract,
                operator,
                approved,
                single: false as const,
                updated: blockNumber * 500,
            }));

            return { results, contracts: {} };
        } catch (err) {
            trace('fetchErc721Allowances', 'Failed to fetch ERC-721 approvals', err);
            return { results: [], contracts: {} };
        }
    }

    async fetchErc1155Allowances(account: string, filter: IndexerAllowanceFilter): Promise<IndexerAllowanceResponseErc1155> {
        // ERC-1155 uses the same ApprovalForAll event as ERC-721
        // Reuse the same logic but shape results differently
        const erc721Results = await this.fetchErc721Allowances(account, filter);
        const results = erc721Results.results.map(r => ({
            owner: r.owner,
            contract: r.contract,
            operator: r.operator,
            approved: r.approved,
            updated: r.updated,
        }));
        return { results, contracts: {} };
    }
}
