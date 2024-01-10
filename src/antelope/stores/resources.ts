/**
 * Resources: this store is responsible for obtaning and managing the resources of the
 * accounts present in the Account store.
 *
 * For Antelope native chains, there are three types of resources: CPU, NET, and RAM.
 * This store retrieves the resource data of the accounts and keeps them in memory while
 * also providing pre-built transactions to obtain or release resources.
 *
 * Note: This store is specific to Telos Native and will not be available for EVM chains.
 */


import { defineStore } from 'pinia';
import { createTraceFunction } from 'src/antelope/config';

export interface ResourcesState {
    __: string;
}

const store_name = 'resources';

export const useResourcesStore = defineStore(store_name, {
    state: (): ResourcesState => (resourcesInitialState),
    getters: {
    },
    actions: {
        trace: createTraceFunction(store_name),
    },
});

const resourcesInitialState: ResourcesState = {
    __: '',
};
