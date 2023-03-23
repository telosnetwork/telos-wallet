/**
 * EVM: This store is responsible for interacting with EVM providers, including MetaMask
 * and other similar tools.
 *
 * The EVM store provides a set of methods for connecting to and interacting with
 * Ethereum Virtual Machine (EVM) networks. It communicates with the Chain store to
 * obtain data about the current network, specifying the network to which it will connect
 * using the EVM provider.
 *
 */

import detectEthereumProvider from '@metamask/detect-provider';
import { ExternalProvider } from '@ethersproject/providers';
import { ethers } from 'ethers';
import { defineStore } from 'pinia';
import {
    createTraceFunction,
    isTracingAll,
    useFeedbackStore,
} from 'src/antelope/stores/feedback';
import { errorToString } from 'src/antelope/config';
import { useChainStore } from 'src/antelope/stores/chain';
import EVMChain from 'src/antelope/chains//EVMChain';
import { RpcEndpoint } from 'universal-authenticator-library';
import { ExceptionError } from 'src/antelope/types/ExceptionError';

export interface EVMState {
    __provider: ExternalProvider | null;
    __supports_meta_mask: boolean;
}

const store_name = 'evm';

export const useEVMStore = defineStore(store_name, {
    state: (): EVMState => (evmInitialState),
    getters: {
        getProvider: state => state.__provider,
        isMetamaskSupported: state => state.__supports_meta_mask,
    },
    actions: {
        trace: createTraceFunction(store_name),
        init: () => {
            useFeedbackStore().setDebug(store_name, isTracingAll());
            const evm = useEVMStore();

            // detect provider
            detectEthereumProvider({ mustBeMetaMask: true }).then((provider) => {
                evm.setSupportsMetaMask(provider?.isMetaMask ?? false);
                if (provider) {
                    evm.setProvider(provider);
                    provider.on('chainChanged', (newNetwork) => {
                        evm.trace('provider.chainChanged', newNetwork);
                    });
                    provider.on('accountsChanged', (accounts) => {
                        evm.trace('provider.accountsChanged', accounts);
                    });
                }
            });

        },
        async login (network: string): Promise<string | null> {
            this.trace('login', network);
            const chain = useChainStore();

            try {
                chain.setLoggedChain(network);
                const provider = this.__provider as ExternalProvider;

                let checkProvider = new ethers.providers.Web3Provider(provider);
                checkProvider = await this.ensureCorrectChain(checkProvider);

                console.log('Evm.login() checkProvider', [checkProvider]);
                const accounts = await checkProvider.listAccounts();
                console.log('Evm.login() accounts', [accounts]);
                if (accounts.length > 0) {
                    checkProvider = await this.ensureCorrectChain(checkProvider);
                    return accounts[0];
                } else {
                    if (!provider.request) {
                        throw new Error('antelope.evm.error_support_provider_request');
                    }
                    const accessGranted = await provider.request({ method: 'eth_requestAccounts' });
                    if (accessGranted.length < 1) {
                        return null;
                    }
                    checkProvider = await this.ensureCorrectChain(checkProvider);
                    return accessGranted[0];
                }
            } catch (error) {
                if ((error as unknown as ExceptionError).code === 4001) {
                    throw new Error('antelope.evm.connect_rejected');
                } else {
                    console.error('Error:', error);
                    throw new Error('antelope.evm.error_login');
                }
            }
        },
        async ensureCorrectChain(checkProvider: ethers.providers.Web3Provider): Promise<ethers.providers.Web3Provider> {
            this.trace('ensureCorrectChain', checkProvider);
            const { chainId } = await checkProvider.getNetwork();
            const loggedChain = useChainStore().loggedChain.settings as unknown as EVMChain;
            if (Number(chainId).toString() !== loggedChain.getChainId()) {
                await this.switchChainInjected();
                const provider = this.__provider as ExternalProvider;
                return new ethers.providers.Web3Provider(provider);
            } else {
                return checkProvider;
            }
        },
        async switchChainInjected(): Promise<boolean> {
            this.trace('switchChainInjected');
            const provider = this.__provider;

            if (provider) {
                const chainSettings = useChainStore().loggedChain.settings as unknown as EVMChain;
                const chainId = parseInt(chainSettings.getChainId(), 10);
                const chainIdParam = `0x${chainId.toString(16)}`;
                if (!provider.request) {
                    throw new Error('antelope.evm.error_support_provider_request');
                }
                try {
                    console.log('Evm.switchChainInjected() try switchEthereumChain', [chainIdParam]);
                    await provider.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: chainIdParam }],
                    });
                    return true;
                } catch (error) {
                    const chainNotAddedCodes = [
                        4902,
                        -32603, // https://github.com/MetaMask/metamask-mobile/issues/2944
                    ];

                    if (chainNotAddedCodes.includes((error as unknown as ExceptionError).code)) {  // 'Chain <hex chain id> hasn't been added'
                        const p:RpcEndpoint = chainSettings.getRPCEndpoint();
                        const rpcUrl = `${p.protocol}://${p.host}:${p.port}${p.path ?? ''}`;
                        try {
                            if (!provider.request) {
                                throw new Error('antelope.evm.error_support_provider_request');
                            }
                            const payload = {
                                method: 'wallet_addEthereumChain',
                                params: [{
                                    chainId: chainIdParam,
                                    chainName: chainSettings.getDisplay(),
                                    nativeCurrency: {
                                        name: chainSettings.getSystemToken().name,
                                        symbol: chainSettings.getSystemToken().symbol,
                                        decimals: chainSettings.getSystemToken().precision,
                                    },
                                    rpcUrls: [rpcUrl],
                                    blockExplorerUrls: [chainSettings.getExplorerUrl()],
                                    iconUrls: [chainSettings.getSmallLogoPath(), chainSettings.getLargeLogoPath()],
                                }],
                            };
                            console.log('Evm.switchChainInjected() payload', [payload]);
                            await provider.request(payload);
                            return true;
                        } catch (e) {
                            if ((e as unknown as ExceptionError).code === 4001) {
                                throw new Error('antelope.evm.add_chain_rejected');
                            } else {
                                console.error('Error:', e);
                                throw new Error('antelope.evm.error_add_chain');
                            }
                        }
                    } else if ((error as unknown as ExceptionError).code === 4001) {
                        throw new Error('antelope.evm.switch_chain_rejected');
                    } else {
                        console.error('Error:', error);
                        throw new Error('antelope.evm.error_switch_chain');
                    }
                }
            } else {
                throw new Error('antelope.evm.error_no_provider');
            }
        },
        // Commits ----
        setSupportsMetaMask(value: boolean) {
            this.trace('setSupportsMetaMask', value);
            try {
                this.__supports_meta_mask = value;
            } catch (error) {
                console.error('Error: ', errorToString(error));
            }
        },
        setProvider(value: ExternalProvider | null) {
            this.trace('setProvider', value);
            try {
                this.__provider = value;
            } catch (error) {
                console.error('Error: ', errorToString(error));
            }
        },
    },
});

const evmInitialState: EVMState = {
    __provider: null,
    __supports_meta_mask: false,
};
