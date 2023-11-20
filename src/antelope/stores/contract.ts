/**
 * Contract: This store is responsible for interacting with generic contracts, including
 * reading their ABIs and executing their actions.
 *
 * The Contract store provides a set of methods for reading and writing data to smart
 * contracts on the blockchain. It also includes support for decoding and encoding data
 * using contract ABI, which describes the interface of the contract.
 *
 * file: src/antelope/stores/contract.ts
 */




import { defineStore } from 'pinia';
import {
    useAccountStore,
    useFeedbackStore,
    useChainStore,
    useEVMStore,
    getAntelope,
} from 'src/antelope';
import {
    AntelopeError,
    erc1155Abi,
    erc20Abi,
    erc721Abi,
    EvmABI,
    EvmContractManagerI,
    EvmContractCreationInfo,
    EvmContractMetadata,
    TokenClass,
    ERC20_TYPE,
    EvmTransaction,
    EvmContractFactoryData,
} from 'src/antelope/types';

import { createTraceFunction, isTracingAll } from 'src/antelope/stores/feedback';
import EvmContract, { Erc20Transfer } from 'src/antelope/stores/utils/contracts/EvmContract';
import EvmContractFactory from 'src/antelope/stores/utils/contracts/EvmContractFactory';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { getTopicHash, toChecksumAddress, TRANSFER_SIGNATURES } from 'src/antelope/stores/utils';
import { EVMAuthenticator } from 'src/antelope/wallets';
import { ethers } from 'ethers';
import { toRaw } from 'vue';

const LOCAL_SORAGE_CONTRACTS_KEY = 'antelope.contracts';

const createManager = (authenticator?: EVMAuthenticator):EvmContractManagerI => ({
    getSigner: async () => {
        if (!authenticator) {
            return null;
        }
        const provider = await authenticator.web3Provider();
        const account = useAccountStore().getAccount(authenticator.label).account;
        return provider.getSigner(account);
    },
    getWeb3Provider: () => getAntelope().wallets.getWeb3Provider(),
    getFunctionIface: (hash:string) => toRaw(useEVMStore().getFunctionIface(hash)),
    getEventIface: (hash:string) => toRaw(useEVMStore().getEventIface(hash)),
});

export interface ContractStoreState {
    __factory: EvmContractFactory;
    __contracts: {
        [network: string]: {
            metadata: Record<string, EvmContractFactoryData | null>
            cached: Record<string, EvmContract | null>
            processing: Record<string, Promise<EvmContract | null>>
        },
    }
}

const store_name = 'contract';

