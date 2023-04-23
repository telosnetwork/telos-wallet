/**
 * Global: this store is outside Antelope store because it is app specific and is responsible for handling the app global auxiliary state.
 */

import { defineStore } from 'pinia';
import {
    createInitFunction,
    createTraceFunction,
} from 'src/antelope/stores/feedback';

export interface GlobalState {
    __headerBackBtn: boolean;
}

const store_name = 'global';

export const useGlobalStore = defineStore(store_name, {
    state: (): GlobalState => (globalInitialState),
    getters: {
        headerBackBtn: (state: GlobalState) => state.__headerBackBtn,
    },
    actions: {
        trace: createTraceFunction(store_name),
        init: createInitFunction(store_name),
        setHeaderBackBtn(value: boolean) {
            console.log('setHeaderBackBtn()', value);
            useGlobalStore().__headerBackBtn = value;
        },
    },
});

const globalInitialState: GlobalState = {
    __headerBackBtn: false,
};
