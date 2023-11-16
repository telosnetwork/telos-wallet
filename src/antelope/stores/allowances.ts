import { defineStore } from 'pinia';
import { filter } from 'rxjs';

import {
    CURRENT_CONTEXT,
    getAntelope,
    useFeedbackStore,
} from 'src/antelope';
import {
    Label,
    ShapedAllowanceRow,
    ShapedAllowanceRowERC20,
    ShapedAllowanceRowNftCollection,
    ShapedAllowanceRowSingleERC721,
    Sort,
} from 'src/antelope/types';
import { createTraceFunction, isTracingAll } from 'src/antelope/stores/feedback';

const store_name = 'allowances';

export interface AllowancesState {
    __erc_20_allowances:   { [label: Label]: ShapedAllowanceRowERC20[] };
    __erc_721_allowances:  { [label: Label]: (ShapedAllowanceRowNftCollection | ShapedAllowanceRowSingleERC721)[] };
    __erc_1155_allowances: { [label: Label]: ShapedAllowanceRowNftCollection[] };
}

export const useAllowancesStore = defineStore(store_name, {
    state: (): AllowancesState => allowancesInitialState,
    getters: {
        allowances: state => (label: Label): ShapedAllowanceRow[] => ((state.__erc_20_allowances[label] ?? []) as ShapedAllowanceRow[])
            .concat(state.__erc_721_allowances[label] ?? [])
            .concat(state.__erc_1155_allowances[label] ?? []),
        allowancesSortedByAssetQuantity: state => (label: Label, order: Sort): ShapedAllowanceRow[] => [],
        allowancesSortedByAllowanceFiatValue: state => (label: Label, order: Sort): ShapedAllowanceRow[] => [],
        allowancesSortedByAllowanceAmount: state => (label: Label, order: Sort): ShapedAllowanceRow[] => [],
        allowancesSortedBySpender: state => (label: Label, order: Sort): ShapedAllowanceRow[] => [],
        allowancesSortedByAssetType: state => (label: Label, order: Sort): ShapedAllowanceRow[] => [],
        allowancesSortedByLastUpdated: state => (label: Label, order: Sort): ShapedAllowanceRow[] => [],
    },
    actions: {
        trace: createTraceFunction(store_name),
        init: () => {
            const allowancesStore = useAllowancesStore();
            // eztodo in account store, wipe allowances on logout
            useFeedbackStore().setDebug(store_name, isTracingAll());

            getAntelope().events.onAccountChanged.pipe(
                filter(({ label, account }) => !!label && !!account),
            ).subscribe({
                next: ({ label, account }) => {
                    if (label === CURRENT_CONTEXT && account?.account) {
                        allowancesStore.fetchAllowancesForAccount(account?.account);
                    }
                },
            });
        },

        // actions
        async fetchAllowancesForAccount(account: string): Promise<void> {
            this.trace('fetchAllowancesForAccount', account);
            useFeedbackStore().setLoading('fetchAllowancesForAccount');

            // fetch erc20 allowances .then shape .then setErc20Allowances
            // fetch erc721 allowances .then shape .then setErc721Allowances
            // fetch erc1155 allowances .then shape .then setErc1155Allowances

            // await promise allsettled for all 3
            useFeedbackStore().unsetLoading('fetchAllowancesForAccount');
            // return
        },

        // commits
        setErc20Allowances(label: Label, allowances: ShapedAllowanceRowERC20[]) {
            this.trace('setErc20Allowances', allowances);
            this.__erc_20_allowances[label] = allowances;
        },
        setErc721Allowances(label: Label, allowances: (ShapedAllowanceRowNftCollection | ShapedAllowanceRowSingleERC721)[]) {
            this.trace('setErc721Allowances', allowances);
            this.__erc_721_allowances[label] = allowances;
        },
        setErc1155Allowances(label: Label, allowances: ShapedAllowanceRowNftCollection[]) {
            this.trace('setErc1155Allowances', allowances);
            this.__erc_1155_allowances[label] = allowances;
        },

        // utils
        clearAllowances() {
            this.trace('clearAllowances');
            this.__erc_20_allowances = {};
            this.__erc_721_allowances = {};
            this.__erc_1155_allowances = {};
        },
    },
});


const allowancesInitialState: AllowancesState = {
    __erc_20_allowances: {},
    __erc_721_allowances: {},
    __erc_1155_allowances: {},
};