export const useContractStore = defineStore(store_name, {
    state: (): ContractStoreState => (contractInitialState),
    getters: {
    },
    actions: {
        trace: createTraceFunction(store_name),
        init() {
            useFeedbackStore().setDebug(store_name, isTracingAll());
            this.loadCache();
        },


        /**
         * This function takes all contract's metadata and stores it in the localStorage
         */
        saveCache() {
            this.trace('saveCache');
            const cacheData: Record<string, Record<string, EvmContractFactoryData | null>> = {};

            for (const network in this.__contracts) {
                const metadata = this.__contracts[network].metadata;
                cacheData[network] = {};

                for (const address in metadata) {
                    cacheData[network][address] = metadata[address];
                }
            }

            const cacheString = JSON.stringify(cacheData);
            localStorage.setItem(LOCAL_SORAGE_CONTRACTS_KEY, cacheString);
        },

        /**
         * This function loads all contract's metadata from the localStorage.
         */
        loadCache() {
            this.trace('loadCache');
            const cacheString = localStorage.getItem(LOCAL_SORAGE_CONTRACTS_KEY);

            if (cacheString) {
                const cacheData: Record<string, Record<string, EvmContractFactoryData | null>> = JSON.parse(cacheString);

                for (const network in cacheData) {
                    const metadata = cacheData[network];

                    if (!this.__contracts[network]) {
                        this.__contracts[network] = {
                            metadata: {},
                            cached: {},
                            processing: {},
                        };
                    }

                    for (const address in metadata) {
                        this.__contracts[network].metadata[address] = metadata[address];
                    }
                }

                this.trace('loadCache ->', this.__contracts);
            }
        },

        /**
         * This functions returns immediately with the contract if it's already stored in the cache.
         * @param label identifier for the chain
         * @param address address of the contract
         */
        getContractIfStored(label: string, address: string): EvmContract | null {
            const network = useChainStore().getChain(label).settings.getNetwork();
            const addressLower = address.toLowerCase();
            const cached:EvmContract | null = this.__contracts[network]?.cached[addressLower] ?? null;
            return cached;
        },

        /**
         * This is the entry point to get a contract. Internally it will get it from the indexer if it's healthy,
         * otherwise it will get it from hyperion.
         * @param label identifier for the chain
         * @param address address of the contract
         * @param suspectedToken if you know the contract is a token, you can pass the type here to speed up the process
         * @returns the contract or null if it doesn't exist
         */
        async getContract(label: string, address:string, suspectedToken = ''): Promise<EvmContract | null> {
            this.trace('getContract', label, address, suspectedToken);
            const chainSettings = useChainStore().getChain(label).settings as EVMChainSettings;
            const network = chainSettings.getNetwork();
            const addressLower = address.toLowerCase();

            // we assert the network structure existence
            if (!this.__contracts[network]) {
                this.__contracts[network] = {
                    metadata: {},
                    cached: {},
                    processing: {},
                };
            }

            // if we have it in cache, return it
            if (
                // Only if we have the contract
                typeof this.__contracts[network].cached[addressLower] !== 'undefined' &&
                // and the metadata
                typeof this.__contracts[network].metadata[addressLower] !== 'undefined' &&
                (
                    // and either we don't have a interface type
                    !suspectedToken ||
                    // the the contract supports the interface type
                    (this.__contracts[network].metadata[addressLower]?.supportedInterfaces ?? []).includes(suspectedToken)
                )
            ) {
                this.trace('getContract', 'returning cached contract', address, [this.__contracts[network].cached[addressLower]]);
                return this.__contracts[network].cached[addressLower];
            }

            // if we have the metadata, we can create the contract and return it
            if (typeof this.__contracts[network].metadata[addressLower] !== 'undefined') {
                const metadata = this.__contracts[network].metadata[addressLower] as EvmContractFactoryData;
                // we ensure the contract hast the proper list of supported interfaces
                metadata.supportedInterfaces = metadata.supportedInterfaces || (suspectedToken ? [suspectedToken] : undefined);
                this.trace('getContract', 'returning cached metadata', address, [metadata]);
                return this.createAndStoreContract(label, addressLower, metadata);
            }

            // maybe we already starting processing it, return the promise
            if (typeof this.__contracts[network].processing[addressLower] !== 'undefined') {
                this.trace('getContract', 'returning processing contract', address);
                return this.__contracts[network].processing[addressLower];
            }

            this.trace('getContract', chainSettings.isIndexerHealthy() ? 'indexer is healthy' : 'indexer is not healthy');

            // we don't have it, let's get it
            if (chainSettings.isIndexerHealthy()) {
                try {
                    // we have a healthy indexer, let's get it from there first
                    return await this.fetchContractUsingIndexer(label, address, suspectedToken);
                } catch (e) {
                    console.warn('Indexer did not worked, falling back to hyperion');
                    return await this.fetchContractUsingHyperion(label, address, suspectedToken);
                }
            } else {
                // we don't have a healthy indexer, let's get it from hyperion
                return await this.fetchContractUsingHyperion(label, address, suspectedToken);
            }
        },

        async fetchContractUsingIndexer(label: string, address:string, suspectedToken = ''): Promise<EvmContract | null> {
            this.trace('fetchContractUsingIndexer', label, address, suspectedToken);
            const network = useChainStore().getChain(label).settings.getNetwork();
            const addressLower = address.toLowerCase();

            // ok, we need to fetch it
            this.__contracts[network].processing[addressLower] = new Promise(async (resolve) => {

                let metadata = { address: address } as EvmContractFactoryData;
                try {
                    const indexer = (useChainStore().loggedChain.settings as EVMChainSettings).getIndexer();
                    const response = await indexer.get(`/v1/contract/${address}?full=true&includeAbi=true`);
                    if (response.data?.success && response.data.results.length > 0){
                        metadata = response.data.results[0];
                    }
                } catch (e) {
                    console.warn(`Could not retrieve contract ${address}: ${e}`);
                    throw new AntelopeError('antelope.contracts.error_retrieving_contract', { address });
                }
                const contract = this.createAndStoreContract(label, address, metadata);
                resolve(contract);
            });

            // return the promise
            return this.__contracts[network].processing[addressLower];
        },

        async fetchContractUsingHyperion(label: string, address:string, suspectedToken = ''): Promise<EvmContract | null> {
            this.trace('fetchContractUsingHyperion', label, address, suspectedToken);
            const addressLower = address.toLowerCase();
            const network = useChainStore().getChain(label).settings.getNetwork();
            this.__contracts[network].processing[addressLower] = new Promise(async (resolve) => {
                try {
                    // Then we try to get the contract creation info. If it fails we set the contract as not existing and return null
                    const creationInfo = await this.fetchContractCreationInfo(label, addressLower);
                    const metadata = await this.fetchContractMetadata(label, address);

                    if (metadata && creationInfo) {
                        this.trace('fetchContractUsingHyperion', 'returning verified contract', address, metadata, creationInfo);
                        return resolve(this.createAndStoreVerifiedContract(label, addressLower, metadata, creationInfo, suspectedToken));
                    }

                    const contract = await this.createAndStoreContractFromTokenList(label, address, suspectedToken, creationInfo);
                    if (contract) {
                        this.trace('fetchContractUsingHyperion', 'returning contract from token list', address, contract);
                        return resolve(contract);
                    }

                    if (creationInfo) {
                        this.trace('fetchContractUsingHyperion', 'returning empty contract', address, creationInfo);
                        return resolve(this.createAndStoreEmptyContract(label, addressLower, creationInfo));
                    } else {
                        // We mark this address as not existing so we don't query it again
                        this.trace('fetchContractUsingHyperion', 'returning null', address);
                        this.setContractAsNotExisting(label, addressLower);
                        return resolve(null);
                    }
                } catch (e) {
                    console.warn(`Could not retrieve contract ${address}: ${e}`);
                    throw new AntelopeError('antelope.contracts.error_retrieving_contract', { address });
                }
            });

            return this.__contracts[network].processing[addressLower];
        },

        getTokenABI(type:string): EvmABI {
            if(type === 'erc721'){
                return erc721Abi;
            } else if(type === 'erc1155'){
                return erc1155Abi;
            }
            return erc20Abi;
        },

        async getToken(label: string, address:string, suspectedType:string): Promise<TokenClass | null> {
            if (suspectedType.toUpperCase() === ERC20_TYPE) {
                const list = await useChainStore().getChain(label).settings.getTokenList();
                const token = list.find(t => t.address.toUpperCase() === address.toUpperCase());
                if (token) {
                    return token;
                }
            }
            return null;
        },

        async fetchContractCreationInfo(label: string, address:string): Promise<EvmContractCreationInfo | null> {
            this.trace('fetchContractCreationInfo', label, address);
            if (!address) {
                console.error('address is null', address);
                throw new AntelopeError('antelope.evm.error_invalid_address', { address });
            }
            try {
                const chain_settings = useChainStore().getChain(label).settings as EVMChainSettings;
                const info = await chain_settings.fetchContractCreationInfo(address);
                this.trace('fetchContractCreationInfo', label, address, '-> info: ', [info]);
                return info ?? null;
            } catch (e) {
                console.error(new AntelopeError('antelope.evm.error_getting_contract_creation', { address }));
                return null;
            }
        },

        async fetchContractMetadata(label: string, address:string): Promise<EvmContractMetadata | null> {
            const checksumAddress = toChecksumAddress(address);
            this.trace('fetchContractMetadata', label, address, ' -> ', checksumAddress);
            try {
                const chain_settings = useChainStore().getChain(label).settings as EVMChainSettings;
                const metadataStr = await chain_settings.getContractMetadata(checksumAddress);
                this.trace('fetchContractMetadata', label, address, ' metadataStr: ', [metadataStr]);
                return JSON.parse(metadataStr);
            } catch (e) {
                return null;
            }
        },

        // Transactions utility functions -----------------------
        // get transfer information from a transaction (ERC20 and native token only)
        async getErc20TransfersFromTransaction(label: string, transaction: EvmTransaction): Promise<Erc20Transfer[]> {
            if (!transaction.logs || transaction.logs?.length === 0){
                return [];
            }

            const logs = JSON.parse(transaction.logs);
            const transfers: Erc20Transfer[] = [];

            for (let i = 0; i < logs.length; i++){
                const log = logs[i];
                const sig = log.topics[0].slice(0, 10);

                if(TRANSFER_SIGNATURES.includes(sig)) {
                    const contract = await this.getContract(label, log.address);
                    let to = getTopicHash(log.topics[2]);
                    let from = getTopicHash(log.topics[1]);

                    if (to.indexOf('0x') !== 0) {
                        to = `0x${to}`;
                    }

                    if (from.indexOf('0x') !== 0) {
                        from = `0x${from}`;
                    }

                    if (contract && contract.supportedInterfaces.includes('erc20')) {
                        transfers.push({
                            index: log.logIndex,
                            address: contract.address,
                            value: log.data,
                            decimals: contract.properties?.decimals,
                            symbol: contract.properties?.symbol,
                            to,
                            from,
                        });
                    }
                }
            }
            transfers.sort((a, b) => a.index - b.index);
            return transfers;
        },

        async getFunctionNameFromTransaction(transaction: EvmTransaction, contract: EvmContract): Promise<string> {
            if (!contract || !contract.abi) {
                throw new AntelopeError('antelope.contracts.invalid_contract');
            }

            const functionSignature = transaction.input.slice(0, 10);

            const iface = new ethers.utils.Interface(contract.abi);

            const functionFragment = Object.values(iface.functions)
                .find(fragment => iface.getSighash(fragment) === functionSignature);

            return functionFragment?.name ?? '';
        },

        // utility functions ---------------------
        async createAndStoreVerifiedContract(
            label: string,
            address:string,
            metadata: EvmContractMetadata,
            creationInfo: EvmContractCreationInfo,
            suspectedType: string,
        ): Promise<EvmContract> {
            this.trace('createAndStoreVerifiedContract', label, address, [metadata], [creationInfo], suspectedType);
            const token = await this.getToken(label, address, suspectedType) ?? undefined;
            return this.createAndStoreContract(label, address, {
                name: Object.values(metadata.settings?.compilationTarget ?? {})[0],
                address,
                abi: metadata.output?.abi,
                token: token,
                creationInfo,
                verified: true,
                supportedInterfaces: [token?.type ?? 'none'],
            } as EvmContractFactoryData);
        },

        async createAndStoreEmptyContract(
            label: string,
            address:string,
            creationInfo: EvmContractCreationInfo | null,
        ): Promise<EvmContract> {
            this.trace('createAndStoreEmptyContract', label, address, [creationInfo]);
            return this.createAndStoreContract(label, address, {
                name: `0x${address.slice(0, 16)}...`,
                address,
                creationInfo,
                supportedInterfaces: [],
            } as EvmContractFactoryData);
        },

        async createAndStoreContractFromTokenList(
            label:string,
            address:string,
            suspectedType:string,
            creationInfo:EvmContractCreationInfo | null,
        ): Promise<EvmContract | null> {
            const token = await this.getToken(label, address, suspectedType);
            if (token) {
                const abi = this.getTokenABI(ERC20_TYPE);
                return this.createAndStoreContract(label, address, {
                    name: `${token.name} (${token.symbol})`,
                    address,
                    creationInfo,
                    abi,
                    token,
                    supportedInterfaces: [token.type],
                } as EvmContractFactoryData);
            } else {
                return null;
            }
        },

        // commits -----
        createAndStoreContract(label: string, address: string, metadata: EvmContractFactoryData): EvmContract {
            const network = useChainStore().getChain(label).settings.getNetwork();
            this.trace('createAndStoreContract', label, network, address, [metadata]);
            if (!address) {
                throw new AntelopeError('antelope.contracts.error_address_required');
            }
            if (!label) {
                throw new AntelopeError('antelope.contracts.error_label_required');
            }
            const index = address.toString().toLowerCase();

            // If:
            // - we don't have the contract in cache... or
            // - we have the contract in cache but the new metadata has abi and the cached one doesn't... or
            // - we have the contract in cache but the new metadata has more abi than the cached one
            if(
                typeof this.__contracts[network].cached[index] === 'undefined'
                || (metadata.abi ?? []).length > 0 && !this.__contracts[network].cached[index]?.abi
                || (metadata.abi ?? []).length > 0 && (metadata.abi ?? []).length > (this.__contracts[network].cached[index]?.abi?.length ?? 0)
            ) {
                // This manager provides the signer and the web3 provider
                metadata.manager = createManager(useAccountStore().getAuthenticator(label) as EVMAuthenticator);

                // we create the contract using the factory
                const contract = this.__factory.buildContract(metadata);

                // then we store them in the cache
                this.__contracts[network].cached[index] = contract;
                this.__contracts[network].metadata[index] = { ...metadata, manager: undefined };

                // finally we save the cache and return the contract
                this.saveCache();
                return contract;
            } else {
                // else we return the cached contract
                return this.__contracts[network].cached[index] as EvmContract;
            }
        },

        setContractAsNotExisting(label: string, address: string): void {
            const network = useChainStore().getChain(label).settings.getNetwork();
            const index = address.toString().toLowerCase();
            this.__contracts[network].cached[index] = null;
        },
    },
});

const contractInitialState: ContractStoreState = {
    __contracts: {},
    __factory: new EvmContractFactory(),
};
