import { defineStore } from 'pinia';
import {
    createInitFunction,
    createTraceFunction,
} from 'src/antelope/stores/feedback';

export interface AppNavState {
    __headerBackBtn: boolean;
}

const store_name = 'appnav';

export const useAppNavStore = defineStore(store_name, {
    state: (): AppNavState => (globalInitialState),
    getters: {
        showBackBtn: (state: AppNavState) => state.__headerBackBtn,
    },
    actions: {
        trace: createTraceFunction(store_name),
        init: createInitFunction(store_name),
        setShowBackBtn(value: boolean) {
            useAppNavStore().__headerBackBtn = value;
        },
    },
});

const globalInitialState: AppNavState = {
    __headerBackBtn: false,
};
