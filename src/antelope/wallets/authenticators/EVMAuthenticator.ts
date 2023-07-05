// EVMAuthenticator class

import { SendTransactionResult } from '@wagmi/core';
import { BigNumber, ethers } from 'ethers';
import { createTraceFunction, isTracingAll, useFeedbackStore } from 'src/antelope/stores/feedback';
import { EvmTransactionResponse, TokenClass, addressString } from 'src/antelope/types';

export abstract class EVMAuthenticator {
    readonly label: string;
    readonly trace: (message: string, ...args: unknown[]) => void;

    constructor(label: string) {
        this.label = label;
        const name = `${this.getName()}(${label})`;
        this.trace = createTraceFunction(name);
        useFeedbackStore().setDebug(name, isTracingAll());
    }
    abstract getName(): string;
    abstract login(network: string): Promise<addressString | null>;
    abstract logout(): Promise<void>;
    abstract getSystemTokenBalance(label:string, address: addressString | string): Promise<BigNumber>;
    abstract getERC20TokenBalance(label:string, address: addressString | string, tokenAddress: addressString | string): Promise<BigNumber>;
    abstract transferTokens(label:string, token: TokenClass, amount: BigNumber, to: addressString | string): Promise<EvmTransactionResponse | SendTransactionResult>;
    abstract prepareTokenForTransfer(label: string, token: TokenClass | null, amount: BigNumber, to: string): Promise<void>;
    abstract isConnectedTo(chainId: string): Promise<boolean>;
    abstract web3Provider(): Promise<ethers.providers.Web3Provider>;

    // to easely clone the authenticator
    abstract newInstance(label: string): EVMAuthenticator;

}
