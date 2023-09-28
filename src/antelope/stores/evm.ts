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

import { ethers } from 'ethers';
import { defineStore } from 'pinia';
import { RpcEndpoint } from 'universal-authenticator-library';
import { BehaviorSubject, filter } from 'rxjs';
import { createInitFunction, createTraceFunction } from 'src/antelope/stores/feedback';

import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { events_signatures, functions_overrides } from 'src/antelope/stores/utils';
import {
    AntelopeError,
    ExceptionError,
    supportsInterfaceAbi,
    ERC721_TYPE,
    NFTClass,
    EthereumProvider,
} from 'src/antelope/types';
import { toRaw } from 'vue';
import {
    getAntelope,
    useAccountStore,
    useChainStore,
    useFeedbackStore,
} from 'src/antelope';
import { EVMAuthenticator, InjectedProviderAuth } from 'src/antelope/wallets';

const onEvmReady = new BehaviorSubject<boolean>(false);

export const evmEvents = {
    whenReady: onEvmReady.asObservable().pipe(
        filter(ready => ready),
    ),
};

export interface EVMState {
    __injected_providers: Record<string, InjectedProviderAuth>;
}

const store_name = 'evm';



export const useEVMStore = defineStore(store_name, {
    state: (): EVMState => (evmInitialState),
    getters: {
        functionInterfaces: () => functions_overrides,
        eventInterfaces: () => events_signatures,
        injectedProviderNames: store => Object.keys(toRaw(store.__injected_providers)),
        injectedProvider: store => (name: string) => toRaw(store.__injected_providers[name]),
    },
    actions: {
        trace: createTraceFunction(store_name),
        init: createInitFunction(store_name),

        // actions ---
        async initInjectedProvider(authenticator: InjectedProviderAuth): Promise<void> {
            this.trace('initInjectedProvider', authenticator.getName(), [authenticator.getProvider()]);
            const provider: EthereumProvider | null = authenticator.getProvider();
            const evm = useEVMStore();
            const ant = getAntelope();

            if (provider && !provider.__initialized) {
                this.trace('initInjectedProvider', authenticator.getName(), 'initializing provider');
                // ensure this provider actually has the correct methods
                // Check consistency of the provider
                const methods = ['request', 'on'];
                const candidate = provider as unknown as Record<string, unknown>;
                for (const method of methods) {
                    if (typeof candidate[method] !== 'function') {
                        console.warn(`MetamaskAuth.getProvider: method ${method} not found`);
                        throw new AntelopeError('antelope.evm.error_invalid_provider');
                    }
                }

                // this handler activates only when the user comes back from switching to the wrong network on the wallet
                // It checks if the user is on the correct network and if not, it shows a notification with a button to switch
                const checkNetworkHandler = async () => {
                    window.removeEventListener('focus', checkNetworkHandler);
                    if (useAccountStore().loggedAccount) {
                        const authenticator = useAccountStore().loggedAccount.authenticator as EVMAuthenticator;
                        if (await authenticator.isConnectedToCorrectChain()) {
                            evm.trace('checkNetworkHandler', 'correct network');
                        } else {
                            const networkName = useChainStore().loggedChain.settings.getDisplay();
                            const errorMessage = ant.config.localizationHandler('evm_wallet.incorrect_network', { networkName });
                            ant.config.notifyFailureWithAction(errorMessage, {
                                label: ant.config.localizationHandler('evm_wallet.switch'),
                                handler: () => {
                                    authenticator.ensureCorrectChain();
                                },
                            });
                        }
                    }
                };

                provider.on('chainChanged', (value) => {
                    const newNetwork = value as string;
                    evm.trace('provider.chainChanged', newNetwork);
                    window.removeEventListener('focus', checkNetworkHandler);
                    if (useAccountStore().loggedAccount) {
                        window.addEventListener('focus', checkNetworkHandler);
                    }
                });

                provider.on('accountsChanged', async (value) => {
                    const accounts = value as string[];
                    const network = useChainStore().currentChain.settings.getNetwork();
                    evm.trace('provider.accountsChanged', ...accounts);

                    if (accounts.length > 0) {
                        // If we are here one of two possible things had happened:
                        // 1. The user has just logged in to the wallet
                        // 2. The user has switched the account in the wallet

                        // if we are in case 1, then we are in the middle of the login process and we don't need to do anything
                        // We can tell because the account store has no logged account

                        // But if we are in case 2 and have a logged account, we need to re-login the account using the same authenticator
                        // overwriting the previous logged account, which in turn will trigger all account data to be reloaded
                        if (useAccountStore().loggedAccount) {
                            // if the user is already authenticated we try to re login the account using the same authenticator
                            const authenticator = useAccountStore().loggedAccount.authenticator as EVMAuthenticator;
                            if (!authenticator) {
                                console.error('Inconsistency: logged account authenticator is null', authenticator);
                            } else {
                                useAccountStore().loginEVM({ authenticator,  network });
                            }
                        }
                    } else {
                        // the user has disconnected the all the accounts from the wallet so we logout
                        useAccountStore().logout();
                    }
                });

                // This initialized property is not part of the standard provider, it's just a flag to know if we already initialized the provider
                provider.__initialized = true;
                evm.addInjectedProvider(authenticator);
            }
            authenticator.onReady.next(true);
        },

        async isProviderOnTheCorrectChain(provider: ethers.providers.Web3Provider, correctChainId: string): Promise<boolean> {
            const { chainId } = await provider.getNetwork();
            const response = Number(chainId).toString() === correctChainId;
            this.trace('isProviderOnTheCorrectChain', provider, ' -> ', response);
            return response;
        },

        async ensureCorrectChain(authenticator: EVMAuthenticator): Promise<ethers.providers.Web3Provider> {
            this.trace('ensureCorrectChain', authenticator);
            const checkProvider = await authenticator.web3Provider();
            let response = checkProvider;
            const correctChainId = useChainStore().currentChain.settings.getChainId();
            if (!await this.isProviderOnTheCorrectChain(checkProvider, correctChainId)) {
                const provider = await authenticator.externalProvider();
                await this.switchChainInjected(provider);
                response = new ethers.providers.Web3Provider(provider);
            }
            return response;
        },

        async switchChainInjected(InjectedProvider: ethers.providers.ExternalProvider): Promise<boolean> {
            this.trace('switchChainInjected', [InjectedProvider]);
            useFeedbackStore().setLoading('evm.switchChainInjected');
            const provider = InjectedProvider;
            if (provider) {
                const chainSettings = useChainStore().loggedChain.settings as unknown as EVMChainSettings;
                const chainId = parseInt(chainSettings.getChainId(), 10);
                const chainIdParam = `0x${chainId.toString(16)}`;
                if (!provider.request) {
                    useFeedbackStore().unsetLoading('evm.switchChainInjected');
                    throw new AntelopeError('antelope.evm.error_support_provider_request');
                }
                try {
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
                                throw new AntelopeError('antelope.evm.error_support_provider_request');
                            }
                            const payload = {
                                method: 'wallet_addEthereumChain',
                                params: [{
                                    chainId: chainIdParam,
                                    chainName: chainSettings.getDisplay(),
                                    nativeCurrency: {
                                        name: chainSettings.getSystemToken().name,
                                        symbol: chainSettings.getSystemToken().symbol,
                                        decimals: chainSettings.getSystemToken().decimals,
                                    },
                                    rpcUrls: [rpcUrl],
                                    blockExplorerUrls: [chainSettings.getExplorerUrl()],
                                    iconUrls: [chainSettings.getSmallLogoPath(), chainSettings.getLargeLogoPath()],
                                }],
                            };
                            await provider.request(payload);
                            return true;
                        } catch (e) {
                            if ((e as unknown as ExceptionError).code === 4001) {
                                throw new AntelopeError('antelope.evm.error_add_chain_rejected');
                            } else {
                                console.error('Error:', e);
                                throw new AntelopeError('antelope.evm.error_add_chain');
                            }
                        }
                    } else if ((error as unknown as ExceptionError).code === 4001) {
                        throw new AntelopeError('antelope.evm.error_switch_chain_rejected');
                    } else {
                        console.error('Error:', error);
                        throw new AntelopeError('antelope.evm.error_switch_chain');
                    }
                } finally {
                    useFeedbackStore().unsetLoading('evm.switchChainInjected');
                }
            } else {
                useFeedbackStore().unsetLoading('evm.switchChainInjected');
                throw new AntelopeError('antelope.evm.error_no_provider');
            }
        },
        // Evm Contract Managment
        async getFunctionIface(hash:string): Promise<ethers.utils.Interface | null> {
            const prefix = hash.toLowerCase().slice(0, 10);
            if (Object.prototype.hasOwnProperty.call(this.functionInterfaces, prefix)) {
                return new ethers.utils.Interface([this.functionInterfaces[prefix]]);
            }
            try {
                const chain_settings = useChainStore().currentChain.settings as EVMChainSettings;
                const abiResponse = await chain_settings.getAbiSignature({ type:'function', hex:prefix });
                if (abiResponse.text_signature) {
                    this.functionInterfaces[prefix] = `function ${abiResponse.text_signature}`;
                    return new ethers.utils.Interface([this.functionInterfaces[prefix]]);
                } else {
                    return null;
                }
            } catch (e) {
                throw new AntelopeError('antelope.evm.error_getting_function_interface', { prefix });
            }
        },
        // Evm Contract Managment
        async getEventIface(hex:string): Promise<ethers.utils.Interface | null> {
            const prefix = hex.toLowerCase().slice(0, 10);
            if (Object.prototype.hasOwnProperty.call(this.eventInterfaces, prefix)) {
                return new ethers.utils.Interface([this.eventInterfaces[prefix]]);
            }
            try {
                const chain_settings = useChainStore().currentChain.settings as EVMChainSettings;
                const abiResponse = await chain_settings.getAbiSignature({ type:'event', hex });
                if (abiResponse.text_signature) {
                    this.eventInterfaces[hex] = `event ${abiResponse.text_signature}`;
                    return new ethers.utils.Interface([this.eventInterfaces[hex]]);
                } else {
                    return null;
                }
            } catch (e) {
                throw new AntelopeError('antelope.evm.error_getting_event_interface', { hex });
            }
        },

        async supportsInterface(authenticator: InjectedProviderAuth, address:string, iface:string): Promise<boolean> {
            const provider = await authenticator.web3Provider();
            if (!provider) {
                throw new AntelopeError('antelope.evm.error_no_provider');
            }
            const contract = new ethers.Contract(address, supportsInterfaceAbi, provider);
            try {
                return await contract.supportsInterface(iface);
            } catch (e) {
                // Contract does not support interface, not necessarly an error
                return false;
            }
        },

        async isTokenType(authenticator: InjectedProviderAuth, address:string, type:string): Promise<string> {
            if(typeof type === 'undefined'){
                return '';
            } else if(type === 'erc721'){
                if(!await this.supportsInterface(authenticator, address, '0x80ac58cd')){
                    return '';
                }
            } else if(type === 'erc1155') {
                if(!await this.supportsInterface(authenticator, address, '0xd9b67a26')){
                    return '';
                }
            }
            return address;
        },

        async getNFT(address:string, tokenId: string, suspectedType:string): Promise<NFTClass | null> {
            this.trace('getNFT', address, suspectedType, tokenId);
            if (suspectedType.toUpperCase() === ERC721_TYPE) {
                // TODO: here we try to get NFT data from the chain directly as a fallback for indexer, see https://github.com/telosnetwork/telos-wallet/issues/446
            }
            return null;
        },

        // Commits --------------------
        addInjectedProvider(authenticator: InjectedProviderAuth): void {
            this.trace('addInjectedProvider', authenticator);
            this.__injected_providers[authenticator.label] = authenticator;
        },
    },
});

const evmInitialState: EVMState = {
    __injected_providers: {},
};
