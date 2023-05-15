import { ethers } from 'ethers';
import EvmContract from 'src/antelope/stores/utils/EvmContract';

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
    r: string;
    s: string;
    status: string; // string representation of hex number
    timestamp: number;
    to: string;
    v: string;
    value: string; // string representation of number (not hex)
}

export interface ParsedEvmTransaction extends EvmTransaction {
    contract: EvmContract;
    description: ethers.utils.TransactionDescription;
    isTransfer?: boolean;
    isParsed?: boolean;
    transfer?: {
        value: string;
        symbol: string;
    };
}

// TODO: refactoring needed
export type EvmTransactionResponse = ethers.providers.TransactionResponse;
export interface TransactionResponse {
    hash: string;
}
export interface NativeTransactionResponse extends TransactionResponse {
    __?: string;
}
