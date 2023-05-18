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
    getSigner: () => ethers.Signer;
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








// eztodo rename

export interface EvmContractCreationInfo2 {
    block?: number | null;
    creator?: string | null;
    transaction?: string | null;
}
// eztodo rename

export interface EvmContractMetadata2 {
    compiler?: {
        version: string;
    };
    language?: string;
    output?: {
        abi: EvmABI;
        devdoc: {
            kind: string;
            methods: Record<string, { details: string }>;
            version: number;
        };
        userdoc: {
            kind: string;
            methods: Record<string, { details: string }>;
            version: number;
        }
    };
    settings?: {
        compilationTarget: Record<string, string>;
        evmVersion: string;
        libraries: Record<string, string>;
        metadata: {
            bytecodeHash: string;
            useLiteralContent: boolean;
        };
        optimizer: {
            enabled: boolean;
            runs: number;
        };
        remappings: Record<string, unknown>[]
    }
    sources?: Record<string, {
        content: string;
        keccak256: string;
        license: string;
    }>;
    version?: number;
}

export interface EvmContractCalldata {
    decimals?: number;
    holders?: string; // string representation of number
    marketdata_updated?: string; // epoch
    name?: string;
    price?: string; // string representation of number, USD price
    supply?: string; // string representation of number
    symbol?: string;
}

export interface EvmContractConstructorData {
    name: string;
    abi?: EvmABI;
    address: string;
    creationInfo: EvmContractCreationInfo2;
    verified: boolean;
    supportedInterfaces: string[];
    properties?: EvmContractCalldata;
}

export interface EvmContractFactoryData {
    address: string;
    abi?: string | EvmABI
    block?: number;
    calldata?: string;
    creator?: string;
    decimals?: number | null;
    fromTrace?: boolean;
    metadata?: string;
    name?: string;
    supportedInterfaces?: string[];
    symbol?: string;
    traceAddress?: string;
    transaction?: string;
}
