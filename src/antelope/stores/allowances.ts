import { defineStore } from 'pinia';
import { filter } from 'rxjs';
import { formatUnits, parseUnits } from 'ethers/lib/utils';

import {
    CURRENT_CONTEXT,
    getAntelope,
    useBalancesStore,
    useChainStore,
    useContractStore,
    useFeedbackStore,
    useNftsStore,
    useTokensStore,
} from 'src/antelope';
import {
    IndexerAllowanceResponse,
    IndexerAllowanceResponseErc1155,
    IndexerAllowanceResponseErc20,
    IndexerAllowanceResponseErc721,
    IndexerErc1155AllowanceResult,
    IndexerErc20AllowanceResult,
    IndexerErc721AllowanceResult,
    Label,
    ShapedAllowanceRow,
    ShapedAllowanceRowERC20,
    ShapedAllowanceRowNftCollection,
    ShapedAllowanceRowSingleERC721,
    ShapedCollectionAllowanceRow,
    Sort,
    isErc20AllowanceRow,
    isErc721SingleAllowanceRow,
    isIndexerAllowanceResponseErc1155,
    isIndexerAllowanceResponseErc20,
    isIndexerAllowanceResponseErc721,
} from 'src/antelope/types';
import { createTraceFunction, isTracingAll } from 'src/antelope/stores/feedback';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { BigNumber } from 'ethers';

const store_name = 'allowances';

