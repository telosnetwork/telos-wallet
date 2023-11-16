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
    ShapedCollectionAllowanceRow,
    Sort,
    isErc20AllowanceRow,
    isErc721SingleAllowanceRow,
    isNftCollectionAllowanceRow,
} from 'src/antelope/types';
import { createTraceFunction, isTracingAll } from 'src/antelope/stores/feedback';
import { BigNumber } from 'ethers';

const store_name = 'allowances';

const tenBn = BigNumber.from(10);

function sortAllowanceRowsByCollection(a: ShapedCollectionAllowanceRow, b: ShapedCollectionAllowanceRow, order: Sort): number {
    const aContractString = a?.collectionName ?? a.collectionAddress;
    const bContractString = b?.collectionName ?? b.collectionAddress;
    return order === Sort.ascending ? aContractString.localeCompare(bContractString) : bContractString.localeCompare(aContractString);
}

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
        allowancesSortedByAllowanceAmount: () => (label: Label, order: Sort): ShapedAllowanceRow[] => {
            /*
                Sort order:
                1. assets with allowances which are allowed (ERC721 collections, single ERC721s, and ERC1155 collections) - secondary sort descending by contract name or address
                2. assets with numerical allowances (ERC20s) - secondary sort descending by numerical allowance amount
                3. assets with allowances which are not allowed (ERC721 collections, single ERC721s, and ERC1155 collections) - secondary sort descending by contract name or address
            */
            const allowances = useAllowancesStore().allowances(label);

            const erc20Allowances = allowances
                .filter(isErc20AllowanceRow)
                .sort((a, b) => {
                    const normalizedA = a.allowance.div(tenBn.pow(a.tokenDecimals));
                    const normalizedB = b.allowance.div(tenBn.pow(b.tokenDecimals));

                    return order === Sort.ascending ? normalizedA.sub(normalizedB).toNumber() : normalizedB.sub(normalizedA).toNumber();
                });

            const allowedAllowances = (allowances
                .filter(allowance => !isErc20AllowanceRow(allowance) && allowance.allowed) as (ShapedAllowanceRowNftCollection | ShapedAllowanceRowSingleERC721)[])
                .sort((a, b) => sortAllowanceRowsByCollection(a, b, order));

            const notAllowedAllowances = (allowances
                .filter(allowance => !isErc20AllowanceRow(allowance) && !allowance.allowed) as (ShapedAllowanceRowNftCollection | ShapedAllowanceRowSingleERC721)[])
                .sort((a, b) => sortAllowanceRowsByCollection(a, b, order));

            return [
                ...allowedAllowances,
                ...erc20Allowances,
                ...notAllowedAllowances,
            ];
        },
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
