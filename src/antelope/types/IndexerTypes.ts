
export interface IndexerTokenInfo {
    symbol: string;
    creator: string;
    address: string;
    fromTrace: boolean;
    trace_address: string;
    logoURI: string;
    supply: string;
    calldata: IndexerTokenMarketData;
    decimals: number;
    name: string;
    block: number;
    supportedInterfaces: string[];
    transaction: string;
}

export interface IndexerTokenMarketData {
    name?: string;
    price?: number;
    supply?: string;
    symbol?: string;
    volume?: string;
    holders?: string;
    decimals?: number;
    marketcap?: string;
    max_supply_ibc?: string;
    total_supply_ibc?: string;
    marketdata_updated?: string;
}

export interface IndexerTokenBalance {
    address: string;
    balance: string;
    contract: string;
    updated: number;
}


export interface IndexerAccountBalances {
    success: boolean;
    contracts: {
        [address: string]: IndexerTokenInfo;
    };
    results: IndexerTokenBalance[];
}

export interface IndexerHealthResponse {
    success: boolean;
    blockNumber: number;
    blockTimestamp: string;
    secondsBehind: number;
}