const ALLOWANCES_LIMIT = 10000;

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
        allowancesSortedByAllowanceFiatValue: state => (label: Label, order: Sort): ShapedAllowanceRow[] => {
            const erc20WithFiatValue = state.__erc_20_allowances[label].filter(allowance => allowance.tokenPrice)
                .sort((a, b) => order === Sort.ascending ? a.tokenPrice - b.tokenPrice : b.tokenPrice - a.tokenPrice);
            const erc20WithoutFiatValue = state.__erc_20_allowances[label].filter(allowance => !allowance.tokenPrice);
            const rowsWithoutFiatValue = (state.__erc_721_allowances[label].concat(state.__erc_1155_allowances[label]) as ShapedAllowanceRow[])
                .concat(erc20WithoutFiatValue)
                .sort((a, b) => (a.spenderName ?? a.spenderAddress).localeCompare(b.spenderName ?? b.spenderAddress));

            return order === Sort.ascending ? [...erc20WithFiatValue, ...rowsWithoutFiatValue] : [...rowsWithoutFiatValue, ...erc20WithFiatValue];
        },
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
        allowancesSortedByAssetType: state => (label: Label, order: Sort): ShapedAllowanceRow[] => {
            // types are Collectible (ERC721/ERC1155) or Token (ERC20)
            const erc20Allowances = state.__erc_20_allowances[label] ?? [];
            const nonErc20Allowances = useAllowancesStore().nonErc20Allowances(label);

            const tokensSorted = erc20Allowances.sort((a, b) => {
                const normalizedAAllowance = Number(formatUnits(a.allowance, a.tokenDecimals));
                const normalizedBAllowance = Number(formatUnits(b.allowance, b.tokenDecimals));

                return normalizedAAllowance - normalizedBAllowance;
            });

            const allowedAllowancesSorted = nonErc20Allowances
                .filter(allowance => allowance.allowed)
                .sort((a, b) => sortAllowanceRowsByCollection(a, b, Sort.ascending));

            const notAllowedAllowancesSorted = nonErc20Allowances
                .filter(allowance => !allowance.allowed)
                .sort((a, b) => sortAllowanceRowsByCollection(a, b, Sort.ascending));

            const collectiblesSorted = [
                ...allowedAllowancesSorted,
                ...notAllowedAllowancesSorted,
            ];

            return order === Sort.ascending ? [...collectiblesSorted, ...tokensSorted] : [...tokensSorted, ...collectiblesSorted];
        },
        allowancesSortedByLastUpdated: () => (label: Label, order: Sort): ShapedAllowanceRow[] => useAllowancesStore().allowances(label)
            .sort((a, b) => order === Sort.ascending ? a.lastUpdated - b.lastUpdated : b.lastUpdated - a.lastUpdated),
    },
    actions: {
        trace: createTraceFunction(store_name),
        init: () => {
            const allowancesStore = useAllowancesStore();
            // eztodo in account store, wipe allowances on logout
            // eztodo on a timer, refresh allowance fiat values
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

            const chainSettings = useChainStore().currentChain.settings as EVMChainSettings;

            const erc20AllowancesPromise   = chainSettings.fetchErc20Allowances(account, { limit: ALLOWANCES_LIMIT });
            const erc721AllowancesPromise  = chainSettings.fetchErc721Allowances(account, { limit: ALLOWANCES_LIMIT });
            const erc1155AllowancesPromise = chainSettings.fetchErc1155Allowances(account, { limit: ALLOWANCES_LIMIT });
            const settledAllowancePromises = await Promise.allSettled([erc20AllowancesPromise, erc721AllowancesPromise, erc1155AllowancesPromise]);

            const fulfilledPromises: PromiseFulfilledResult<IndexerAllowanceResponse>[] = [];
            const rejectedPromises: PromiseRejectedResult[] = [];

            settledAllowancePromises.forEach((promise) => {
                if (promise.status === 'fulfilled') {
                    fulfilledPromises.push(promise as PromiseFulfilledResult<IndexerAllowanceResponse>);
                } else {
                    rejectedPromises.push(promise as PromiseRejectedResult);
                    console.error('Error fetching allowances', promise.reason);
                }
            });

            const erc20AllowancesData   = fulfilledPromises.find(({ value }) => isIndexerAllowanceResponseErc20(value))?.value as IndexerAllowanceResponseErc20 | undefined;
            const erc721AllowancesData  = fulfilledPromises.find(({ value }) => isIndexerAllowanceResponseErc721(value))?.value as IndexerAllowanceResponseErc721 | undefined;
            const erc1155AllowancesData = fulfilledPromises.find(({ value }) => isIndexerAllowanceResponseErc1155(value))?.value as IndexerAllowanceResponseErc1155 | undefined;

            const shapedRowPromises = [];

            if (erc20AllowancesData) {
                const shapedErc20AllowancePromises = erc20AllowancesData.results.map(allowanceData => this.shapeErc20AllowanceRow(allowanceData));
                shapedRowPromises.push(Promise.allSettled(shapedErc20AllowancePromises));
            } else {
                shapedRowPromises.push(Promise.resolve(undefined));
            }

            if (erc721AllowancesData) {
                const shapedErc721AllowancePromises = erc721AllowancesData.results.map(allowanceData => this.shapeErc721AllowanceRow(allowanceData));
                shapedRowPromises.push(Promise.allSettled(shapedErc721AllowancePromises));
            } else {
                shapedRowPromises.push(Promise.resolve(undefined));
            }

            if (erc1155AllowancesData) {
                const shapedErc1155AllowancePromises = erc1155AllowancesData.results.map(allowanceData => this.shapeErc1155AllowanceRow(allowanceData));
                shapedRowPromises.push(Promise.allSettled(shapedErc1155AllowancePromises));
            } else {
                shapedRowPromises.push(Promise.resolve(undefined));
            }

            const results = await Promise.all(shapedRowPromises);

            results.forEach((settledPromises, index) => {
                if (!settledPromises) {
                    return;
                }
                const shapedAllowances = settledPromises.reduce((acc, promise) => {
                    if (promise.status === 'fulfilled') {
                        acc.push(promise.value as ShapedAllowanceRow);
                    } else {
                        console.error('Error processing allowance data', promise.reason);
                    }
                    return acc;
                }, [] as ShapedAllowanceRow[]);

                if (index === 0 && erc20AllowancesData) {
                    this.setErc20Allowances(CURRENT_CONTEXT, shapedAllowances as ShapedAllowanceRowERC20[]);
                } else if (index === 1 && erc721AllowancesData) {
                    this.setErc721Allowances(CURRENT_CONTEXT, shapedAllowances as (ShapedAllowanceRowNftCollection | ShapedAllowanceRowSingleERC721)[]);
                } else if (index === 2 && erc1155AllowancesData) {
                    this.setErc1155Allowances(CURRENT_CONTEXT, shapedAllowances as ShapedAllowanceRowNftCollection[]);
                }
            });

            useFeedbackStore().unsetLoading('fetchAllowancesForAccount');

            return Promise.resolve();
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
        async shapeErc20AllowanceRow(data: IndexerErc20AllowanceResult): Promise<ShapedAllowanceRowERC20 | null> {
            const spenderContract = await useContractStore().getContract(CURRENT_CONTEXT, data.spender);
            const balanceInfo = useBalancesStore().currentBalances.find(balance => balance.contract === data.contract);

            if (!spenderContract || !balanceInfo) {
                return null;
            }

            return {
                lastUpdated: data.updated,
                spenderAddress: data.spender,
                spenderName: spenderContract?.name,
                tokenName: balanceInfo.name,
                tokenAddress: data.contract,
                allowance: BigNumber.from(data.amount),
                balance: balanceInfo.balance,
                tokenDecimals: balanceInfo.decimals,
                tokenSymbol: balanceInfo.symbol,
                tokenPrice: Number(balanceInfo.price.str),
                tokenLogo: balanceInfo.logo,
            };
        },
        async shapeErc721AllowanceRow(data: IndexerErc721AllowanceResult): Promise<ShapedAllowanceRowSingleERC721 | ShapedAllowanceRowNftCollection | null> {
            const spenderContract = await useContractStore().getContract(CURRENT_CONTEXT, data.operator);

            const commonAttributes = {
                lastUpdated: data.updated,
                spenderAddress: data.operator,
                spenderName: spenderContract?.name,
                allowed: data.approved,
            };

            if (data.single) {
                const tokenId = data.tokenId as string;
                const nftDetails = await useNftsStore().fetchNftDetails(CURRENT_CONTEXT, data.contract, tokenId);

                return nftDetails ? {
                    ...commonAttributes,
                    tokenId,
                    tokenName: nftDetails.name,
                    collectionAddress: nftDetails.contractAddress,
                    collectionName: nftDetails.contractPrettyName,
                } : null;
            }

            const collectionInfo = await useContractStore().getContract(CURRENT_CONTEXT, data.contract);
            const balance = await (await collectionInfo?.getContractInstance())?.balanceOf(data.owner);

            return collectionInfo ? {
                ...commonAttributes,
                collectionAddress: collectionInfo.address,
                collectionName: collectionInfo.name,
                balance,
            } : null;

        },
        async shapeErc1155AllowanceRow(data: IndexerErc1155AllowanceResult): Promise<ShapedAllowanceRowNftCollection | null> {
            const spenderContract = await useContractStore().getContract(CURRENT_CONTEXT, data.operator);
            const collectionInfo = await useContractStore().getContract(CURRENT_CONTEXT, data.contract);
            const balance = await (await collectionInfo?.getContractInstance())?.balanceOf(data.owner);

            return collectionInfo ? {
                lastUpdated: data.updated,
                spenderAddress: data.operator,
                spenderName: spenderContract?.name,
                allowed: data.approved,
                collectionAddress: collectionInfo.address,
                collectionName: collectionInfo.name,
                balance,
            } : null;
        },
    },
});


const allowancesInitialState: AllowancesState = {
    __erc_20_allowances: {},
    __erc_721_allowances: {},
    __erc_1155_allowances: {},
};
