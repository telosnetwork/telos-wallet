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
import { EvmContract2, EVMContractFactoryData } from 'src/antelope/stores/utils/contracts/EvmContract';
import EVMContractFactory from 'src/antelope/stores/utils/contracts/EvmContractFactory';
import { useChainStore } from 'src/antelope';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';


export interface ContractStoreState {
    factory: EVMContractFactory;
    cachedContracts: Record<string, EvmContract2>
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

        async getContract(address: string): Promise<EvmContract2 | null> {
            const addressLower = address.toLowerCase();

            if (typeof this.cachedContracts[addressLower] !== 'undefined') {
                return this.cachedContracts[addressLower];
            }

            if (this.processing.includes(addressLower)) {
                // eztodo switch to use feedbackstore
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
                // eztodo error handling
                console.warn(`Could not retrieve contract ${address}: ${(e as Error).message}`);
                return null;
            }
            this.addContractToCache(address, contract);
            this.processing = this.processing.splice(index, 1);
            return this.$state.factory.buildContract(contract);
        },

        addContractToCache(address: string, contractData: EVMContractFactoryData){
            if (!address){
                return;
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
    },
});

const contractInitialState: ContractStoreState = {
    cachedContracts: {},
    processing: [],
    factory: new EVMContractFactory(),
};
