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
import { events_signatures, functions_overrides, toChecksumAddress } from 'src/antelope/stores/utils';
import EvmContract from 'src/antelope/stores/utils/contracts/EvmContract';
import {
    AntelopeError,
    erc1155Abi,
    ERC1155_TRANSFER_SIGNATURE,
    erc20Abi,
    erc721Abi,
    EvmABI,
    EvmContractManagerI,
    EvmLog,
    ExceptionError,
    supportsInterfaceAbi,
    EvmContractCreationInfo,
    EvmContractMetadata,
    TokenClass,
    ERC20_TYPE,
    ERC721_TYPE,
    ERC1155_TYPE,
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
import { EVMAuthenticator, ExternalProviderAuth } from 'src/antelope/wallets';
const onEvmReady = new BehaviorSubject<boolean>(false);

export const evmEvents = {
    whenReady: onEvmReady.asObservable().pipe(
        filter(ready => ready),
    ),
};

export interface EVMState {
    __:boolean;
}

const store_name = 'evm';

const createManager = (authenticator: ExternalProviderAuth):EvmContractManagerI => ({
    getSigner: () => toRaw(authenticator.getSigner()),
    getWeb3Provider: () => authenticator.web3Provider(),
    getFunctionIface: (hash:string) => toRaw(useEVMStore().getFunctionIface(hash)),
    getEventIface: (hash:string) => toRaw(useEVMStore().getEventIface(hash)),
});

export const useEVMStore = defineStore(store_name, {
    state: (): EVMState => (evmInitialState),
    getters: {
        functionInterfaces: () => functions_overrides,
        eventInterfaces: () => events_signatures,
    },
    actions: {
        trace: createTraceFunction(store_name),
        init: createInitFunction(store_name),

        // actions ---
        async initExternalProvider(authenticator: ExternalProviderAuth): Promise<void> {
            this.trace('initExternalProvider', authenticator.getName(), [authenticator.getProvider()]);
            const provider: EthereumProvider | null = authenticator.getProvider();
            const evm = useEVMStore();
            const ant = getAntelope();

            if (provider && !provider.__initialized) {
                this.trace('initExternalProvider', authenticator.getName(), 'initializing provider');
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
            this.trace('ensureCorrectChain', [authenticator]);
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

        async switchChainInjected(externalProvider: ethers.providers.ExternalProvider): Promise<boolean> {
            this.trace('switchChainInjected', [externalProvider]);
            useFeedbackStore().setLoading('evm.switchChainInjected');
            const provider = externalProvider;
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

        getTokenTypeFromLog(log:EvmLog): string {
            const sig = log.topics[0].substring(0, 10);
            const type = (log.topics.length === 4) ? ERC721_TYPE : ERC20_TYPE;
            return (sig === ERC1155_TRANSFER_SIGNATURE) ? ERC1155_TYPE: type;
        },

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

        async getContractCreation(authenticator: ExternalProviderAuth, address:string): Promise<EvmContractCreationInfo | null> {
            this.trace('getContractCreation', address);
            if (!address) {
                console.error('address is null', address);
                throw new AntelopeError('antelope.evm.error_invalid_address', { address });
            }
            try {
                const chain_settings = useChainStore().getChain(authenticator.label).settings as EVMChainSettings;
                return await chain_settings.getContractCreation(address);
            } catch (e) {
                console.error(new AntelopeError('antelope.evm.error_getting_contract_creation', { address }));
                return null;
            }
        },

        // suspectedToken is so we don't try to check for ERC20 info via eth_call unless we think this is a token...
        // this is coming from the token transfer, transactions table & transaction (general + logs tabs) pages where we're
        // looking for a contract based on a token transfer event
        // handles erc721 & erc20 (w/ stubs for erc1155)
        async getContract(authenticator: ExternalProviderAuth, address:string, suspectedToken = ''): Promise<EvmContract | null> {
            if (!address) {
                this.trace('getContract', 'address is null', address);
                return null;
            }
            const addressLower = address.toLowerCase();

            // Get from already queried contracts, add token data if needed & not present
            // (ie: queried beforehand w/o suspectedToken or a wrong suspectedToken)
            const chain_settings = useChainStore().getChain(authenticator.label).settings as EVMChainSettings;
            const cached = chain_settings.getContract(addressLower);
            // If cached is null, it means this is the first time this address is queried
            if (cached !== null) {
                if (
                    !suspectedToken ||
                    // cached === false means we already tried to get the contract creation info and it failed
                    !cached ||
                    cached.token && cached.token?.type === suspectedToken
                ) {
                    // this never return false
                    this.trace('getContract', 'returning cached', addressLower, cached);
                    return cached || null;
                }
            }


            // We mark this address as not existing so we don't query it again
            chain_settings.setContractAsNotExisting(addressLower);

            // Then we try to get the contract creation info. If it fails, we never overwrite the previous call to set contract as not existing
            const creationInfo = await this.getContractCreation(authenticator, addressLower);
            // The the contract passes the creation info check,
            // we overwrite the previous call to set contract as not existing with the actual EvmContract

            const metadata = await this.checkBucket(authenticator, address);
            if (metadata && creationInfo) {
                this.trace('getContract', 'returning verified contract', address, metadata, creationInfo);
                return await this.getVerifiedContract(authenticator, addressLower, metadata, creationInfo, suspectedToken);
            }

            const contract = await this.getContractFromTokenList(authenticator, address, suspectedToken, creationInfo);
            if (contract) {
                this.trace('getContract', 'returning contract from token list', address, contract);
                return contract;
            }

            this.trace('getContract', 'returning empty contract', address, creationInfo);
            return await this.getEmptyContract(authenticator, addressLower, creationInfo);
        },

        async checkBucket(authenticator: ExternalProviderAuth, address:string): Promise<EvmContractMetadata | null> {
            const checksumAddress = toChecksumAddress(address);
            try {
                const chain_settings = useChainStore().getChain(authenticator.label).settings as EVMChainSettings;
                const metadataStr = await chain_settings.getContractMetadata(checksumAddress);
                return JSON.parse(metadataStr);
            } catch (e) {
                return null;
            }
        },

        async getVerifiedContract(
            authenticator: ExternalProviderAuth,
            address:string,
            metadata: EvmContractMetadata,
            creationInfo: EvmContractCreationInfo,
            suspectedType:string,
        ): Promise<EvmContract> {
            const token = await this.getToken(authenticator, address, suspectedType) ?? undefined;
            const contract = new EvmContract({
                name: Object.values(metadata.settings?.compilationTarget ?? {})[0],
                address,
                abi: metadata.output?.abi,
                manager: createManager(authenticator),
                token: token,
                creationInfo,
                verified: true,
                supportedInterfaces: [token?.type ?? 'none'],
            });
            const chain_settings = useChainStore().currentChain.settings as EVMChainSettings;
            chain_settings.addContract(address, contract);
            return contract;
        },

        async getEmptyContract(
            authenticator: ExternalProviderAuth,
            address:string,
            creationInfo: EvmContractCreationInfo | null,
        ): Promise<EvmContract> {
            const contract = new EvmContract({
                name: `0x${address.slice(0, 16)}...`,
                address,
                creationInfo,
                manager: createManager(authenticator),
                supportedInterfaces: [],
            });
            const chain_settings = useChainStore().currentChain.settings as EVMChainSettings;
            chain_settings.addContract(address, contract);
            return contract;
        },

        async supportsInterface(authenticator: ExternalProviderAuth, address:string, iface:string): Promise<boolean> {
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

        async isTokenType(authenticator: ExternalProviderAuth, address:string, type:string): Promise<string> {
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

        getTokenABI(type:string): EvmABI {
            if(type === 'erc721'){
                return erc721Abi;
            } else if(type === 'erc1155'){
                return erc1155Abi;
            }
            return erc20Abi;
        },

        async getContractFromAbi(authenticator: ExternalProviderAuth, address:string, abi:EvmABI): Promise<ethers.Contract> {
            this.trace('getContractFromAbi', address, abi);
            const provider = await authenticator.web3Provider();
            if (!provider) {
                throw new AntelopeError('antelope.evm.error_no_provider');
            }
            return  new ethers.Contract(address, abi, provider);
        },

        async getToken(authenticator: ExternalProviderAuth, address:string, suspectedType:string): Promise<TokenClass | null> {
            if (suspectedType.toUpperCase() === ERC20_TYPE) {
                const chain = useChainStore().getChain(authenticator.label);
                const list = await chain.settings.getTokenList();
                const token = list.find(t => t.address.toUpperCase() === address.toUpperCase());
                if (token) {
                    return token;
                }
            }
            return null;
        },

        async getNFT(address:string, tokenId: string, suspectedType:string): Promise<NFTClass | null> {
            this.trace('getNFT', address, suspectedType, tokenId);
            if (suspectedType.toUpperCase() === ERC721_TYPE) {
                // TODO: here we try to get NFT data from the chain directly as a fallback for indexer, see https://github.com/telosnetwork/telos-wallet/issues/446
            }
            return null;
        },

        async getContractFromTokenList(
            authenticator: ExternalProviderAuth,
            address:string,
            suspectedType:string,
            creationInfo:EvmContractCreationInfo | null,
        ): Promise<EvmContract | null> {
            const token = await this.getToken(authenticator, address, suspectedType);
            if (token) {
                const abi = this.getTokenABI(ERC20_TYPE);
                const token_contract = new EvmContract({
                    name: `${token.name} (${token.symbol})`,
                    address,
                    creationInfo,
                    abi,
                    manager: createManager(authenticator),
                    token,
                    supportedInterfaces: [token.type],
                });
                const chain_settings = useChainStore().currentChain.settings as EVMChainSettings;
                chain_settings.addContract(address, token_contract);
                return token_contract;
            } else {
                return null;
            }
        },
    },
});

const evmInitialState: EVMState = {
    __: false,
};
