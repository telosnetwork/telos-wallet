/**
 * BlockscoutAdapter - Translates Blockscout API v2 responses to legacy Teloscan v1 format
 * This allows the wallet to use Blockscout without rewriting all response handlers
 */

import { AxiosInstance } from 'axios';

// Blockscout v2 response types
export interface BlockscoutStats {
    average_block_time: number;
    coin_price: string;
    total_blocks: string;
    total_transactions: string;
    total_addresses: string;
    // ... other fields
}

export interface BlockscoutTokenHolder {
    address: {
        hash: string;
        name: string | null;
        is_contract: boolean;
    };
    value: string;
    token_id: string | null;
}

export interface BlockscoutToken {
    address_hash: string;
    name: string;
    symbol: string;
    decimals: string;
    type: string;
    holders_count: string;
    total_supply: string;
    icon_url: string | null;
    exchange_rate: string | null;
}

export interface BlockscoutAddressToken {
    token: BlockscoutToken;
    value: string;
    token_id: string | null;
}

export interface BlockscoutSmartContract {
    address_hash: string;
    name: string | null;
    abi: unknown[] | null;
    source_code: string | null;
    is_verified: boolean;
}

export interface BlockscoutTransaction {
    hash: string;
    block_number: number;
    from: { hash: string } | null;
    to: { hash: string } | null;
    value: string;
    gas_limit: string;
    gas_price: string;
    gas_used: string;
    nonce: number;
    position: number;
    status: string;
    timestamp: string;
    raw_input: string;
    decoded_input: { method_call: string } | null;
    created_contract: { hash: string } | null;
    fee: { value: string } | null;
    result: string;
    transaction_types: string[];
}

export interface BlockscoutNFTInstance {
    id: string;
    metadata: Record<string, unknown> | null;
    owner: { hash: string } | null;
    image_url: string | null;
    token: BlockscoutToken;
}

// Legacy Teloscan v1 format adapters
export interface LegacyHealthResponse {
    success: boolean;
    blockNumber: number;
    blockTimestamp: string;
    secondsBehind: number;
    version: string;
}

export interface LegacyTokenBalance {
    contract: string;
    balance: string;
}

export interface LegacyBalancesResponse {
    results: LegacyTokenBalance[];
    contracts: Record<string, {
        address: string;
        name: string;
        symbol: string;
        decimals: number;
        logoURI?: string;
        calldata?: {
            price?: number;
            marketdata_updated?: string;
        };
    }>;
}

export interface LegacyTokenHolder {
    address: string;
    balance: string;
    tokenId?: string;
}

export interface LegacyTokenHoldersResponse {
    results: LegacyTokenHolder[];
}

export interface LegacyContractResponse {
    address: string;
    name: string | null;
    abi: unknown[] | null;
    verified: boolean;
    supportedInterfaces?: string[];
    calldata?: unknown;
}

/**
 * Adapter class to translate Blockscout v2 API to legacy v1 format
 */
export class BlockscoutAdapter {
    private indexer: AxiosInstance;

    constructor(indexer: AxiosInstance) {
        this.indexer = indexer;
    }

    /**
     * Health check - /v1/health → /api/v2/stats
     */
    async getHealth(): Promise<LegacyHealthResponse> {
        try {
            const response = await this.indexer.get('/api/v2/stats');
            const stats = response.data as BlockscoutStats;

            return {
                success: true,
                blockNumber: parseInt(stats.total_blocks) || 0,
                blockTimestamp: new Date().toISOString(),
                secondsBehind: 0, // Blockscout doesn't provide this directly
                version: 'blockscout-v2',
            };
        } catch (error) {
            return {
                success: false,
                blockNumber: 0,
                blockTimestamp: '',
                secondsBehind: Number.POSITIVE_INFINITY,
                version: 'blockscout-v2',
            };
        }
    }

    /**
     * Token balances - /v1/account/{addr}/balances → /api/v2/addresses/{addr}/tokens
     */
    async getBalances(account: string, params?: { limit?: number; offset?: number }): Promise<LegacyBalancesResponse> {
        // Blockscout v2 doesn't accept limit/offset on this endpoint
        const response = await this.indexer.get(`/api/v2/addresses/${account}/tokens`, {
            params: { type: 'ERC-20' },
        });

        const items = response.data.items as BlockscoutAddressToken[];
        const results: LegacyTokenBalance[] = [];
        const contracts: LegacyBalancesResponse['contracts'] = {};

        for (const item of items) {
            results.push({
                contract: item.token.address_hash,
                balance: item.value,
            });

            contracts[item.token.address_hash] = {
                address: item.token.address_hash,
                name: item.token.name,
                symbol: item.token.symbol,
                decimals: parseInt(item.token.decimals) || 18,
                logoURI: item.token.icon_url || undefined,
                calldata: item.token.exchange_rate ? {
                    price: parseFloat(item.token.exchange_rate),
                    marketdata_updated: String(Date.now()),
                } : undefined,
            };
        }

        return { results, contracts };
    }

