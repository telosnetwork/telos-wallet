import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { RpcEndpoint } from 'universal-authenticator-library';
import {
    Name,
    API,
    APIClient,
    ActionType,
    ABISerializable,
    Serializer,
    Action as EosioAction,
} from '@greymass/eosio';
import {
    ABIv1,
    AccountCreatorInfo,
    AccountDetails,
    Action,
    ActionData,
    Block,
    ChainInfo,
    ChainSettings,
    GetActionsResponse,
    GetProducers,
    GetProposals,
    GetProposalsProps,
    GetTableRowsParams,
    GetTableRowsResponse,
    HyperionActionsFilter,
    KeyAccounts,
    TokenClass,
    PermissionLinks,
    PermissionLinksData,
    PriceChartData,
    ProducerSchedule,
    ProducerScheduleData,
    TableByScope,
    TableIndexType,
    Theme,
    TransactionV1,
    TokenSourceInfo,
    TokenBalance,
    Collectible,
    IndexerAccountNftsFilter,
    IndexerCollectionNftsFilter,
} from 'src/antelope/types';
import { ethers } from 'ethers';
import { toStringNumber } from 'src/antelope/stores/utils/currency-utils';

export const DEFAULT_ICON = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjciIGhlaWdodD0iMTgiIHZpZXdCb3g9IjAgMCAyNyAxOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTgiIGN5PSI5IiByPSI4IiBmaWxsPSJ3aGl0ZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxjaXJjbGUgY3g9IjkiIGN5PSI5IiByPSI4IiBmaWxsPSJ3aGl0ZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjwvc3ZnPgo=';

const abortController = new AbortController();

export default abstract class NativeChainSettings implements ChainSettings {
    // to avoid init() being called twice
    protected ready = false;

    // Short Name of the network
    protected network: string;

    // External query API support
    protected hyperion: AxiosInstance = axios.create({ baseURL: this.getHyperionEndpoint() });

    // External query API support
    protected api: AxiosInstance = axios.create({ baseURL: this.getApiEndpoint() });

    // Core eosio
    protected eosioCore: APIClient = new APIClient({ url: this.getHyperionEndpoint() });

    // Token list promise
    tokenListPromise: Promise<TokenClass[]> | null = null;

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
                    clearInterval(interval as unknown as number);
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
        this.api.interceptors.request.use(requestHandler);

