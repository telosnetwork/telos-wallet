import { ethers } from 'ethers';
import { EvmToken } from '.';

export interface EvmLog {
    address: string;
    blockHash: string;
    blockNumber: number;
    data: string;
    logIndex: string;
    removed: boolean;
    topics: string[];
    transactionHash: string;
    transactionIndex: string;
}

export type EvmLogs = EvmLog[];

export interface EvmFormatedLog extends ethers.utils.LogDescription {
    inputs: ethers.utils.ParamType[];
    function_signature: string;
    isTransfer: boolean;
    logIndex: string,
    address: string,
    token: EvmToken | null,
    name: string,
}
