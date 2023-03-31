import { ethers } from 'ethers';
import {
    EvmToken,
    EvmABI,
} from '.';

export interface EvmContractData {
    address: string;
    name: string;
    manager: EvmContractManagerI;
    creationInfo: EvmContractCreationInfo;
    abi?: EvmABI;
    token?: EvmToken;
    verified?: boolean;
}

export interface EvmContractManagerI {
    getRpcProvider: () => ethers.providers.JsonRpcProvider;
    getFunctionIface: (hash:string) => Promise<ethers.utils.Interface | null>;
    getEventIface: (hash:string) => Promise<ethers.utils.Interface | null>;
}

export interface EvmContractCreationInfo {
    creation_trx: string;
    creator: string;
    timestamp: string; // is in fact a string number like "1679649071"
    block_num: number;
    abi: string;
}

export interface VerifiedContractMetadata {
    compiler: {
        version: string;
    },
    language: string,
    output: {
        abi: EvmABI;
    },
    settings: {
        compilationTarget: Record<string, string>;
        evmVersion: string;
        libraries: Record<string, unknown>;
        metadata: {
            bytecodeHash: string;
        },
        optimizer: {
            enabled: boolean;
            runs: number;
        },
        remappings: unknown[];
    },
    sources: Record<string, {
        keccak256: string;
        urls: string[];
    }>,
    version: number;
}
