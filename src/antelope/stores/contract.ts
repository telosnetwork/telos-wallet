/**
 * Contract: This store is responsible for interacting with generic contracts, including
 * reading their ABIs and executing their actions.
 *
 * The Contract store provides a set of methods for reading and writing data to smart
 * contracts on the blockchain. It also includes support for decoding and encoding data
 * using contract ABI, which describes the interface of the contract.
 *
 */




import { defineStore } from 'pinia';
import {
    createTraceFunction,
    isTracingAll,
    useFeedbackStore,
} from 'src/antelope/stores/feedback';
import EvmContract, { Erc20Transfer } from 'src/antelope/stores/utils/contracts/EvmContract';
import EvmContractFactory from 'src/antelope/stores/utils/contracts/EvmContractFactory';
import { useChainStore } from 'src/antelope';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { getTopicHash, TRANSFER_SIGNATURES } from 'src/antelope/stores/utils';
import { AntelopeError, EvmContractFactoryData, EvmTransaction } from 'src/antelope/types';
import { ethers } from 'ethers';


export interface ContractStoreState {
    factory: EvmContractFactory;
    cachedContracts: Record<string, EvmContract>
    processing: string[];
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
        },

        async getContract(address: string): Promise<EvmContract | null> {
            const addressLower = address.toLowerCase();

            if (typeof this.cachedContracts[addressLower] !== 'undefined') {
                return this.cachedContracts[addressLower];
            }

            if (this.processing.includes(addressLower)) {
                await new Promise(resolve => setTimeout(resolve, 300));
                return this.getContract(address);
            }
            this.processing.push(addressLower);

            const index = this.processing.indexOf(addressLower);
            let contract = { address: address };
            try {
                const indexer = (useChainStore().loggedChain.settings as EVMChainSettings).getIndexer();
                const response = await indexer.get(`/contract/${address}?full=true&includeAbi=true`);
                if (response.data?.success && response.data.results.length > 0){
                    contract = response.data.results[0];
                }
            } catch (e) {
                console.warn(`Could not retrieve contract ${address}: ${e}`);
                return null;
            }
            this.addContractToCache(address, contract);
            this.processing = this.processing.splice(index, 1);
            return this.$state.factory.buildContract(contract);
        },

        addContractToCache(address: string, contractData: EvmContractFactoryData): void {
            if (!address) {
                throw new AntelopeError('antelope.contracts.address_required');
            }
            const index = address.toString().toLowerCase();
            const contract = this.factory.buildContract(contractData);

            if(
                typeof this.cachedContracts[index] === 'undefined'
                || (contract.abi ?? []).length > 0 && !this.cachedContracts[index].abi
                || (contract.abi ?? []).length > 0 &&(contract.abi ?? []).length > (this.cachedContracts[index].abi?.length ?? 0)
            ){
                this.cachedContracts[index] = contract;
            }
        },

        async getTransfersFromTransaction(transaction: EvmTransaction): Promise<Erc20Transfer[]> {
            if (!transaction.logs || transaction.logs?.length === 0){
                return [];
            }

            const logs = JSON.parse(transaction.logs);
            const transfers: Erc20Transfer[] = [];

            for (let i = 0; i < logs.length; i++){
                const log = logs[i];
                const sig = log.topics[0].slice(0, 10);

                if(TRANSFER_SIGNATURES.includes(sig)){
                    const contract = await this.getContract(log.address);
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

        async getFunctionNameFromTransaction(transaction: EvmTransaction, contractAddress: string): Promise<string> {
            if (!contractAddress) {
                throw new AntelopeError('antelope.contracts.address_required');
            }
            const contract = await this.getContract(contractAddress);

            if (!contract || !contract.abi) {
                throw new AntelopeError('antelope.contracts.invalid_contract');
            }

            const functionSignature = transaction.input.slice(0, 10);

            const iface = new ethers.utils.Interface(contract.abi);

            const functionFragment = Object.values(iface.functions)
                .find(fragment => iface.getSighash(fragment) === functionSignature);

            return functionFragment?.name ?? '';
        },
    },
});

const contractInitialState: ContractStoreState = {
    cachedContracts: {},
    processing: [],
    factory: new EvmContractFactory(),
};
