import { isTracingAll } from 'src/antelope/stores/feedback';
import { useFeedbackStore } from 'src/antelope/stores/feedback';
import { createTraceFunction } from 'src/antelope/stores/feedback';
import { EVMAuthenticator } from 'src/antelope/wallets/authenticators/EVMAuthenticator';
import { useAccountStore } from 'src/antelope/stores/account';
import { CURRENT_CONTEXT, useChainStore } from 'src/antelope';
import { RpcEndpoint } from 'universal-authenticator-library';
import { ethers } from 'ethers';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { AntelopeError } from 'src/antelope/types';

const name = 'AntelopeWallets';

export class AntelopeWallets {

    private trace: (message: string, ...args: unknown[]) => void;
    private authenticators: Map<string, EVMAuthenticator> = new Map();
    constructor() {
        this.trace = createTraceFunction(name);
    }

    init() {
        useFeedbackStore().setDebug(name, isTracingAll());
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

    async getWeb3Provider(): Promise<ethers.providers.Web3Provider> {
        this.trace('getWeb3Provider');
        const account = useAccountStore().getAccount(CURRENT_CONTEXT);
        try {
            // we try first the best solution which is taking the provider from the current authenticator
            const authenticator = account.authenticator as EVMAuthenticator;
            const provider = authenticator.web3Provider();
            return provider;
        } catch(e1) {
            this.trace('getWeb3Provider authenticator.web3Provider() Failed!', e1);
        }

        // we try to build a web3 provider from a local injected provider it it exists
        try {
            if (window.ethereum) {
                const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
                await web3Provider.ready;
                return web3Provider;
            }
        } catch(e2) {
            this.trace('getWeb3Provider authenticator.web3Provider() Failed!', e2);
        }

        try {
            const p:RpcEndpoint = this.getChainSettings(CURRENT_CONTEXT).getRPCEndpoint();
            const url = `${p.protocol}://${p.host}:${p.port}${p.path ?? ''}`;
            const jsonRpcProvider = new ethers.providers.JsonRpcProvider(url);
            await jsonRpcProvider.ready;
            const web3Provider = jsonRpcProvider as ethers.providers.Web3Provider;
            return web3Provider;
        } catch (e3) {
            this.trace('getWeb3Provider authenticator.web3Provider() Failed!', e3);
            throw new AntelopeError('antelope.evn.error_no_provider');
        }
    }

}

export * from 'src/antelope/wallets/authenticators/EVMAuthenticator';
export * from 'src/antelope/wallets/authenticators/InjectedProviderAuth';
export * from 'src/antelope/wallets/authenticators/MetamaskAuth';
export * from 'src/antelope/wallets/authenticators/OreIdAuth';
export * from 'src/antelope/wallets/authenticators/WalletConnectAuth';
export * from 'src/antelope/wallets/authenticators/SafePalAuth';
