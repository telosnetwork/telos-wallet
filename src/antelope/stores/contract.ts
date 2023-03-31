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
    createInitFunction,
    createTraceFunction,
} from 'src/antelope/stores/feedback';


export interface ContractState {
    abi: string;
}

const store_name = 'contract';

export const useContractStore = defineStore(store_name, {
    state: (): ContractState => (contractInitialState),
    getters: {
    },
    actions: {
        trace: createTraceFunction(store_name),
        init: createInitFunction(store_name),
    },
});

const contractInitialState: ContractState = {
    abi: '',
};
