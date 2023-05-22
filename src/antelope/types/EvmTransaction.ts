import { ethers } from 'ethers';
import EvmContract from 'src/antelope/stores/utils/EvmContract';

export interface TransactionBasicData {
    contract: string;
    from: string;
    to: string;
    value: string;
    data: string;
}

export interface EvmTransaction {
    block: number;
    block_hash: string;
    charged_gas_price: number;
    createdaddr: string;
    epoch: number;
    from: string;
    gas_limit: number;
    gas_price: number;
    gasused: number;
    gasusedblock: number;
    hash: string;
    input_data: string;
    itxs: unknown;
    logs: unknown;
    logsBloom: string;
    nonce: number;
    output: string;
    r: string;
    s: string;
    status: number;
    to: string;
    trx_index: number;
    v: string;
    value: string;
    parsed: boolean;
    isParsed?: boolean;
    isTransfer?: boolean;
}

export interface ParsedEvmTransaction extends EvmTransaction {
    contract: EvmContract;
    description: ethers.utils.TransactionDescription;
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
