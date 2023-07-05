// EVMAuthenticator class

import { SendTransactionResult } from '@wagmi/core';
import { BigNumber, ethers } from 'ethers';
import { useChainStore } from 'src/antelope/stores/chain';
import { useEVMStore } from 'src/antelope/stores/evm';
import { createTraceFunction, isTracingAll, useFeedbackStore } from 'src/antelope/stores/feedback';
import { AntelopeError, EvmTransactionResponse, ExceptionError, TokenClass, addressString } from 'src/antelope/types';

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
    // abstract login(network: string): Promise<addressString | null>;
    abstract logout(): Promise<void>;
    abstract getSystemTokenBalance(label:string, address: addressString | string): Promise<BigNumber>;
    abstract getERC20TokenBalance(label:string, address: addressString | string, tokenAddress: addressString | string): Promise<BigNumber>;
    abstract transferTokens(label:string, token: TokenClass, amount: BigNumber, to: addressString | string): Promise<EvmTransactionResponse | SendTransactionResult>;
    abstract prepareTokenForTransfer(label: string, token: TokenClass | null, amount: BigNumber, to: string): Promise<void>;
    abstract isConnectedTo(chainId: string): Promise<boolean>;
    abstract externalProvider(): Promise<ethers.providers.ExternalProvider>;
    abstract web3Provider(): Promise<ethers.providers.Web3Provider>;

    // to easely clone the authenticator
    abstract newInstance(label: string): EVMAuthenticator;

    // la función login debería ser posible reimplementar por subclases de esta clase abtracta
    async login(network: string): Promise<addressString | null> {
        this.trace('login', network);
        const chain = useChainStore();
        const feedback = useFeedbackStore();
        try {
            feedback.setLoading('Authenticator.login');
            chain.setLoggedChain(network);
            chain.setCurrentChain(network);

            const checkProvider = await this.ensureCorrectChain() as ethers.providers.Web3Provider;

            const accounts = await checkProvider.listAccounts();
            if (accounts.length > 0) {
                return accounts[0] as addressString;
            } else {
                if (!checkProvider.provider.request) {
                    // TODO: fixme. change variable name
                    throw new AntelopeError('antelope.evm.error_support_provider_request');
                }
                const accessGranted = await checkProvider.provider.request({ method: 'eth_requestAccounts' });
                if (accessGranted.length < 1) {
                    return null;
                }
                return accessGranted[0] as addressString;
            }
        } catch (error) {
            if ((error as unknown as ExceptionError).code === 4001) {
                // TODO: fixme. change variable name
                throw new AntelopeError('antelope.evm.error_connect_rejected');
            } else {
                console.error('Error:', error);
                // TODO: fixme. change variable name
                throw new AntelopeError('antelope.evm.error_login');
            }
        } finally {
            feedback.unsetLoading('Authenticator.login');
        }
    }

    async ensureCorrectChain(): Promise<ethers.providers.Web3Provider> {
        this.trace('ensureCorrectChain');
        let web3Provider = await this.web3Provider();
        web3Provider = await useEVMStore().ensureCorrectChain(this);
        return web3Provider;
    }

}
