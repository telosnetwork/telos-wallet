import { defineStore } from 'pinia';
import { filter } from 'rxjs';
import { formatUnits } from 'ethers/lib/utils';
import { BigNumber } from 'ethers';

import {
    CURRENT_CONTEXT,
    getAntelope,
    useBalancesStore,
    useChainStore,
    useContractStore,
    useFeedbackStore,
    useNftsStore,
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

const store_name = 'allowances';

const ALLOWANCES_LIMIT = 10000;

function sortAllowanceRowsByCollection(a: ShapedCollectionAllowanceRow, b: ShapedCollectionAllowanceRow, order: Sort): number {
    const aContractString = a?.collectionName ?? a.collectionAddress;
    const bContractString = b?.collectionName ?? b.collectionAddress;
    return order === Sort.ascending ? aContractString.localeCompare(bContractString) : bContractString.localeCompare(aContractString);
}

function filterCancelledAllowances(includeCancelled: boolean, row: ShapedAllowanceRow): boolean {
    if (includeCancelled) {
        return true;
    }

    return isErc20AllowanceRow(row) ? row.allowance.gt(0) : row.allowed;
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
        allowancesSortedByAssetQuantity: () => (label: Label, order: Sort, includeCancelled: boolean): ShapedAllowanceRow[] => useAllowancesStore().allowances(label).sort((a, b) => {
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
        }).filter(row => filterCancelledAllowances(includeCancelled, row)),
        allowancesSortedByAllowanceFiatValue: state => (label: Label, order: Sort, includeCancelled: boolean): ShapedAllowanceRow[] => {
            const erc20WithFiatValue = state.__erc_20_allowances[label].filter(allowance => allowance.tokenPrice)
                .sort((a, b) => order === Sort.ascending ? a.tokenPrice - b.tokenPrice : b.tokenPrice - a.tokenPrice)
                .filter(row => filterCancelledAllowances(includeCancelled, row));
            const erc20WithoutFiatValue = state.__erc_20_allowances[label]
                .filter(allowance => !allowance.tokenPrice && filterCancelledAllowances(includeCancelled, allowance));
            const rowsWithoutFiatValue = (state.__erc_721_allowances[label]
                .concat(state.__erc_1155_allowances[label]) as ShapedAllowanceRow[])
                .concat(erc20WithoutFiatValue)
                .sort((a, b) => (a.spenderName ?? a.spenderAddress).localeCompare(b.spenderName ?? b.spenderAddress))
                .filter(row => filterCancelledAllowances(includeCancelled, row));

            return order === Sort.descending ? [...erc20WithFiatValue, ...rowsWithoutFiatValue] : [...rowsWithoutFiatValue, ...erc20WithFiatValue];
        },
        allowancesSortedByAllowanceAmount: state => (label: Label, order: Sort, includeCancelled: boolean): ShapedAllowanceRow[] => {
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
                })
                .filter(row => filterCancelledAllowances(includeCancelled, row));

            const allowedAllowancesSorted = nonErc20Allowances
                .filter(allowance => allowance.allowed)
                .sort((a, b) => sortAllowanceRowsByCollection(a, b, order));

            const notAllowedAllowancesSorted = includeCancelled ? nonErc20Allowances
                .filter(allowance => !allowance.allowed)
                .sort((a, b) => sortAllowanceRowsByCollection(a, b, order)) : [];

            return [
                ...allowedAllowancesSorted,
                ...erc20AllowancesSorted,
                ...notAllowedAllowancesSorted,
            ];
        },
        allowancesSortedBySpender: () => (label: Label, order: Sort, includeCancelled: boolean): ShapedAllowanceRow[] => {
            const allAllowances = useAllowancesStore().allowances(label);
            const allowancesWithSpenderName = allAllowances
                .filter(allowance => allowance.spenderName && filterCancelledAllowances(includeCancelled, allowance));
            const allowancesWithoutSpenderName = allAllowances
                .filter(allowance => !allowance.spenderName && filterCancelledAllowances(includeCancelled, allowance));

            const sortedAllowancesWithSpenderName = allowancesWithSpenderName.sort((a, b) => {
                const aSpender = a.spenderName as string;
                const bSpender = b.spenderName as string;
                return order === Sort.descending ? aSpender.localeCompare(bSpender) : bSpender.localeCompare(aSpender);
            });
            const sortedAllowancesWithoutSpenderName = allowancesWithoutSpenderName.sort((a, b) => order === Sort.ascending ? a.spenderAddress.localeCompare(b.spenderAddress) : b.spenderAddress.localeCompare(a.spenderAddress));

            return [
                ...sortedAllowancesWithSpenderName,
                ...sortedAllowancesWithoutSpenderName,
            ];
        },
        allowancesSortedByAssetType: state => (label: Label, order: Sort, includeCancelled: boolean): ShapedAllowanceRow[] => {
            // types are Collectible (ERC721/ERC1155) or Token (ERC20)
            const erc20Allowances = state.__erc_20_allowances[label] ?? [];
            const nonErc20Allowances = useAllowancesStore().nonErc20Allowances(label);

            const tokensSorted = erc20Allowances.sort((a, b) => {
                const normalizedAAllowance = Number(formatUnits(a.allowance, a.tokenDecimals));
                const normalizedBAllowance = Number(formatUnits(b.allowance, b.tokenDecimals));

                return normalizedAAllowance - normalizedBAllowance;
            }).filter(row => filterCancelledAllowances(includeCancelled, row));

            const allowedAllowancesSorted = nonErc20Allowances
                .filter(allowance => allowance.allowed)
                .sort((a, b) => sortAllowanceRowsByCollection(a, b, Sort.ascending));

            const notAllowedAllowancesSorted = includeCancelled ? nonErc20Allowances
                .filter(allowance => !allowance.allowed)
                .sort((a, b) => sortAllowanceRowsByCollection(a, b, Sort.ascending)) : [];

            const collectiblesSorted = [
                ...allowedAllowancesSorted,
                ...notAllowedAllowancesSorted,
            ];

            return order === Sort.ascending ? [...collectiblesSorted, ...tokensSorted] : [...tokensSorted, ...collectiblesSorted];
        },
        allowancesSortedByLastUpdated: () => (label: Label, order: Sort, includeCancelled: boolean): ShapedAllowanceRow[] => useAllowancesStore().allowances(label)
            .sort((a, b) => order === Sort.ascending ? a.lastUpdated - b.lastUpdated : b.lastUpdated - a.lastUpdated)
            .filter(row => filterCancelledAllowances(includeCancelled, row)),
    },
    actions: {
        trace: createTraceFunction(store_name),
        init: () => {
            const allowancesStore = useAllowancesStore();
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

            // ERC20 balances are needed for ERC20 allowance row data
            await useBalancesStore().updateBalances(CURRENT_CONTEXT);

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

            const erc20AllowancesData   = (fulfilledPromises.find(({ value }) => isIndexerAllowanceResponseErc20(value))?.value as IndexerAllowanceResponseErc20 | undefined)?.results ?? [];
            const erc721AllowancesData  = (fulfilledPromises.find(({ value }) => isIndexerAllowanceResponseErc721(value))?.value as IndexerAllowanceResponseErc721 | undefined)?.results ?? [];
            const erc1155AllowancesData = (fulfilledPromises.find(({ value }) => isIndexerAllowanceResponseErc1155(value))?.value as IndexerAllowanceResponseErc1155 | undefined)?.results ?? [];

            const shapedErc20AllowanceRowPromises   = Promise.allSettled(erc20AllowancesData.map(allowanceData => this.shapeErc20AllowanceRow(allowanceData)));
            const shapedErc721AllowanceRowPromises  = Promise.allSettled(erc721AllowancesData.map(allowanceData => this.shapeErc721AllowanceRow(allowanceData)));
            const shapedErc1155AllowanceRowPromises = Promise.allSettled(erc1155AllowancesData.map(allowanceData => this.shapeErc1155AllowanceRow(allowanceData)));

            const [settledErc20Results, settledErc721Results, settledErc1155Results] = await Promise.allSettled([
                shapedErc20AllowanceRowPromises,
                shapedErc721AllowanceRowPromises,
                shapedErc1155AllowanceRowPromises,
            ]);

            if (settledErc20Results.status === 'fulfilled') {
                const shapedErc20Rows: ShapedAllowanceRowERC20[] = [];

                settledErc20Results.value.forEach((result) => {
                    if (result.status === 'fulfilled') {
                        result.value && shapedErc20Rows.push(result.value);
                    } else {
                        console.error('Error shaping ERC20 allowance row', result.reason);
                    }
                });

                this.setErc20Allowances(CURRENT_CONTEXT, shapedErc20Rows);
            } else {
                console.error('Error shaping ERC20 allowance rows', settledErc20Results.reason);
            }

            if (settledErc721Results.status === 'fulfilled') {
                const shapedErc721Rows: (ShapedAllowanceRowSingleERC721 | ShapedAllowanceRowNftCollection)[] = [];

                settledErc721Results.value.forEach((result) => {
                    if (result.status === 'fulfilled') {
                        result.value && shapedErc721Rows.push(result.value);
                    } else {
                        console.error('Error shaping ERC721 allowance row', result.reason);
                    }
                });

                this.setErc721Allowances(CURRENT_CONTEXT, shapedErc721Rows);
            } else {
                console.error('Error shaping ERC721 allowance rows', settledErc721Results.reason);
            }

            if (settledErc1155Results.status === 'fulfilled') {
                const shapedErc1155Rows: ShapedAllowanceRowNftCollection[] = [];

                settledErc1155Results.value.forEach((result) => {
                    if (result.status === 'fulfilled') {
                        result.value && shapedErc1155Rows.push(result.value);
                    } else {
                        console.error('Error shaping ERC1155 allowance row', result.reason);
                    }
                });

                this.setErc1155Allowances(CURRENT_CONTEXT, shapedErc1155Rows);
            } else {
                console.error('Error shaping ERC1155 allowance rows', settledErc1155Results.reason);
            }

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
            const network = useChainStore().getChain(CURRENT_CONTEXT).settings.getNetwork();
            const nftsStore = useNftsStore();

            const spenderContract = await useContractStore().getContract(CURRENT_CONTEXT, data.operator);
            const collectionInfo = await useContractStore().getContract(CURRENT_CONTEXT, data.contract);
            await nftsStore.fetchNftsFromCollection(CURRENT_CONTEXT, data.contract);
            const collectionNftIds = (nftsStore.__contracts[network][data.contract.toLowerCase()]?.list ?? []).map(nft => nft.id);

            if (collectionNftIds.length === 0) {
                console.error(`Collection ${data.contract} has no NFTs`);

                return null;
            }

            const balancePromises = collectionNftIds.map(async (tokenId) => {
                const contractInstance = await collectionInfo?.getContractInstance();
                return contractInstance?.balanceOf(data.owner, tokenId) as BigNumber;
            });

            try {
                const balancesOfAllIdsInCollection = await Promise.all(balancePromises);
                const balance = balancesOfAllIdsInCollection.reduce((acc, balance) => acc.add(balance ?? 0), BigNumber.from(0));

                return collectionInfo ? {
                    lastUpdated: data.updated,
                    spenderAddress: data.operator,
                    spenderName: spenderContract?.name,
                    allowed: data.approved,
                    collectionAddress: collectionInfo.address,
                    collectionName: collectionInfo.name,
                    balance,
                } : null;
            } catch (e) {
                console.error(`Error fetching ERC1155 balances for collection ${data.contract}`, e);
                return null;
            }
        },
    },
});


const allowancesInitialState: AllowancesState = {
    __erc_20_allowances: {},
    __erc_721_allowances: {},
    __erc_1155_allowances: {},
};
