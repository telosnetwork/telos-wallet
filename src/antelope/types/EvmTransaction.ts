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

export interface NftTransactionData {
    quantity: number;
    tokenId: string;
    tokenName: string;
    collectionAddress: string;
    collectionName?: string;
    imgSrc?: string;
    videoSrc?: string;
    type: 'image' | 'video' | 'audio' | 'unknown';
}

export const EvmSwapFunctionNames = [
    'swapExactTokensForTokens',
    'swapTokensForExactTokens',
    'swapExactETHForTokens',
    'swapTokensForExactETH',
    'swapExactTokensForETH',
    'swapETHForExactTokens',
    'swapETHToTokens',
];

export interface ShapedTransactionRow {
    id: string; // transaction ID
    epoch: number; // epoch in milliseconds
    // action should be 'send', 'receive', 'swap', 'contractCreation', or some other action like 'approve'
    // a swap is any function in EvmSwapFunctionNames
    actionName: string;
    from: string; // address
    fromPrettyName?: string;
    to: string; // address
    toPrettyName?: string;
    gasUsed?: number; // gas used in TLOS
    gasFiatValue?: number; // gas used in Fiat
    failed?: boolean;
}

export interface ShapedErc20TransactionRow extends ShapedTransactionRow {
    valuesIn: TransactionValueData[];
    valuesOut: TransactionValueData[];
}

export interface ShapedNftTransactionRow extends ShapedTransactionRow {
    nftsIn: NftTransactionData[];
    nftsOut: NftTransactionData[];
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

export type EvmTransactionResponse = ethers.providers.TransactionResponse;
export interface TransactionResponse {
    hash: string;
    wait: () => Promise<ethers.providers.TransactionReceipt>;
}
export interface NativeTransactionResponse extends TransactionResponse {
    __?: string;
}

export interface IndexerAccountTransfersResponse {
    contracts: {
        [contractHash: string]: IndexerAccountTransactionsContractData
    };
    results: EvmTransfer[]
    total_count?: number; // included if includePagination is true in the request
    more?: boolean; // included if includePagination is true in the request
}

export interface EvmTransfer {
    amount: string, // a string representing an integer
    contract: string, // contract address of the token being transferred
    blockNumber: number, // an integer representing the block number of the transfer
    from: string, // address of the sender
    to: string; // address of the receiver
    type: 'erc20' | 'erc721' | 'erc1155', // type of token being transferred
    transaction: string; // transaction hash
    timestamp: number; // integer representing ms from epoch
}
