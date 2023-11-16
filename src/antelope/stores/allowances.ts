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
import { formatUnits } from 'ethers/lib/utils';

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
        nonErc20Allowances: state => (label: Label): ShapedCollectionAllowanceRow[] => ((state.__erc_1155_allowances[label] ?? []) as ShapedCollectionAllowanceRow[]).concat(state.__erc_721_allowances[label] ?? []),
        allowancesSortedByAssetQuantity: () => (label: Label, order: Sort): ShapedAllowanceRow[] => useAllowancesStore().allowances(label).sort((a, b) => {
            let quantityA: number;
            let quantityB: number;

            if (isErc20AllowanceRow(a)) {
                quantityA = Number(formatUnits(a.balance, a.tokenDecimals));
            } else if (isErc721SingleAllowanceRow(a)) {
                quantityA = 1;
            } else {
                quantityA = a.balance.toNumber();
            }

            if (isErc20AllowanceRow(b)) {
                quantityB = Number(formatUnits(b.balance, b.tokenDecimals));
            } else if (isErc721SingleAllowanceRow(b)) {
                quantityB = 1;
            } else {
                quantityB = b.balance.toNumber();
            }

            return order === Sort.ascending ? quantityA - quantityB : quantityB - quantityA;
        }),
        allowancesSortedByAllowanceFiatValue: state => (label: Label, order: Sort): ShapedAllowanceRow[] => [],
        allowancesSortedByAllowanceAmount: state => (label: Label, order: Sort): ShapedAllowanceRow[] => {
            /*
                Sort order:
                1. assets with allowances which are allowed (ERC721 collections, single ERC721s, and ERC1155 collections) - secondary sort descending by contract name or address
                2. assets with numerical allowances (ERC20s) - secondary sort descending by numerical allowance amount
                3. assets with allowances which are not allowed (ERC721 collections, single ERC721s, and ERC1155 collections) - secondary sort descending by contract name or address
            */
            const nonErc20Allowances = useAllowancesStore().nonErc20Allowances(label);

            const erc20AllowancesSorted = state.__erc_20_allowances[label]
                .sort((a, b) => {
                    const normalizedAAllowance = Number(formatUnits(a.allowance, a.tokenDecimals));
                    const normalizedBAllowance = Number(formatUnits(b.allowance, b.tokenDecimals));

                    return order === Sort.ascending ? normalizedAAllowance - normalizedBAllowance : normalizedBAllowance - normalizedAAllowance;
                });

            const allowedAllowancesSorted = nonErc20Allowances
                .filter(allowance => allowance.allowed)
                .sort((a, b) => sortAllowanceRowsByCollection(a, b, order));

            const notAllowedAllowancesSorted = nonErc20Allowances
                .filter(allowance => !allowance.allowed)
                .sort((a, b) => sortAllowanceRowsByCollection(a, b, order));

            return [
                ...allowedAllowancesSorted,
                ...erc20AllowancesSorted,
                ...notAllowedAllowancesSorted,
            ];
        },
        allowancesSortedBySpender: () => (label: Label, order: Sort): ShapedAllowanceRow[] => {
            const allAllowances = useAllowancesStore().allowances(label);
            const allowancesWithSpenderName    = allAllowances.filter(allowance => allowance.spenderName);
            const allowancesWithoutSpenderName = allAllowances.filter(allowance => !allowance.spenderName);

            const sortedAllowancesWithSpenderName = allowancesWithSpenderName.sort((a, b) => {
                const aSpender = a.spenderName as string;
                const bSpender = b.spenderName as string;
                return order === Sort.ascending ? aSpender.localeCompare(bSpender) : bSpender.localeCompare(aSpender);
            });
            const sortedAllowancesWithoutSpenderName = allowancesWithoutSpenderName.sort((a, b) => order === Sort.ascending ? a.spenderAddress.localeCompare(b.spenderAddress) : b.spenderAddress.localeCompare(a.spenderAddress));

            return [
                ...sortedAllowancesWithSpenderName,
                ...sortedAllowancesWithoutSpenderName,
            ];
        },
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