    /**
     * Token holders - /v1/token/{addr}/holders → /api/v2/tokens/{addr}/holders
     */
    async getTokenHolders(
        contractAddress: string,
        params?: { limit?: number; account?: string; token_id?: string },
    ): Promise<LegacyTokenHoldersResponse> {
        // Only pass supported params to Blockscout v2
        const response = await this.indexer.get(`/api/v2/tokens/${contractAddress}/holders`);

        const items = response.data.items as BlockscoutTokenHolder[];

        // If filtering by account, filter the results
        let filteredItems = items;
        if (params?.account) {
            filteredItems = items.filter(
                item => item.address.hash.toLowerCase() === params.account?.toLowerCase(),
            );
        }

        const results: LegacyTokenHolder[] = filteredItems.map(item => ({
            address: item.address.hash,
            balance: item.value,
            tokenId: item.token_id || undefined,
        }));

        return { results };
    }

    /**
     * Contract info - /v1/contract/{addr} → /api/v2/smart-contracts/{addr}
     */
    async getContract(address: string, params?: { full?: boolean; includeAbi?: boolean }): Promise<LegacyContractResponse> {
        try {
            const response = await this.indexer.get(`/api/v2/smart-contracts/${address}`);
            const contract = response.data as BlockscoutSmartContract;

            return {
                address: contract.address_hash,
                name: contract.name,
                abi: params?.includeAbi ? contract.abi : null,
                verified: contract.is_verified,
                supportedInterfaces: [], // Blockscout doesn't provide this directly
            };
        } catch (error) {
            // Contract might not be verified or might not exist
            return {
                address,
                name: null,
                abi: null,
                verified: false,
            };
        }
    }

    /**
     * Account NFTs - /v1/account/{addr}/nfts → /api/v2/addresses/{addr}/nft
     */
    async getAccountNfts(account: string, params?: { type?: string; limit?: number; offset?: number }) {
        const nftType = params?.type === 'ERC721' ? 'ERC-721' : params?.type === 'ERC1155' ? 'ERC-1155' : undefined;

        // Blockscout v2 only accepts 'type' param, not limit/offset
        const response = await this.indexer.get(`/api/v2/addresses/${account}/nft`, {
            params: { type: nftType },
        });

        return this.transformNftResponse(response.data.items || []);
    }

    /**
     * Collection NFTs - /v1/contract/{addr}/nfts → /api/v2/tokens/{addr}/instances
     */
    async getCollectionNfts(contractAddress: string, params?: { limit?: number; offset?: number }) {
        // Blockscout v2 doesn't accept limit/offset on this endpoint
        const response = await this.indexer.get(`/api/v2/tokens/${contractAddress}/instances`);

        return this.transformNftResponse(response.data.items || [], contractAddress);
    }

    /**
     * Transform Blockscout NFT response to legacy format
     */
    private transformNftResponse(items: BlockscoutNFTInstance[], contractOverride?: string) {
        const results = items.map(item => ({
            tokenId: item.id,
            contract: contractOverride || item.token?.address_hash || '',
            metadata: JSON.stringify(item.metadata || {}),
            imageCache: item.image_url || '',
            tokenUri: '',
            owner: item.owner?.hash || '',
            updated: Date.now(),
            supply: '1', // Default for ERC721, ERC1155 would need separate handling
            tokenIdSupply: '1', // Alias for getNftsForAccount path
        }));

        // Build contracts map
        const contracts: Record<string, LegacyContractResponse> = {};
        for (const item of items) {
            if (item.token && !contracts[item.token.address_hash]) {
                contracts[item.token.address_hash] = {
                    address: item.token.address_hash,
                    name: item.token.name,
                    abi: null,
                    verified: false,
                    calldata: JSON.stringify({ name: item.token.name, symbol: item.token.symbol }),
                    supportedInterfaces: [item.token.type?.toLowerCase().replace('-', '') || 'erc721'],
                };
            }
        }

        return { results, contracts };
    }

