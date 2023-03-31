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
import { RpcEndpoint } from 'universal-authenticator-library';

import {
    createTraceFunction,
    isTracingAll,
    useFeedbackStore,
} from 'src/antelope/stores/feedback';
import { errorToString } from 'src/antelope/config';
import { useChainStore } from 'src/antelope/stores/chain';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { events_signatures, functions_overrides, toChecksumAddress } from 'src/antelope/stores/utils';
import EvmContract from 'src/antelope/stores/utils/EvmContract';
import {
    AntelopeError,
    erc1155Abi,
    ERC1155_TRANSFER_SIGNATURE,
    erc20Abi,
    erc721Abi,
    erc721MetadataAbi,
    EvmABI,
    EvmContractCreationInfo,
    EvmContractManagerI,
    EvmLog,
    EvmToken,
    ExceptionError,
    supportsInterfaceAbi,
    Token,
    VerifiedContractMetadata,
} from 'src/antelope/types';
import { toRaw } from 'vue';

export interface EVMState {
    __external_provider: ExternalProvider | null;
    __ethers_rpc_provider: ethers.providers.JsonRpcProvider | null;
    __supports_meta_mask: boolean;
}

const store_name = 'evm';

const createManager = ():EvmContractManagerI => ({
    getRpcProvider: () => toRaw(useEVMStore().rpcProvider) as ethers.providers.JsonRpcProvider,
    getFunctionIface: (hash:string) => toRaw(useEVMStore().getFunctionIface(hash)),
    getEventIface: (hash:string) => toRaw(useEVMStore().getEventIface(hash)),
});