        // Axios Response Interceptor
        this.hyperion.interceptors.response.use(responseHandler, erorrHandler);
        this.api.interceptors.response.use(responseHandler, erorrHandler);

    }

    async init(): Promise<void> {
        // this is called only when this chain is needed to avoid initialization of all chains at once
        if (this.ready) {
            return;
        }
        this.ready = true;
    }

    isNative() {
        return true;
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
    abstract getChainId(): string;
    abstract getDisplay(): string;
    abstract getHyperionEndpoint(): string;
    abstract getRPCEndpoint(): RpcEndpoint;
    abstract getFuelRPCEndpoint(): RpcEndpoint | null;
    abstract getApiEndpoint(): string;
    abstract getS3ProducerBucket(): string;
    abstract getPriceData(): Promise<PriceChartData>;
    abstract getUsdPrice(): Promise<number>;
    abstract getMapDisplay(): boolean;
    abstract getTheme(): Theme;
    abstract getFiltersSupported(prop: string): boolean;
    abstract trackAnalyticsEvent(eventName: string): void;
    abstract getNftAccounts(): string[];

    /**
     * Retrieves the list of IDs for the important tokens.
     * These tokens will be displayed even when their balance is zero and will be considered system-basic tokens for the chain.
     *
     * @returns An array of strings representing the IDs of the important tokens.
     * Each ID follows the format: <symbol>-<contract>-<chainId>.
     */
    abstract getSystemTokens(): TokenClass[];

    async getNftsForAccount(owner: string, filter: IndexerAccountNftsFilter): Promise<Collectible[]> {
        throw new Error('Method not implemented yet getNftsForAccount() ' + + JSON.stringify({ ...filter, owner }));
    }

    async getNftsForCollection(contract: string, filter: IndexerCollectionNftsFilter): Promise<Collectible[]> {
        throw new Error('Method not implemented yet getNftsForCollection()' + JSON.stringify({ ...filter, contract }));
    }

    constructTokenId(token: TokenClass): string {
        return `${token.symbol}-${token.contract}-${this.getNetwork()}`;
    }

    async getApy(): Promise<string> {
        const response = await this.api.get('apy/native');
        return response.data as string;
    }

    // hyperion --
    async getHyperionAccountData(address: string): Promise<AccountDetails> {
        const response = await this.hyperion.get('v2/state/get_account', {
            params: { account: address },
        });
        return response.data as AccountDetails;
    }

    async getCreator(address: string): Promise<AccountCreatorInfo> {
        const response = await this.hyperion.get('v2/history/get_creator', {
            params: { account: address },
        });
        return response.data as AccountCreatorInfo;
    }

    async getTokenList(): Promise<TokenClass[]> {
        if (this.tokenListPromise) {
            return this.tokenListPromise;
        }

        const name = this.getNetwork();
        const url = `https://raw.githubusercontent.com/telosnetwork/token-list/main/tokens.${name}.json`;
        this.tokenListPromise = fetch(url)
            .then(response => response.text())
            .then((fileContent: string) => JSON.parse(fileContent) as TokenSourceInfo[])
            .then(tokens => tokens.map(t => ({
                ...t,
                network: this.getNetwork(),
                logoURI: t.logoURI?.replace('ipfs://', 'https://w3s.link/ipfs/') ?? require('src/assets/tokens/telos.png'),
            }) as unknown as TokenSourceInfo))
            .then(originals => originals.map(info => new TokenClass(info)))
            .catch((error) => {
                console.error(error);
                return [];
            });
        return this.tokenListPromise;
    }

    async getBalances(address?: string): Promise<TokenBalance[]> {
        const response = await this.hyperion.get('v2/state/get_tokens', {
            params: { account: address },
        });
        const tokens: TokenClass[] = await this.getTokenList();
        const balances = (response.data as { tokens: Partial<TokenSourceInfo>[] }).tokens;
        return balances.map((tokeninfo: Partial<TokenSourceInfo>) => {
            const amount = +(tokeninfo.amount ?? 0);
            const tk = tokens.find((t: TokenClass) => t.symbol === tokeninfo.symbol) as TokenClass;
            let balance = ethers.constants.Zero;
            if (amount > 0 && tk) {
                balance = ethers.utils.parseUnits(toStringNumber(amount), tk.decimals);
            }
            const tokenBalance = new TokenBalance(tk ? tk : { symbol:'', decimals:0 } as TokenClass, balance);
            return tokenBalance;
        },
        // filtering by positive balances
        ).filter((tokenBalance: TokenBalance) => tokenBalance.balance.gt(ethers.constants.Zero));
    }

    async getActions(filter: HyperionActionsFilter): Promise<GetActionsResponse> {
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
            aux = { 'act.name': '!onblock', ...aux, ...filter.extras };
        }
        const params: AxiosRequestConfig = aux as AxiosRequestConfig;

        return this.hyperion.get<ActionData>('v2/history/get_actions', { params });
    }

    async getTransaction(address?: string): Promise<ActionData> {
        const response = await this.hyperion.get<ActionData>(
            'v2/history/get_transaction',
            {
                params: { id: address },
            },
        );
        return response.data;
    }

    async getTransactionV1(id?: string): Promise<TransactionV1> {
        const response = await this.hyperion.post<TransactionV1>(
            'v1/history/get_transaction',
            {
                id: id,
            },
        );
        return response.data;
    }

    async getChildren(address?: string): Promise<Action[]> {
        const response = await this.hyperion.get<ActionData>('v2/history/get_actions', {
            params: {
                limit: 100,
                account: address,
                filter: 'eosio:newaccount',
                skip: 0,
            },
        });
        return response.data.actions;
    }

    async getPermissionLinks(address?: string): Promise<PermissionLinks[]> {
        const response = await this.hyperion.get<PermissionLinksData>(
            'v2/state/get_links',
            {
                params: {
                    account: address,
                },
            },
        );
        return response.data.links;
    }

    async getTableByScope(data: unknown): Promise<TableByScope[]> {
        const response = await this.hyperion.post('v1/chain/get_table_by_scope', data);
        return (response.data as {rows:TableByScope[]}).rows;
    }

    async getBlock(block: string): Promise<Block> {
        abortController.abort();
        const response = await this.hyperion.post('v1/chain/get_block', {
            block_num_or_id: block,
        });
        return response.data as Block;
    }

    async getInfo(): Promise<ChainInfo> {
        abortController.abort();
        const response = await this.hyperion.get('v1/chain/get_info');
        return response.data as ChainInfo;
    }

    async getSchedule(): Promise<ProducerSchedule> {
        abortController.abort();
        const response = await this.hyperion.get('v1/chain/get_producer_schedule');
        return response.data as ProducerSchedule;
    }

    async getProposals({
        proposer,
        proposal,
        requested,
        provided,
        executed,
        limit,
        skip,
    }: GetProposalsProps): Promise<GetProposals> {
        const response = await this.hyperion.get('v2/state/get_proposals', {
            params: {
                proposer,
                proposal,
                requested,
                provided,
                executed,
                limit,
                skip,
            },
        });
        return response.data as GetProposals;
    }

    async getProducers(): Promise<GetProducers> {
        const response = await this.hyperion.post('v1/chain/get_producers', {
            json: true,
            limit: 10000,
        });
        return response.data as GetProducers;
    }

    async getABI(account: string): Promise<ABIv1> {
        const response = await this.hyperion.post('v1/chain/get_abi', {
            account_name: account,
        });
        return response.data as ABIv1;
    }

    async getHyperionKeyAccounts(key: string): Promise<KeyAccounts> {
        const response = await this.hyperion.get('v2/state/get_key_accounts', {
            params: { public_key: key },
        });
        return response.data as { account_names: string[] };
    }

    async getProducerSchedule(): Promise<ProducerScheduleData> {
        const response = await this.hyperion.get('v1/chain/get_producer_schedule');
        return response.data as { active: { producers: { producer_name: string }[] } };
    }

    // eosioCore --
    async getAccount(address: string): Promise<API.v1.AccountObject> {
        return this.eosioCore.v1.chain.get_account(address);
    }

    async getKeyAccounts(key: string): Promise<KeyAccounts> {
        return (await this.eosioCore.v1.history.get_key_accounts(key)) as unknown as KeyAccounts;
    }

    async getContractTokensBalances(contract: string, address: string): Promise<unknown> {
        return await this.eosioCore.v1.chain.get_currency_balance(contract, address);
    }

    async getTableRows<Index extends TableIndexType = Name>(
        params: GetTableRowsParams<Index>,
    ): Promise<GetTableRowsResponse<Index>> {
        return await this.eosioCore.v1.chain.get_table_rows(params);
    }

    async deserializeActionData(data: ActionType): Promise<ABISerializable> {
        const { abi } = await this.eosioCore.v1.chain.get_abi(data.account);
        if (!abi) {
            throw new Error(`No ABI for ${String(data.account)}`);
        }
        const action = EosioAction.from(data, abi);

        return Serializer.objectify(action.decodeData(abi));
    }

    async serializeActionData(account: string, name: string, data: unknown): Promise<string> {
        const { abi } = await this.eosioCore.v1.chain.get_abi(account);
        if (!abi) {
            throw new Error(`No ABI for ${account}`);
        }

        const { hexString } = Serializer.encode({ object: data, abi, type: name });
        return hexString;
    }
}
