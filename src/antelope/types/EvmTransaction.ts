import { ethers } from 'ethers';

export type EvmTransactionTopic = string[];

export interface EvmTransactionLog {
    address: string;
    blockHash: string;
    blockNumber: number;
    data: string;
    logIndex: number;
    removed: boolean;
    topics: EvmTransactionTopic[];
    transactionHash: string;
}

export interface EvmTransaction {
    blockNumber: number;
    contractAddress?: string;
    cumulativeGasUsed: string; // string representation of hex number
    from: string;
    gasLimit: string; // string representation of hex number
    gasPrice: string; // string representation of hex number
    gasused: string; // string representation of hex number
    hash: string;
    index: number;
    input: string;
    nonce: number;
    output: string;
    logs?: string;
    r: string;
    s: string;
    status: string; // string representation of hex number
    timestamp: number; // epoch in milliseconds
    to: string;
    v: string;
    value: string; // string representation of hex number
}

export interface TransactionValueData {
    amount: number;
    symbol: string;
    fiatValue?: number;
}

export interface ShapedTransactionRow {
    id: string;
    epoch: number;
    // action should be 'send', 'receive', 'swap', or some other action like 'approve'
    // a swap is either 'swapExactTokensForTokens' or 'swapExactETHForTokens'
    actionName: string;
    from: string; // address
    fromPrettyName?: string;
    to: string; // address
    toPrettyName?: string;
    valuesIn: TransactionValueData[];
    valuesOut: TransactionValueData[];
    gasUsed?: number; // gas used in TLOS
    gasFiatValue?: number; // gas used in Fiat
    failed?: boolean;
}

export interface IndexerAccountTransactionsContractData {
    symbol: string;
    creator: string;
    address: string;
    fromTrace: boolean;
    trace_address: string;
    logoURI: string;
    supply: string; // string representation of an integer
    calldata: string;
    decimals: number | null;
    name: string;
    block: number;
    supportedInterfaces: ('erc20'|'erc721'|'erc1155'|'none')[],
    transaction: string; // creation tx for contract
}

export interface ParsedIndexerAccountTransactionsContract extends IndexerAccountTransactionsContractData {
    price?: string; // string representation of number
    holders?: number;
    marketdata_updated?: string; // epoch
}

export interface EVMTransactionsPaginationData {
    total: number;
    more: boolean;
}

export interface IndexerAccountTransactionsResponse {
    contracts: {
        [contractHash: string]: IndexerAccountTransactionsContractData
    };
    results: EvmTransaction[]
    total_count: number;
    more: boolean;
}



// TODO: refactoring needed
export type EvmTransactionResponse = ethers.providers.TransactionResponse;
export interface TransactionResponse {
    hash: string;
}
export interface NativeTransactionResponse extends TransactionResponse {
    __?: string;
}