export const useEVMStore = defineStore(store_name, {
    state: (): EVMState => (evmInitialState),
    getters: {
        provider: state => state.__external_provider,
        rpcProvider: state => state.__ethers_rpc_provider,
        isMetamaskSupported: state => state.__supports_meta_mask,
        functionInterfaces: () => functions_overrides,
        eventInterfaces: () => events_signatures,
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
                    evm.setExternalProvider(provider);
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
                useFeedbackStore().setLoading('evm.login');
                chain.setLoggedChain(network);
                chain.setCurrentChain(network);
                const provider = this.__external_provider as ExternalProvider;

                let checkProvider = new ethers.providers.Web3Provider(provider);
                checkProvider = await this.ensureCorrectChain(checkProvider);

                const accounts = await checkProvider.listAccounts();
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
            } finally {
                useFeedbackStore().unsetLoading('evm.login');
            }
        },
        async ensureCorrectChain(checkProvider: ethers.providers.Web3Provider): Promise<ethers.providers.Web3Provider> {
            this.trace('ensureCorrectChain', checkProvider);
            let response = checkProvider;
            const { chainId } = await checkProvider.getNetwork();
            const currentChain = useChainStore().currentChain.settings as unknown as EVMChainSettings;
            if (Number(chainId).toString() !== currentChain.getChainId()) {
                await this.switchChainInjected();
                const provider = this.__external_provider as ExternalProvider;
                response = new ethers.providers.Web3Provider(provider);
            }
            this.setRpcProvider(response);
            return response;
        },
        async switchChainInjected(): Promise<boolean> {
            this.trace('switchChainInjected');
            useFeedbackStore().setLoading('evm.switchChainInjected');
            const provider = this.__external_provider;

            if (provider) {
                const chainSettings = useChainStore().loggedChain.settings as unknown as EVMChainSettings;
                const chainId = parseInt(chainSettings.getChainId(), 10);
                const chainIdParam = `0x${chainId.toString(16)}`;
                if (!provider.request) {
                    useFeedbackStore().unsetLoading('evm.switchChainInjected');
                    throw new Error('antelope.evm.error_support_provider_request');
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
                } finally {
                    useFeedbackStore().unsetLoading('evm.switchChainInjected');
                }
            } else {
                useFeedbackStore().unsetLoading('evm.switchChainInjected');
                throw new Error('antelope.evm.error_no_provider');
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
        async loadTokenMetadata(address:string, token:EvmToken, tokenId:string): Promise<Token> {
            if(token.type === 'erc1155'){
                const contract = await this.getContractFromAbi(address, erc1155Abi);
                token.metadata = await contract.uri(tokenId);
            } else {
                const contract = await this.getContractFromAbi(address, erc721MetadataAbi);
                token.metadata = await contract.tokenURI(tokenId);
            }
            if (token.metadata) {
                token.metadata = token.metadata.replace('ipfs://', 'https://cloudflare-ipfs.com/ipfs/');
            }
            return token;
        },
        getTokenTypeFromLog(log:EvmLog): string {
            const sig = log.topics[0].substring(0, 10);
            const type = (log.topics.length === 4) ? 'erc721' : 'erc20';
            return (sig === ERC1155_TRANSFER_SIGNATURE) ? 'erc1155' : type;
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
        async getContractCreation(address:string): Promise<EvmContractCreationInfo> {
            if (!address) {
                console.error('address is null', address);
                throw new AntelopeError('antelope.evm.error_invalid_address', { address });
            }
            try {
                const chain_settings = useChainStore().currentChain.settings as EVMChainSettings;
                return chain_settings.getContractCreation(address);
            } catch (e) {
                console.error(e);
                throw new AntelopeError('antelope.evm.error_getting_contract_creation', { address });
            }
        },
        // suspectedToken is so we don't try to check for ERC20 info via eth_call unless we think this is a token...
        // this is coming from the token transfer, transactions table & transaction (general + logs tabs) pages where we're
        // looking for a contract based on a token transfer event
        // handles erc721 & erc20 (w/ stubs for erc1155)
        async getContract(address:string, suspectedToken = ''): Promise<EvmContract | null> {
            if (!address) {
                return null;
            }
            const addressLower = address.toLowerCase();

            // Get from already queried contracts, add token data if needed & not present
            // (ie: queried beforehand w/o suspectedToken or a wrong suspectedToken)
            const chain_settings = useChainStore().currentChain.settings as EVMChainSettings;
            const cached = chain_settings.getContract(addressLower);
            if (cached) {
                if (
                    !suspectedToken ||
                    cached.token && cached.token?.type === suspectedToken
                ) {
                    return cached;
                }
            }

            const creationInfo = await this.getContractCreation(addressLower);

            const metadata = await this.checkBucket(address);
            if (metadata && creationInfo) {
                return await this.getVerifiedContract(addressLower, metadata, creationInfo, suspectedToken);
            }

            const contract = await this.getContractFromTokenList(address, creationInfo, suspectedToken);
            if (contract) {
                chain_settings.addContract(addressLower, contract);
                return contract;
            }

            if (suspectedToken) {
                const tokenData = await this.getTokenData(address, suspectedToken);
                if (tokenData) {
                    return await this.getTokenContract(addressLower, tokenData, creationInfo);
                }
            }

            return await this.getEmptyContract(addressLower, creationInfo);
        },
        async checkBucket(address:string): Promise<VerifiedContractMetadata | null> {
            const checksumAddress = toChecksumAddress(address);
            try {
                const currentChain = useChainStore().currentChain.settings as unknown as EVMChainSettings;
                // let responseData = (await contractsBucket.get(`${checksumAddress}/metadata.json`)).data;
                const metadataStr = await currentChain.getContractMetadata(checksumAddress);
                return JSON.parse(metadataStr);
            } catch (e) {
                return null;
            }
        },
        async getVerifiedContract(address:string, metadata:VerifiedContractMetadata, creationInfo:EvmContractCreationInfo, suspectedType:string): Promise<EvmContract> {
            const token = await this.getToken(address, suspectedType);
            if(token){
                token.type = suspectedType;
                token.address = address;
            }

            const contract = new EvmContract({
                name: Object.values(metadata.settings.compilationTarget)[0],
                address,
                abi: metadata.output.abi,
                manager: createManager(),
                token: token,
                creationInfo,
                verified: true,
            });
            const chain_settings = useChainStore().currentChain.settings as EVMChainSettings;
            chain_settings.addContract(address, contract);
            return contract;
        },
        async getTokenContract(address:string, tokenData:EvmToken, creationInfo:EvmContractCreationInfo): Promise<EvmContract> {
            const contract = new EvmContract({
                name: tokenData.symbol ? `${tokenData.name} (${tokenData.symbol})` : tokenData.name ?? 'Unknown',
                address,
                abi: this.getTokenABI(tokenData.type),
                manager: createManager(),
                creationInfo,
                token: Object.assign({
                    address,
                }, tokenData),
            });

            const chain_settings = useChainStore().currentChain.settings as EVMChainSettings;
            chain_settings.addContract(address, contract);
            return contract;
        },
        async getEmptyContract(address:string, creationInfo:EvmContractCreationInfo): Promise<EvmContract> {
            const contract = new EvmContract({
                name: `0x${address.slice(0, 16)}...`,
                address,
                creationInfo,
                manager: createManager(),
            });
            const chain_settings = useChainStore().currentChain.settings as EVMChainSettings;
            chain_settings.addContract(address, contract);
            return contract;
        },
        async supportsInterface(address:string, iface:string): Promise<boolean> {
            const provider = this.__ethers_rpc_provider;
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
        async isTokenType(address:string, type:string): Promise<string> {
            if(typeof type === 'undefined'){
                return '';
            } else if(type === 'erc721'){
                if(!await this.supportsInterface(address, '0x80ac58cd')){
                    return '';
                }
            } else if(type === 'erc1155') {
                if(!await this.supportsInterface(address, '0xd9b67a26')){
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
        async getContractFromAbi(address:string, abi:EvmABI): Promise<ethers.Contract> {
            const provider = this.__ethers_rpc_provider;
            if (!provider) {
                throw new AntelopeError('antelope.evm.error_no_provider');
            }
            return  new ethers.Contract(address, abi, provider);
        },
        async getTokenData(address:string, suspectedType:string): Promise<EvmToken> {
            const type = await this.isTokenType(address, suspectedType);
            if(type === ''){
                return {} as EvmToken;
            }
            const provider = this.__ethers_rpc_provider;
            if (!provider) {
                throw new AntelopeError('antelope.evm.error_no_provider');
            }
            const contract = new ethers.Contract(address, this.getTokenABI(type), provider);
            try {
                const tokenData = {} as EvmToken;
                if (type === 'erc20') {
                    tokenData.symbol = await contract.symbol();
                    tokenData.name = await contract.name();
                    tokenData.decimals = await contract.decimals();
                } else if(type === 'erc721'){
                    tokenData.symbol = await contract.symbol();
                    tokenData.name = await contract.name();
                    tokenData.has_metadata = await this.supportsInterface(address, '0x5b5e139f');
                } else if(type === 'erc1155'){
                    tokenData.name = contract.name || contract.address;
                    tokenData.has_metadata = await this.supportsInterface(address, '0x0e89341c');
                }

                tokenData.type = type;
                return tokenData;
            } catch (e) {
                return {} as EvmToken;
            }
        },
        async getToken(address:string, suspectedType:string): Promise<EvmToken> {
            const chain_settings = useChainStore().currentChain.settings as EVMChainSettings;
            const tokens = await chain_settings.getTokenList();

            let i = tokens.length;
            while (i--) {
                if (tokens[i].address?.toLowerCase() === address.toLowerCase()) {
                    return tokens[i];
                }
            }
            return await this.getTokenData(address, suspectedType);
        },
        async getContractFromTokenList(address:string, creationInfo:EvmContractCreationInfo, suspectedType:string): Promise<EvmContract | null> {
            const token = await this.getToken(address, suspectedType);
            if (token) {
                const abi = this.getTokenABI(token.type);
                const token_contract = new EvmContract({
                    name: `${token.name} (${token.symbol})`,
                    address,
                    creationInfo,
                    abi,
                    manager: createManager(),
                    token: { ...token, address },
                });
                const chain_settings = useChainStore().currentChain.settings as EVMChainSettings;
                chain_settings.addContract(address, token_contract);
                return token_contract;
            } else {
                return null;
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
        setExternalProvider(value: ExternalProvider | null) {
            this.trace('setExternalProvider', value);
            try {
                this.__external_provider = value;
            } catch (error) {
                console.error('Error: ', errorToString(error));
            }
        },
        setRpcProvider(value: ethers.providers.JsonRpcProvider | null) {
            this.trace('setRpcProvider', value);
            try {
                this.__ethers_rpc_provider = value;
            } catch (error) {
                console.error('Error: ', errorToString(error));
            }
        },
    },
});

const evmInitialState: EVMState = {
    __external_provider: null,
    __ethers_rpc_provider: null,
    __supports_meta_mask: false,
};
