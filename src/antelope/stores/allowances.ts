import { defineStore } from 'pinia';
import { formatUnits } from 'ethers/lib/utils';
import { BigNumber } from 'ethers';

import {
    AntelopeError,
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
    TransactionResponse,
    isErc20AllowanceRow,
    isErc721SingleAllowanceRow,
    isNftCollectionAllowanceRow,
    EvmContractFactoryData,
} from 'src/antelope/types';
import { createTraceFunction } from 'src/antelope/config';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { ZERO_ADDRESS } from 'src/antelope/chains/chain-constants';
import { WriteContractResult } from '@wagmi/core';
import { AccountModel, EvmAccountModel } from 'src/antelope/stores/account';
import { subscribeForTransactionReceipt } from 'src/antelope/stores/utils/trx-utils';

// dependencies --
import {
    CURRENT_CONTEXT,
    getAntelope,
    useAccountStore,
    useBalancesStore,
    useChainStore,
    useContractStore,
    useFeedbackStore,
    useNftsStore,
    useTokensStore,
} from 'src/antelope';

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
        singleErc721Allowances: state => (label: Label): ShapedAllowanceRowSingleERC721[] => (state.__erc_721_allowances[label] ?? []).filter(allowance => isErc721SingleAllowanceRow(allowance)) as ShapedAllowanceRowSingleERC721[],
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
        getAllowance: () => (label: Label, spenderAddress: string, tokenAddress: string, tokenId?: string): ShapedAllowanceRow | undefined => {
            const allowanceStore = useAllowancesStore();
            if (tokenId) {
                return allowanceStore.singleErc721Allowances(label).find(allowance =>
                    allowance.spenderAddress.toLowerCase() === spenderAddress.toLowerCase() &&
                    allowance.collectionAddress.toLowerCase() === tokenAddress.toLowerCase() &&
                    allowance.tokenId.toLowerCase() === tokenId.toLowerCase(),
                );
            }

            return allowanceStore.allowances(label).find((allowance) => {
                const spenderAddressMatches = allowance.spenderAddress.toLowerCase() === spenderAddress.toLowerCase();
                if (isErc20AllowanceRow(allowance)) {
                    return spenderAddressMatches && allowance.tokenAddress.toLowerCase() === tokenAddress.toLowerCase();
                }

                return spenderAddressMatches && allowance.collectionAddress.toLowerCase() === tokenAddress.toLowerCase();
            });
        },
    },
    actions: {
        trace: createTraceFunction(store_name),
        init: () => {
            const allowancesStore = useAllowancesStore();
            const ant = getAntelope();

            ant.events.onClear.subscribe(({ label }) => {
                allowancesStore.clearAllowances(label);
            });
        },

        // actions
        async fetchAllowancesForAccount(account: string): Promise<void> {
            this.trace('fetchAllowancesForAccount', account);
            try {
                useFeedbackStore().setLoading('fetchAllowancesForAccount');

                const chainSettings = useChainStore().currentChain.settings as EVMChainSettings;

                if (chainSettings.isNative()) {
                    this.trace('fetchAllowancesForAccount', 'Native chain does not have allowances');
                    return;
                }

                const erc20AllowancesPromise   = chainSettings.fetchErc20Allowances(account, { limit: ALLOWANCES_LIMIT });
                const erc721AllowancesPromise  = chainSettings.fetchErc721Allowances(account, { limit: ALLOWANCES_LIMIT });
                const erc1155AllowancesPromise = chainSettings.fetchErc1155Allowances(account, { limit: ALLOWANCES_LIMIT });

                let allowancesResults: IndexerAllowanceResponse[];

                try {
                    allowancesResults = await Promise.all([erc20AllowancesPromise, erc721AllowancesPromise, erc1155AllowancesPromise]);
                } catch (e) {
                    console.error('Error fetching allowances', e);
                    useFeedbackStore().unsetLoading('fetchAllowancesForAccount');
                    throw new AntelopeError('antelope.allowances.error_fetching_allowances');
                }

                const erc20AllowancesData   = (allowancesResults[0] as IndexerAllowanceResponseErc20)?.results ?? [];
                const erc721AllowancesData  = (allowancesResults[1] as IndexerAllowanceResponseErc721)?.results ?? [];
                const erc1155AllowancesData = (allowancesResults[2] as IndexerAllowanceResponseErc1155)?.results ?? [];

                // Load these in the cache so they're available later and we don't abuse the indexer API
                allowancesResults.map((result) => {
                    for (const [address, contract] of Object.entries(result.contracts)) {
                        useContractStore().createAndStoreContract(CURRENT_CONTEXT, address, contract as EvmContractFactoryData);
                    }
                });

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
            } catch (e) {
                useFeedbackStore().unsetLoading('fetchAllowancesForAccount');
                console.error('Error fetching allowances', e);
                throw new AntelopeError('antelope.allowances.error_fetching_allowances');
            }
        },
        async updateErc20Allowance(
            owner: string,
            spender: string,
            tokenContractAddress: string,
            allowance: BigNumber,
        ): Promise<TransactionResponse> {
            this.trace('updateErc20Allowance', spender, tokenContractAddress, allowance);
            useFeedbackStore().setLoading('updateErc20Allowance');

            try {
                const authenticator = useAccountStore().getEVMAuthenticator(CURRENT_CONTEXT);

                const tx = await authenticator.updateErc20Allowance(spender, tokenContractAddress, allowance) as TransactionResponse;
                const account = useAccountStore().loggedAccount as EvmAccountModel;

                const returnTx = this.subscribeForTransactionReceipt(account, tx);

                returnTx.then((r) => {
                    r.wait().finally(() => {
                        useFeedbackStore().unsetLoading('updateErc20Allowance');
                    });
                });

                return returnTx;
            } catch(error) {
                const trxError = getAntelope().config.transactionError('antelope.evm.error_updating_allowance', error);
                getAntelope().config.transactionErrorHandler(trxError, 'updateErc20Allowance');
                useFeedbackStore().unsetLoading('updateErc20Allowance');
                throw trxError;
            }
        },
        async updateSingleErc721Allowance(
            owner: string,
            operator: string,
            nftContractAddress: string,
            tokenId: string,
            allowed: boolean,
        ): Promise<TransactionResponse> {
            this.trace('updateSingleErc721Allowance', operator, nftContractAddress, allowed);
            useFeedbackStore().setLoading('updateSingleErc721Allowance');

            try {
                // note: there can only be one operator for a single ERC721 token ID
                // to revoke an allowance, the approve method is called with an operator address of '0x0000...0000'
                const newOperator = allowed ? operator : ZERO_ADDRESS;
                const authenticator = useAccountStore().getEVMAuthenticator(CURRENT_CONTEXT);

                const tx = await authenticator.updateSingleErc721Allowance(newOperator, nftContractAddress, tokenId) as TransactionResponse;

                const account = useAccountStore().loggedAccount as EvmAccountModel;

                const returnTx = this.subscribeForTransactionReceipt(account, tx);

                returnTx.then((r) => {
                    r.wait().finally(() => {
                        useFeedbackStore().unsetLoading('updateSingleErc721Allowance');
                    });
                });

                return returnTx;
            } catch (error) {
                const trxError = getAntelope().config.transactionError('antelope.evm.error_updating_allowance', error);
                getAntelope().config.transactionErrorHandler(trxError, 'updateSingleErc721Allowance');
                useFeedbackStore().unsetLoading('updateSingleErc721Allowance');
                throw trxError;
            }
        },
        // this method is used for both ERC721 and ERC1155 collections
        async updateNftCollectionAllowance(
            owner: string,
            operator: string,
            nftContractAddress: string,
            allowed: boolean,
        ): Promise<TransactionResponse> {
            this.trace('updateNftCollectionAllowance', operator, nftContractAddress, allowed);
            useFeedbackStore().setLoading('updateNftCollectionAllowance');

            try {
                const authenticator = useAccountStore().getEVMAuthenticator(CURRENT_CONTEXT);
                const tx = await authenticator.updateNftCollectionAllowance(operator, nftContractAddress, allowed) as TransactionResponse;

                const account = useAccountStore().loggedAccount as EvmAccountModel;

                const returnTx = this.subscribeForTransactionReceipt(account, tx);

                returnTx.then((r) => {
                    r.wait().finally(() => {
                        useFeedbackStore().unsetLoading('updateNftCollectionAllowance');
                    });
                });

                return returnTx;
            } catch (error) {
                const trxError = getAntelope().config.transactionError('antelope.evm.error_updating_allowance', error);
                getAntelope().config.transactionErrorHandler(trxError, 'updateNftCollectionAllowance');
                useFeedbackStore().unsetLoading('updateNftCollectionAllowance');
                throw trxError;
            }
        },
        batchRevokeAllowances(
            allowanceIdentifiers: string[],
            owner: string,
            revokeCompletedHandler: (tx: TransactionResponse | null, remaining: number) => void,
        ): {
            promise: Promise<void>,
            cancelToken: { isCancelled: boolean, cancel: () => void },
        } {
            this.trace('batchRevokeAllowances', allowanceIdentifiers, owner);
            useFeedbackStore().setLoading('batchRevokeAllowances');

            // allowanceIdentifiers are keyed like: `${row.spenderAddress}-${tokenAddress/collectionAddress}${ isSingleErc721 ? `-${tokenId}` : ''}`
            const allowanceIdentifiersAreValid = allowanceIdentifiers.every((allowanceIdentifier) => {
                const [spenderAddress, tokenAddress] = allowanceIdentifier.split('-');

                return spenderAddress && tokenAddress;
            });

            if (!allowanceIdentifiersAreValid) {
                useFeedbackStore().unsetLoading('batchRevokeAllowances');
                throw new Error('Invalid allowance identifiers');
            }

            const cancelToken = {
                isCancelled: false,
                cancel() {
                    this.isCancelled = true;
                },
            };

            // A helper function to execute tasks in succession
            async function revokeAllowancesSequentially(identifiers: string[]) {
                for (const [index, allowanceIdentifier] of identifiers.entries()) {
                    if (cancelToken.isCancelled) {
                        useFeedbackStore().unsetLoading('batchRevokeAllowances');
                        throw new Error('Operation cancelled by user');
                    }

                    const [spenderAddress, tokenAddress, tokenId] = allowanceIdentifier.split('-');
                    const allowanceInfo = useAllowancesStore().getAllowance(CURRENT_CONTEXT, spenderAddress, tokenAddress, tokenId || undefined);

                    if (!allowanceInfo) {
                        useFeedbackStore().unsetLoading('batchRevokeAllowances');
                        throw new Error('Allowance not found');
                    }

                    const isErc20Allowance = isErc20AllowanceRow(allowanceInfo);
                    const isSingleErc721Allowance = isErc721SingleAllowanceRow(allowanceInfo);
                    const isCollectionAllowance = isNftCollectionAllowanceRow(allowanceInfo);

                    const isAlreadyRevoked =
                        (isErc20Allowance && allowanceInfo.allowance.eq(0)) ||
                        ((isSingleErc721Allowance || isCollectionAllowance) && !allowanceInfo.allowed);

                    // if the allowance is already revoked, skip it
                    if (isAlreadyRevoked) {
                        revokeCompletedHandler(null, identifiers.length - (index + 1));
                        continue;
                    }

                    let tx: TransactionResponse | WriteContractResult;

                    try {
                        if (isErc20Allowance) {
                            tx = await useAllowancesStore().updateErc20Allowance(
                                owner,
                                allowanceInfo.spenderAddress,
                                allowanceInfo.tokenAddress,
                                BigNumber.from(0),
                            );
                        } else if (isSingleErc721Allowance) {
                            tx = await useAllowancesStore().updateSingleErc721Allowance(
                                owner,
                                allowanceInfo.spenderAddress,
                                allowanceInfo.collectionAddress,
                                allowanceInfo.tokenId,
                                false,
                            );
                        } else {
                            tx = await useAllowancesStore().updateNftCollectionAllowance(
                                owner,
                                allowanceInfo.spenderAddress,
                                allowanceInfo.collectionAddress,
                                false,
                            );
                        }

                        const { newResponse } = await subscribeForTransactionReceipt(useAccountStore().loggedAccount as AccountModel, tx);
                        await newResponse.wait();

                        revokeCompletedHandler(tx, identifiers.length - (index + 1));
                    } catch (error) {
                        useFeedbackStore().unsetLoading('batchRevokeAllowances');
                        console.error('Error cancelling allowance', error);
                        throw error;
                    }
                }

                useFeedbackStore().unsetLoading('batchRevokeAllowances');

                return Promise.resolve();
            }

            // Return the cancel token and the promise representing the task completion
            return {
                cancelToken,
                promise: revokeAllowancesSequentially(allowanceIdentifiers),
            };
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
        clearAllowances(label: Label) {
            this.trace('clearAllowances', label);
            this.__erc_20_allowances[label] = [];
            this.__erc_721_allowances[label] = [];
            this.__erc_1155_allowances[label] = [];
        },
        async fetchBalanceString(data: IndexerErc20AllowanceResult): Promise<string> {
            const indexer = (useChainStore().loggedChain.settings as EVMChainSettings).getIndexer();
            const results = (await indexer.get(`/v1/token/${data.contract}/holders?account=${data.owner}`)).data.results;
            if (results.length === 0) {
                return '0';
            } else {
                const balanceString = results[0].balance;
                return balanceString;
            }
        },
        async shapeErc20AllowanceRow(data: IndexerErc20AllowanceResult): Promise<ShapedAllowanceRowERC20 | null> {
            try {
                const spenderContract = await useContractStore().getContract(CURRENT_CONTEXT, data.spender);
                const tokenInfo = useTokensStore().__tokens[CURRENT_CONTEXT].find(token => token.address.toLowerCase() === data.contract.toLowerCase());

                const tokenContract = await useContractStore().getContract(CURRENT_CONTEXT, data.contract);

                const maxSupply = tokenContract?.maxSupply;

                const balancesStore = useBalancesStore();
                let balance = balancesStore.__balances[CURRENT_CONTEXT]?.find(
                    balance => balance.token.address.toLowerCase() === data.contract.toLowerCase(),
                )?.amount;

                if (!balance) {
                    const balanceString = await this.fetchBalanceString(data);
                    balance = BigNumber.from(balanceString);
                }

                if (!balance || !tokenInfo || !maxSupply) {
                    return null;
                }

                return {
                    lastUpdated: data.updated,
                    spenderAddress: data.spender,
                    spenderName: spenderContract?.name,
                    tokenName: tokenInfo.name,
                    tokenAddress: data.contract,
                    allowance: BigNumber.from(data.amount),
                    balance,
                    tokenDecimals: tokenInfo.decimals,
                    tokenMaxSupply: maxSupply,
                    tokenSymbol: tokenInfo.symbol,
                    tokenPrice: Number(tokenInfo.price.str),
                    tokenLogo: tokenInfo.logo,
                };
            } catch (e) {
                console.error('Error shaping ERC20 allowance row', e);
                return null;
            }
        },
        async shapeErc721AllowanceRow(data: IndexerErc721AllowanceResult): Promise<ShapedAllowanceRowSingleERC721 | ShapedAllowanceRowNftCollection | null> {
            // if the operator is the zero address, it means the allowance has been revoked;
            // we should hide it from the UI rather than showing it with operator '0x0000...0000'
            if (data.operator === ZERO_ADDRESS) {
                return null;
            }

            try {
                const operatorContract = await useContractStore().getContract(CURRENT_CONTEXT, data.operator);

                const commonAttributes = {
                    lastUpdated: data.updated,
                    spenderAddress: data.operator,
                    spenderName: operatorContract?.name,
                    allowed: data.approved,
                };

                if (data.single) {
                    const tokenId = String(data.tokenId);
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
                const indexer = (useChainStore().loggedChain.settings as EVMChainSettings).getIndexer();
                const balanceString = (await indexer.get(`/v1/token/${data.contract}/holders?account=${data.owner}`)).data.results[0].balance;

                const balance = BigNumber.from(balanceString);

                return collectionInfo ? {
                    ...commonAttributes,
                    collectionAddress: collectionInfo.address,
                    collectionName: collectionInfo.name,
                    balance,
                } : null;
            } catch(e) {
                console.error('Error shaping ERC721 allowance row', e);
                return null;
            }
        },
        async shapeErc1155AllowanceRow(data: IndexerErc1155AllowanceResult): Promise<ShapedAllowanceRowNftCollection | null> {
            try {
                const network = useChainStore().getChain(CURRENT_CONTEXT).settings.getNetwork();
                const nftsStore = useNftsStore();

                const operatorContract = await useContractStore().getContract(CURRENT_CONTEXT, data.operator);
                const collectionInfo = await useContractStore().getContract(CURRENT_CONTEXT, data.contract);
                await nftsStore.fetchNftsFromCollection(CURRENT_CONTEXT, data.contract);
                const collectionNftIds = (nftsStore.__contracts[network][data.contract.toLowerCase()]?.list ?? []).map(nft => nft.id);

                if (collectionNftIds.length === 0) {
                    console.error(`Collection ${data.contract} has no NFTs`);

                    return null;
                }

                const indexer = (useChainStore().loggedChain.settings as EVMChainSettings).getIndexer();
                const holderInfoForOwner = (await indexer.get(`/v1/token/${data.contract}/holders?account=${data.owner}&limit=${ALLOWANCES_LIMIT}`)).data.results as { balance: string }[];
                const totalNftsOwned = holderInfoForOwner.reduce((acc, holderInfo) => acc.add(holderInfo.balance), BigNumber.from(0));

                return collectionInfo ? {
                    lastUpdated: data.updated,
                    spenderAddress: data.operator,
                    spenderName: operatorContract?.name,
                    allowed: data.approved,
                    collectionAddress: collectionInfo.address,
                    collectionName: collectionInfo.name,
                    balance: totalNftsOwned,
                } : null;
            } catch(e) {
                console.error('Error shaping ERC1155 allowance row', e);
                return null;
            }
        },
        async subscribeForTransactionReceipt(account: AccountModel, response: TransactionResponse): Promise<TransactionResponse> {
            this.trace('subscribeForTransactionReceipt', account.account, response.hash);
            return subscribeForTransactionReceipt(account, response).then(({ newResponse, receipt }) => {
                newResponse.wait().then(() => {
                    this.trace('subscribeForTransactionReceipt', newResponse.hash, 'receipt:', receipt.status, receipt);
                    setTimeout(() => {
                        useAllowancesStore().fetchAllowancesForAccount(account.account);
                    }, 3000); // give the indexer time to update allowance data
                });
                return newResponse;
            });
        },
    },
});


const allowancesInitialState: AllowancesState = {
    __erc_20_allowances: {},
    __erc_721_allowances: {},
    __erc_1155_allowances: {},
};
