import { defineStore } from 'pinia';
import {
    createInitFunction,
    createTraceFunction,
} from 'src/antelope/stores/feedback';

export interface AppNavState {
    __showBackBtn: boolean;
}

const store_name = 'appnav';

export const useAppNavStore = defineStore(store_name, {
    state: (): AppNavState => (globalInitialState),
    getters: {
        showBackBtn: (state: AppNavState) => state.__showBackBtn,
    },
    actions: {
        trace: createTraceFunction(store_name),
        init: createInitFunction(store_name),
        setShowBackBtn(value: boolean) {
            useAppNavStore().__showBackBtn = value;
        },
    },
});

const globalInitialState: AppNavState = {
    __showBackBtn: false,
};
