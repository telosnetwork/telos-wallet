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
import { BigNumber, ethers } from 'ethers';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { defineStore } from 'pinia';
import { RpcEndpoint } from 'universal-authenticator-library';
import { BehaviorSubject, filter } from 'rxjs';

import {
    createTraceFunction,
    isTracingAll,
    useFeedbackStore,
} from 'src/antelope/stores/feedback';
import { errorToString } from 'src/antelope/config';
import { useChainStore } from 'src/antelope/stores/chain';
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
    EvmTransactionResponse,
    EvmContractCreationInfo,
    EvmContractMetadata,
    TokenSourceInfo,
    TokenClass,
    ERC20_TYPE,
    ERC721_TYPE,
    ERC1155_TYPE,
} from 'src/antelope/types';
import { toRaw } from 'vue';
import { getAccount } from '@wagmi/core';
import { usePlatformStore } from 'src/antelope/stores/platform';
import { checkNetwork } from 'src/antelope/stores/utils/checkNetwork';
import { useAccountStore } from 'src/antelope/stores/account';

const onEvmReady = new BehaviorSubject<boolean>(false);

export const evmEvents = {
    whenReady: onEvmReady.asObservable().pipe(
        filter(ready => ready),
    ),
};

export interface EVMState {
    __external_signer: ethers.Signer | null;
    __external_provider: ExternalProvider | null;
    __ethers_rpc_provider: ethers.providers.JsonRpcProvider | null;
    __supports_meta_mask: boolean;
}

const store_name = 'evm';

const createManager = ():EvmContractManagerI => ({
    getSigner: () => toRaw(useEVMStore().signer) as ethers.Signer,
    getRpcProvider: () => toRaw(useEVMStore().rpcProvider) as ethers.providers.JsonRpcProvider,
    getFunctionIface: (hash:string) => toRaw(useEVMStore().getFunctionIface(hash)),
    getEventIface: (hash:string) => toRaw(useEVMStore().getEventIface(hash)),
});

