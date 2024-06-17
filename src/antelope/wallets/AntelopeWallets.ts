import { EVMAuthenticator } from 'src/antelope/wallets/authenticators/EVMAuthenticator';
import { CURRENT_CONTEXT, useChainStore } from 'src/antelope';
import { RpcEndpoint } from 'universal-authenticator-library';
import { ethers } from 'ethers';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { AntelopeError } from 'src/antelope/types';
import { AntelopeDebugTraceType, createTraceFunction } from 'src/antelope/config';

const name = 'AntelopeWallets';

export class AntelopeWallets {

    private trace: AntelopeDebugTraceType;
    private authenticators: Map<string, EVMAuthenticator> = new Map();
    private web3Provider: ethers.providers.Web3Provider | null = null;
    private web3ProviderInitializationPromise: Promise<ethers.providers.Web3Provider> | null = null;

    constructor() {
        this.trace = createTraceFunction(name);
    }

    init() {
        this.trace('init');


    }

    addEVMAuthenticator(authenticator: EVMAuthenticator) {
        this.trace('addEVMAuthenticator', authenticator.getName(), authenticator);
        this.authenticators.set(authenticator.getName(), authenticator);
    }

    getAuthenticator(name: string) {
        this.trace('getAuthenticator', name);
        return this.authenticators.get(name);
    }

    getChainSettings(label: string) {
        return (useChainStore().getChain(label).settings as EVMChainSettings);
    }

    async getWeb3Provider(label = CURRENT_CONTEXT): Promise<ethers.providers.Web3Provider> {
        this.trace('getWeb3Provider');

        // If a provider instance already exists, return it immediately.
        if (this.web3Provider) {
            this.trace('getWeb3Provider', 'Returning existing provider instance');
            return this.web3Provider;
        }

        // If an initialization is already underway, wait for it to complete.
        if (this.web3ProviderInitializationPromise) {
            this.trace('getWeb3Provider', 'Waiting for existing initialization to complete');
            return this.web3ProviderInitializationPromise;
        }

        // Start the initialization.
        this.web3ProviderInitializationPromise = (async () => {
            try {
                const p: RpcEndpoint = this.getChainSettings(label).getRPCEndpoint();
                const url = `${p.protocol}://${p.host}:${p.port}${p.path ?? ''}`;
                const jsonRpcProvider = new ethers.providers.JsonRpcProvider(url);
                await jsonRpcProvider.ready;
                this.web3Provider = jsonRpcProvider as ethers.providers.Web3Provider;
                this.trace('getWeb3Provider', 'Initialized provider instance', url, this.web3Provider);
                return this.web3Provider;
            } catch (e) {
                this.trace('getWeb3Provider authenticator.web3Provider() Failed!', e);
                this.web3ProviderInitializationPromise = null; // Reset to allow retries.
                throw new AntelopeError('antelope.evn.error_no_provider');
            }
        })();

        return this.web3ProviderInitializationPromise;
    }

    resetWeb3Provider() {
        this.trace('resetWeb3Provider');
        this.web3Provider = null;
        this.web3ProviderInitializationPromise = null;
    }

}