    /**
     * Transactions - /v1/address/{addr}/transactions → /api/v2/addresses/{addr}/transactions
     */
    async getTransactions(address: string, params?: { limit?: number; offset?: number }) {
        // Blockscout v2 doesn't accept 'limit' — remove unsupported params
        const response = await this.indexer.get(`/api/v2/addresses/${address}/transactions`);

        const items = response.data.items || [];

        // Transform Blockscout format to legacy EvmTransaction format
        const results = items.map((tx: BlockscoutTransaction) => ({
            blockNumber: tx.block_number || 0,
            contractAddress: tx.created_contract?.hash || '',
            cumulativeGasUsed: '0x0',
            from: tx.from?.hash || '',
            gasLimit: '0x' + (parseInt(tx.gas_limit || '0')).toString(16),
            gasPrice: '0x' + (parseInt(tx.gas_price || '0')).toString(16),
            gasused: '0x' + (parseInt(tx.gas_used || '0')).toString(16),
            hash: tx.hash || '',
            index: tx.position || 0,
            input: tx.raw_input || tx.decoded_input?.method_call || '0x',
            nonce: tx.nonce || 0,
            output: '',
            logs: '',
            r: '',
            s: '',
            status: tx.status === 'ok' ? '0x1' : '0x0',
            timestamp: tx.timestamp ? new Date(tx.timestamp).getTime() : 0,
            to: tx.to?.hash || '',
            v: '',
            value: '0x' + (BigInt(tx.value || '0')).toString(16),
        }));

        return {
            results,
            contracts: {},
            total_count: items.length,
            more: !!response.data.next_page_params,
        };
    }

    /**
     * Token transfers - /v1/account/{addr}/transfers → /api/v2/addresses/{addr}/token-transfers
     */
    async getTokenTransfers(account: string, params?: { type?: string; limit?: number; offset?: number }) {
        // Blockscout v2 uses 'type' param with values like 'ERC-20', 'ERC-721', 'ERC-1155'
        const queryParams: Record<string, string> = {};
        if (params?.type) {
            queryParams.type = params.type.replace('erc', 'ERC-').replace('ERC', 'ERC-').replace('ERC--', 'ERC-');
        }

        const response = await this.indexer.get(`/api/v2/addresses/${account}/token-transfers`, {
            params: queryParams,
        });

        const items = response.data.items || [];
        const contracts: Record<string, unknown> = {};

        const results = items.map((transfer: {
            token: BlockscoutToken;
            total: { value?: string; decimals?: string; token_id?: string; token_instance?: unknown } | null;
            from: { hash: string };
            to: { hash: string };
            tx_hash?: string;
            transaction_hash?: string;
            block_number: number;
            timestamp: string;
            type: string;
            token_ids?: string[];
        }) => {
            const tokenAddr = transfer.token?.address_hash || '';
            if (transfer.token && !contracts[tokenAddr]) {
                contracts[tokenAddr] = {
                    address: tokenAddr,
                    name: transfer.token.name,
                    symbol: transfer.token.symbol,
                    decimals: parseInt(transfer.token.decimals || '18'),
                    calldata: JSON.stringify({ name: transfer.token.name, symbol: transfer.token.symbol }),
                    supportedInterfaces: [transfer.token.type?.toLowerCase().replace('-', '') || 'erc20'],
                };
            }

            const tokenType = (transfer.token?.type || 'ERC-20').toLowerCase().replace('-', '') as 'erc20' | 'erc721' | 'erc1155';

            return {
                amount: transfer.total?.value || '0',
                contract: tokenAddr,
                blockNumber: transfer.block_number || 0,
                from: transfer.from?.hash || '',
                to: transfer.to?.hash || '',
                type: tokenType,
                transaction: transfer.transaction_hash || transfer.tx_hash || '',
                timestamp: transfer.timestamp ? new Date(transfer.timestamp).getTime() : 0,
                id: transfer.total?.token_id || transfer.token_ids?.[0] || undefined,
            };
        });

        return {
            results,
            contracts,
        };
    }

    /**
     * Approvals - No direct Blockscout equivalent
     *
     * LIMITATION: Blockscout doesn't track token approvals like the old Teloscan API did.
     * Users won't see their existing approvals in the UI, but can still:
     * - Manually revoke approvals if they know the spender address
     * - New approvals they make will work normally
     *
     * TODO: Implement proper solution via one of:
     * 1. Query /api/v2/addresses/{addr}/logs for Approval events
     *    (topic0 = 0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925)
     * 2. On-chain allowance() queries for known spenders (DEXes, bridges)
     * 3. Run a separate microservice that indexes Approval events
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async getApprovals(account: string, params?: { type?: string }) {
        // Log once per session to avoid spam
        if (!this._approvalsWarningShown) {
            console.warn(
                '[BlockscoutAdapter] Token approvals viewing is currently unavailable. ' +
                'Blockscout does not provide an approvals endpoint. ' +
                'Users can still revoke approvals manually.',
            );
            this._approvalsWarningShown = true;
        }

        return {
            results: [],
            contracts: {},
        };
    }

    private _approvalsWarningShown = false;
}

export default BlockscoutAdapter;