export const useEVMStore = defineStore(store_name, {
    state: (): EVMState => (evmInitialState),
    getters: {
        provider: state => state.__external_provider,
        rpcProvider: state => state.__ethers_rpc_provider,
        signer: state => toRaw(state.__external_signer),
        isMetamaskSupported: state => state.__supports_meta_mask,
        functionInterfaces: () => functions_overrides,
        eventInterfaces: () => events_signatures,
    },
    actions: {
        trace: createTraceFunction(store_name),
        init: () => {

            // bypass provider detection on mobile
            if (usePlatformStore().isMobile){
                return;
            }

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
                    provider.on('accountsChanged', async (accounts) => {
                        evm.trace('provider.accountsChanged', accounts);
                        const network = useChainStore().currentChain.settings.getNetwork();
                        useAccountStore().loginEVM({ network });
                    });
                }
                onEvmReady.next(true);
            });
        },
        // actions ---
        async login (network: string): Promise<string | null> {
            this.trace('login', network);
            const chain = useChainStore();
            try {
                useFeedbackStore().setLoading('evm.login');
                chain.setLoggedChain(network);
                chain.setCurrentChain(network);

                if (localStorage.getItem('wagmi.connected')){
                    return getAccount().address as string;
                }

                const checkProvider = await checkNetwork() as ethers.providers.Web3Provider;

                const accounts = await checkProvider.listAccounts();
                if (accounts.length > 0) {
                    return accounts[0];
                } else {
                    if (!checkProvider.provider.request) {
                        throw new Error('antelope.evm.error_support_provider_request');
                    }
                    const accessGranted = await checkProvider.provider.request({ method: 'eth_requestAccounts' });
                    if (accessGranted.length < 1) {
                        return null;
                    }
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
                const provider = await this.ensureProvider();
                const checkProvider = new ethers.providers.Web3Provider(provider);
                const signer = await checkProvider.getSigner();
                this.setExternalSigner(signer);

            }
        },
        async sendSystemToken (to: string, value: BigNumber): Promise<EvmTransactionResponse> {
            this.trace('sendSystemToken', to, value);

            // Send the transaction
            if (this.signer) {
                return this.signer.sendTransaction({
                    to,
                    value,
                }).then(
                    (transaction: ethers.providers.TransactionResponse) => transaction,
                ).catch((error) => {
                    if ('ACTION_REJECTED' === ((error as {code:string}).code)) {
                        throw new AntelopeError('antelope.evm.transaction_canceled');
                    } else {
                        // unknown error we print on console
                        console.error(error);
                        throw new AntelopeError('antelope.evm.error_send_transaction', { error });
                    }
                });
            } else {
                console.error('Error sending transaction: No signer');
                throw new Error('antelope.evm.error_no_signer');
            }
        },
        // auxiliar
        async ensureProvider(): Promise<ExternalProvider> {
            return new Promise((resolve, reject) => {
                evmEvents.whenReady.subscribe(async () => {
                    const provider = this.__external_provider as ExternalProvider;
                    if (provider) {
                        resolve(provider);
                    } else {
                        reject(new AntelopeError('antelope.evm.error_no_provider'));
                    }
                });
            });
        },

        async ensureCorrectChain(checkProvider: ethers.providers.Web3Provider): Promise<ethers.providers.Web3Provider> {
            this.trace('ensureCorrectChain', checkProvider);
            let response = checkProvider;
            const { chainId } = await checkProvider.getNetwork();
            const currentChain = useChainStore().currentChain.settings as unknown as EVMChainSettings;
            if (Number(chainId).toString() !== currentChain.getChainId()) {
                await this.switchChainInjected();
                const provider = await this.ensureProvider();
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

                    // if user rejects request to switch chains, disable repeated prompts
                    if ((error as unknown as ExceptionError).code === 4001){ // 4001 - 'user rejected request'
                        window.removeEventListener('focus', checkNetwork);
                    }

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
                        console.error(new Error('antelope.evm.switch_chain_rejected'));
                        return false;
                    } else {
                        console.error('Error:', error);
                        throw new Error('antelope.evm.error_switch_chain');
                    }
                } finally {
                    useFeedbackStore().unsetLoading('evm.switchChainInjected');
                }
            } else {
                useFeedbackStore().unsetLoading('evm.switchChainInjected');
                throw new AntelopeError('antelope.evm.error_no_provider');
            }
        },
        // utils ---
        toWei(value: string | number, decimals = 18): string {
            const bigAmount: ethers.BigNumber = ethers.utils.parseUnits(value === 'string' ? value : value.toString(), decimals.toString());
            const amountInWei = bigAmount.toString();
            return amountInWei;
        },
        toBigNumber(value: string | number, decimals?: number): ethers.BigNumber {
            const dec = decimals ? decimals : value.toString().split('.')[1]?.length ?? 0;
            const bigAmount: ethers.BigNumber = ethers.utils.parseUnits(value === 'string' ? value : value.toString(), dec.toString());
            return bigAmount;
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

        async getContractCreation(address:string): Promise<EvmContractCreationInfo | null> {
            if (!address) {
                console.error('address is null', address);
                throw new AntelopeError('antelope.evm.error_invalid_address', { address });
            }
            try {
                const chain_settings = useChainStore().currentChain.settings as EVMChainSettings;
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
        async getContract(address:string, suspectedToken = ''): Promise<EvmContract | null> {
            if (!address) {
                this.trace('getContract', 'address is null', address);
                return null;
            }
            const addressLower = address.toLowerCase();

            // Get from already queried contracts, add token data if needed & not present
            // (ie: queried beforehand w/o suspectedToken or a wrong suspectedToken)
            const chain_settings = useChainStore().currentChain.settings as EVMChainSettings;
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
            const creationInfo = await this.getContractCreation(addressLower);
            // The the contract passes the creation info check,
            // we overwrite the previous call to set contract as not existing with the actual EvmContract

            const metadata = await this.checkBucket(address);
            if (metadata && creationInfo) {
                this.trace('getContract', 'returning verified contract', address, metadata, creationInfo);
                return await this.getVerifiedContract(addressLower, metadata, creationInfo, suspectedToken);
            }

            const contract = await this.getContractFromTokenList(address, suspectedToken, creationInfo);
            if (contract) {
                this.trace('getContract', 'returning contract from token list', address, contract);
                return contract;
            }

            this.trace('getContract', 'returning empty contract', address, creationInfo);
            return await this.getEmptyContract(addressLower, creationInfo);
        },

        async checkBucket(address:string): Promise<EvmContractMetadata | null> {
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

        async getVerifiedContract(
            address:string,
            metadata: EvmContractMetadata,
            creationInfo: EvmContractCreationInfo,
            suspectedType:string,
        ): Promise<EvmContract> {
            const token = await this.getToken(address, suspectedType) ?? undefined;
            const contract = new EvmContract({
                name: Object.values(metadata.settings?.compilationTarget ?? {})[0],
                address,
                abi: metadata.output?.abi,
                manager: createManager(),
                token: token,
                creationInfo,
                verified: true,
                supportedInterfaces: [token?.type ?? 'none'],
            });
            const chain_settings = useChainStore().currentChain.settings as EVMChainSettings;
            chain_settings.addContract(address, contract);
            return contract;
        },

        async getTokenContract(address:string, tokenData: TokenSourceInfo, creationInfo:EvmContractCreationInfo): Promise<EvmContract> {
            const contract = new EvmContract({
                name: tokenData.symbol ? `${tokenData.name} (${tokenData.symbol})` : tokenData.name ?? 'Unknown',
                address,
                abi: this.getTokenABI(tokenData.type ?? ''),
                manager: createManager(),
                creationInfo,
                token: Object.assign({
                    address,
                }, tokenData) as TokenSourceInfo,
                supportedInterfaces: [tokenData.type ?? 'none'],
            });

            const chain_settings = useChainStore().currentChain.settings as EVMChainSettings;
            chain_settings.addContract(address, contract);
            return contract;
        },

        async getEmptyContract(address:string, creationInfo: EvmContractCreationInfo | null): Promise<EvmContract> {
            const contract = new EvmContract({
                name: `0x${address.slice(0, 16)}...`,
                address,
                creationInfo,
                manager: createManager(),
                supportedInterfaces: [],
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

        async getERC20TokenBalance(account: string, address:string): Promise<ethers.BigNumber> {
            const erc20ABI = this.getTokenABI(ERC20_TYPE) as AbiItem[];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const web3 = new Web3((window as any).ethereum);

            const contract = new web3.eth.Contract(erc20ABI, address);
            return contract.methods.balanceOf(account).call()
                .then((balance: never) => ethers.BigNumber.from(balance));
        },

        async getToken(address:string, suspectedType:string): Promise<TokenClass | null> {
            if (suspectedType === ERC20_TYPE) {
                const chain = useChainStore().currentChain;
                const list = await chain.settings.getTokenList();
                const token = list.find(t => t.address.toLowerCase() === address.toLowerCase());
                if (token) {
                    return token;
                }
            }
            return null;
        },

        async getContractFromTokenList(address:string, suspectedType:string, creationInfo:EvmContractCreationInfo | null): Promise<EvmContract | null> {
            const token = await this.getToken(address, suspectedType);
            if (token) {
                const abi = this.getTokenABI(ERC20_TYPE);
                const token_contract = new EvmContract({
                    name: `${token.name} (${token.symbol})`,
                    address,
                    creationInfo,
                    abi,
                    manager: createManager(),
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
        setExternalSigner(value: ethers.Signer | null) {
            this.trace('setExternalSigner', value);
            try {
                this.__external_signer = value;
            } catch (error) {
                console.error('Error: ', errorToString(error));
            }
        },
    },
});

const evmInitialState: EVMState = {
    __external_signer: null,
    __external_provider: null,
    __ethers_rpc_provider: null,
    __supports_meta_mask: false,
};
