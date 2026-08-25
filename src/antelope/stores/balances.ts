/**
 * Balances: This store is responsible for managing liquid balances (both retrieving
 * and listing balances, as well as executing transfers) for the accounts set in the
 * Account store.
 *
 * To achieve this, it communicates with the Chain and Tokens stores to obtain a list of
 * known tokens within the network to which the account belongs.
 *
 * Whenever the logged account or the current account changes in the store, the
 * corresponding handlers are called to update the balances for that account and make
 * them available for local querying.
 */

import { defineStore } from 'pinia';
import {
    EvmTransactionResponse,
    Label,
    TokenMarketData,
    MarketSourceInfo,
    NativeTransactionResponse,
    TokenBalance,
    TokenClass,
    TransactionResponse,
    EvmABI,
    addressString,
    AntelopeError,
} from 'src/antelope/types';
import { createTraceFunction } from 'src/antelope/config';
import NativeChainSettings from 'src/antelope/chains/NativeChainSettings';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { formatWei } from 'src/antelope/stores/utils';
import { BigNumber, ethers } from 'ethers';
import { toRaw } from 'vue';
import {
    SendTransactionResult,
    prepareSendTransaction,
    prepareWriteContract,
    PrepareSendTransactionResult,
    PrepareWriteContractResult,
} from '@wagmi/core';
import { AccountModel, EvmAccountModel } from 'src/antelope/stores/account';
import { EVMAuthenticator } from 'src/antelope/wallets';
import { filter } from 'rxjs';
import { convertCurrency } from 'src/antelope/stores/utils/currency-utils';
import { subscribeForTransactionReceipt } from 'src/antelope/stores/utils/trx-utils';

// dependencies --
import {
    CURRENT_CONTEXT,
    getAntelope,
    useAccountStore,
    useFeedbackStore,
    useChainStore,
    useContractStore,
} from 'src/antelope';

export interface BalancesState {
    __balances:  { [label: Label]: TokenBalance[] };
    __wagmiSystemTokenTransferConfig: { [label: Label]: PrepareSendTransactionResult | null };
    __wagmiTokenTransferConfig: { [label: Label]: PrepareWriteContractResult<EvmABI, 'transfer', number> | null };
}

const store_name = 'balances';

export const useBalancesStore = defineStore(store_name, {
    state: (): BalancesState => (balancesInitialState),
    getters: {
        loggedBalances: state => state.__balances[CURRENT_CONTEXT] ?? [],
        currentBalances: state => state.__balances[CURRENT_CONTEXT] ?? [],
        getBalances: state => (label: string) => state.__balances[label] ?? [],
    },
    actions: {
        trace: createTraceFunction(store_name),
        init: () => {
            const balanceStore = useBalancesStore();
            const ant = getAntelope();
            ant.events.onAccountChanged.pipe(
                filter(({ label, account }) => !!label && !!account),
            ).subscribe({
                next: async ({ label, account }) => {
                    if (label === CURRENT_CONTEXT) {
                        await balanceStore.updateBalancesForAccount(label, toRaw(account));
                    }
                },
            });

            // update logged balances every 10 seconds
            setInterval(async () => {
                if (balanceStore.__balances[CURRENT_CONTEXT]) {
                    await balanceStore.updateBalancesForAccount(CURRENT_CONTEXT, useAccountStore().loggedAccount);
                }
            }, 10000);

            ant.events.onClear.subscribe(({ label }) => balanceStore.clearBalances(label));
        },
        async updateBalances(label: string) {
            this.trace('updateBalances', label);
            const account = useAccountStore().getAccount(label);
            if (account) {
                await this.updateBalancesForAccount(label, account);
            }
        },
        async updateBalancesForAccount(label: string, account: AccountModel | null) {
            this.trace('updateBalancesForAccount', label, account);
            try {
                useFeedbackStore().setLoading('updateBalancesForAccount');
                const chain = useChainStore().getChain(label);
                if (chain.settings.isNative()) {
                    const chain_settings = chain.settings as NativeChainSettings;
                    if (account?.account) {
                        this.__balances[label] = await chain_settings.getBalances(account.account);
                        useFeedbackStore().unsetLoading('updateBalancesForAccount');
                    }
                } else {
                    const chain_settings = chain.settings as EVMChainSettings;
                    if (account?.account) {

                        // first we assert that the balances array exists and is the same until the user changes
                        this.__balances[label] = this.__balances[label] ?? [];

                        // then we wait for the chain indexer to be consulted at least once
                        this.trace('updateBalancesForAccount', 'await chain_settings.initialized()');
                        await chain_settings.initialized();

                        // if the chain index is healthy, we use it to fetch the all the balances at once
                        if (chain_settings.isIndexerHealthy()) {
                            this.trace('updateBalancesForAccount', 'Indexer OK!');

                            // Workaround-WTLOS: to fix the WTLOS balance while the indexer is not doing it after a successful withdraw (unwrap)
                            // We need to get the value ready to overwrite immediately and therefore avoid the blink
                            const wrapTokens = chain_settings.getWrappedSystemToken();
                            const authenticator = account.authenticator as EVMAuthenticator;
                            const wrapBalance = await authenticator.getERC20TokenBalance(account.account, wrapTokens.address as addressString);

                            // Workaround-STLOS: fetch STLOS balance directly from contract (Blockscout may not have indexed it)
                            const stakedToken = chain_settings.getStakedSystemToken();
                            let stakedBalance = BigNumber.from(0);
                            try {
                                stakedBalance = await authenticator.getERC20TokenBalance(account.account, stakedToken.address as addressString);
                            } catch (e) {
                                console.warn('Failed to fetch STLOS balance from contract:', e);
                            }

                            // Fetch native TLOS balance from RPC (Blockscout only returns ERC-20 balances)
                            await this.updateSystemBalanceForAccount(label, account.account as addressString);

                            // now we call the indexer for ERC-20 balances
                            const newBalances = await chain_settings.getBalances(account.account);

                            if (this.__balances[label].length === 0) {
                                // we add all system tokens with balance zero to the balances array to make sure they all always appear
                                const systemTokens = chain_settings.getSystemTokens();
                                systemTokens.forEach((token) => {
                                    const balance = newBalances.find(b => b.token.id === token.id);
                                    if (!balance) {
                                        this.addNewBalance(label, new TokenBalance(token, BigNumber.from(0)));
                                    }
                                });
                            }

                            // we update the existing balances array with the new balances
                            newBalances.forEach((balance) => {
                                this.processBalanceForToken(label, balance.token, balance.amount);
                            });

                            // Workaround-WTLOS: now we overwrite the value with the one taken from the contract
                            this.processBalanceForToken(label, wrapTokens, wrapBalance);

                            // Workaround-STLOS: overwrite with contract-fetched balance
                            this.processBalanceForToken(label, stakedToken, stakedBalance);

                            this.sortBalances(label);

                            useFeedbackStore().unsetLoading('updateBalancesForAccount');
                        } else {
                            this.trace('updateBalancesForAccount', 'Indexer is NOT healthy!', chain_settings.getNetwork(), toRaw(chain_settings.indexerHealthState));
                            // In case the chain does not support index, we need to fetch the balances using Web3
                            await this.updateSystemTokensPrices(label);
                            this.trace('updateBalancesForAccount', 'chain_settings.getTokenList()');
                            const tokens = await chain_settings.getTokenList();
                            await this.updateSystemBalanceForAccount(label, account.account as addressString);
                            this.trace('updateBalancesForAccount', 'tokens:', toRaw(tokens));

                            const authenticator = account.authenticator as EVMAuthenticator;
                            const promises = tokens
                                .filter(token => token.address !== chain_settings.getSystemToken().address)
                                .map(token => authenticator.getERC20TokenBalance(account.account, token.address as addressString)
                                    .then((balanceBn: BigNumber) => {
                                        this.processBalanceForToken(label, token, balanceBn);
                                    }).catch((error) => {
                                        console.error(error);
                                    }),
                                );

                            Promise.allSettled(promises).then(() => {
                                useFeedbackStore().unsetLoading('updateBalancesForAccount');
                                this.trace('updateBalancesForAccount', 'balances:', toRaw(this.__balances[label]));
                            });
                        }
                    }
                }
            } catch (error) {
                useFeedbackStore().unsetLoading('updateBalancesForAccount');
                console.error('Error: ', error);
            }
        },
        async updateSystemTokensPrices(label: string): Promise<void> {
            this.trace('updateSystemTokensPrices', label);
            try {
                // take the three system tokens
                const chain = useChainStore();
                const chain_settings = chain.getChain(label).settings as EVMChainSettings;
                const sysToken = chain_settings.getSystemToken();
                const wrpToken = chain_settings.getWrappedSystemToken();
                const stkToken = chain_settings.getStakedSystemToken();

                // get the price for both system and wrapped tokens
                this.trace('updateSystemTokensPrices', 'await chain_settings.getUsdPrice()');
                const price = (await chain_settings.getUsdPrice()).toString();
                this.trace('updateSystemTokensPrices', 'price:', price);
                const marketInfo = { price } as MarketSourceInfo;
                sysToken.market = new TokenMarketData(marketInfo);
                wrpToken.market = new TokenMarketData(marketInfo);

                // Now we preview a deposit of 1 SYS to get the ratio
                const oneSys = ethers.utils.parseUnits('1.0', sysToken.decimals);

                const ratio:BigNumber = await chain.getStakedRatio(label);
                const ratioNumber = ethers.utils.formatUnits(ratio, stkToken.decimals);

                // only if the ratio is not zero, we update the STK token price
                if (!ratio.isZero() && !ratio.isNegative()) {

                    // Now we calculate the price of 1 STK = (price of 1 SYS) / ratio
                    const stkPrice = convertCurrency(oneSys, sysToken.decimals, stkToken.decimals, ratioNumber);
                    const stkPriceNumber = ethers.utils.formatUnits(stkPrice, sysToken.decimals);

                    // Finally we update the STK token price
                    const stkMarketInfo = { price:stkPriceNumber } as MarketSourceInfo;
                    // TODO: this is removed until we decide what to do whith the STK token price
                    // https://github.com/telosnetwork/telos-wallet/issues/544
                    // stkToken.market = new TokenMarketData(stkMarketInfo);
                    this.trace('updateSystemTokensPrices', `STLOS price: ${toRaw(stkMarketInfo)}`);
                }

            } catch (error) {
                console.error(error);
                // we won't thorw an error here, as it is not critical
            }
        },
        async updateSystemBalanceForAccount(label: string, address: addressString): Promise<void> {
            try {
                this.trace('updateSystemBalanceForAccount', label, address);
                const chain_settings = useChainStore().getChain(label).settings as EVMChainSettings;
                const sys_token = chain_settings.getSystemToken();
                const price = (await chain_settings.getUsdPrice()).toString();
                const marketInfo = { price } as MarketSourceInfo;
                sys_token.market = new TokenMarketData(marketInfo);
                const accountStore = useAccountStore();
                const authenticator = accountStore.getEVMAuthenticator(label);
                const balanceBn = await authenticator.getSystemTokenBalance(address);
                this.processBalanceForToken(label, sys_token, balanceBn);
            } catch (error) {
                console.error(error);
                throw getAntelope().config.transactionError('antelope.evm.error_update_system_balance_failed', error);
            }
        },
        shouldAddTokenBalance(label: string, balanceBn: BigNumber, token: TokenClass): boolean {
            const importantTokens = useChainStore().getChain(label).settings.getSystemTokens();
            let result = false;
            if (importantTokens.map(t => t.id).includes(token.id)) {
                // if the token is important, we always add it. Even with 0 balance.
                result = true;
            } else {
                result = !balanceBn.isNegative() && !balanceBn.isZero();
            }
            this.trace('shouldAddTokenBalance', label, ethers.utils.formatUnits(balanceBn, token.decimals), token.symbol, '=>', result);
            return result;
        },
        processBalanceForToken(label: string, token: TokenClass, balanceBn: BigNumber): void {
            try {
                const tokenBalance = new TokenBalance(token, balanceBn);
                if (this.shouldAddTokenBalance(label, balanceBn, token)) {
                    this.addNewBalance(label, tokenBalance);
                } else {
                    this.removeBalance(label, tokenBalance);
                }
            } catch (error) {
                console.error(error, [label, token, balanceBn]);
            }
        },
        async subscribeForTransactionReceipt(account: AccountModel, response: TransactionResponse): Promise<TransactionResponse> {
            this.trace('subscribeForTransactionReceipt', account.account, response.hash);
            return subscribeForTransactionReceipt(account, response).then(({ newResponse, receipt }) => {
                newResponse.wait().then(() => {
                    this.trace('subscribeForTransactionReceipt', newResponse.hash, 'receipt:', receipt.status, receipt);
                    this.updateBalancesForAccount(CURRENT_CONTEXT, account);
                });
                return newResponse;
            });
        },
        async prepareWagmiSystemTokenTransferConfig(label: Label, to: string, amount: bigint): Promise<void> {
            const request = await prepareSendTransaction({
                to,
                value: amount,
                chainId: +useChainStore().getChain(label).settings.getChainId(),
            });

            this.setWagmiSystemTokenTransferConfig(request, label);
            this.setWagmiTokenTransferConfig(null, label);
        },
        async prepareWagmiTokenTransferConfig(label: Label, token: TokenClass, to: string, amount: BigNumber): Promise<void> {
            const config = (await prepareWriteContract({
                address: token.address as addressString,
                abi: useContractStore().getTokenABI(token.type),
                functionName: 'transfer',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                args: [to, amount] as any[],
            })) as PrepareWriteContractResult<EvmABI, 'transfer', number>;

            this.setWagmiTokenTransferConfig(config, label);
            this.setWagmiSystemTokenTransferConfig(null, label);
        },
        async transferTokens(token: TokenClass, to: addressString, amount: BigNumber, memo?: string): Promise<TransactionResponse> {
            const funcname = 'transferTokens';
            this.trace(funcname, token, to, amount.toString(), memo);
            const label = CURRENT_CONTEXT;
            let promise = Promise.resolve({} as TransactionResponse);
            try {
                useFeedbackStore().setLoading(funcname);
                const chain = useChainStore().loggedChain;
                if (chain.settings.isNative()) {
                    const chain_settings = chain.settings as NativeChainSettings;
                    const account = useAccountStore().loggedAccount;
                    promise = this.transferNativeTokens(chain_settings, account, token, to, amount, memo ?? '')
                        .then(r => this.subscribeForTransactionReceipt(account, r));
                } else {
                    const chain_settings = chain.settings as EVMChainSettings;
                    const account = useAccountStore().loggedAccount as EvmAccountModel;
                    promise = this.transferEVMTokens(label, chain_settings, account, token, to, amount)
                        .then(r => this.subscribeForTransactionReceipt(account, r as TransactionResponse));
                }
                promise.catch((error) => {
                    const trxError = getAntelope().config.transactionError('antelope.evm.error_transfer_failed', error);
                    getAntelope().config.transactionErrorHandler(trxError, funcname);
                    throw trxError;
                });
                return promise;
            } catch (error) {
                const trxError = getAntelope().config.transactionError('antelope.evm.error_transfer_failed', error);
                getAntelope().config.transactionErrorHandler(trxError, funcname);
                throw trxError;
            } finally {
                useFeedbackStore().unsetLoading(funcname);
                await useBalancesStore().updateBalancesForAccount(label, toRaw(useAccountStore().loggedAccount));
            }
        },
        async wrapSystemTokens(amount: BigNumber): Promise<TransactionResponse> {
            const funcname = 'wrapSystemTokens';
            this.trace(funcname, amount.toString());
            const label = CURRENT_CONTEXT;
            try {
                useFeedbackStore().setLoading(funcname);
                const chain = useChainStore().loggedChain;
                if (chain.settings.isNative()) {
                    console.error('ERROR: wrap not supported on native');
                    throw new AntelopeError('antelope.evm.error_wrap_not_supported_on_native');
                } else {
                    const account = useAccountStore().loggedAccount as EvmAccountModel;
                    const authenticator = useAccountStore().getEVMAuthenticator(label);
                    return await authenticator.wrapSystemToken(amount)
                        .then(r => this.subscribeForTransactionReceipt(account, r as TransactionResponse));
                }
            } catch (error) {
                const trxError = getAntelope().config.transactionError('antelope.evm.error_wrap_failed', error);
                getAntelope().config.transactionErrorHandler(trxError, funcname);
                throw trxError;
            } finally {
                useFeedbackStore().unsetLoading(funcname);
            }
        },
        async unwrapSystemTokens(amount: BigNumber): Promise<TransactionResponse> {
            const funcname = 'unwrapSystemTokens';
            this.trace(funcname, amount.toString());
            const label = CURRENT_CONTEXT;
            try {
                useFeedbackStore().setLoading(funcname);
                const chain = useChainStore().loggedChain;
                if (chain.settings.isNative()) {
                    console.error('ERROR: unwrap not supported on native');
                    throw new AntelopeError('antelope.evm.error_unwrap_not_supported_on_native');
                } else {
                    const account = useAccountStore().loggedAccount as EvmAccountModel;
                    const authenticator = useAccountStore().getEVMAuthenticator(label);
                    return await authenticator.unwrapSystemToken(amount)
                        .then(r => this.subscribeForTransactionReceipt(account, r as TransactionResponse));
                }
            } catch (error) {
                const trxError = getAntelope().config.transactionError('antelope.evm.error_unwrap_failed', error);
                getAntelope().config.transactionErrorHandler(trxError, funcname);
                throw trxError;
            } finally {
                useFeedbackStore().unsetLoading(funcname);
            }
        },
        async transferNativeTokens(
            settings: NativeChainSettings,
            account: AccountModel,
            token: TokenClass,
            to: string,
            amount: BigNumber,
            memo: string,
        ): Promise<NativeTransactionResponse> {
            this.trace('transferNativeTokens', settings, account, token, to, amount.toString(), memo);
            try {
                useFeedbackStore().setLoading('transferNativeTokens');
                return useAccountStore().sendAction({
                    name: 'transfer',
                    account: token.contract,
                    data: {
                        from: account.account,
                        to,
                        quantity: `${formatWei(amount, token.precision)} ${token.symbol}`,
                        memo,
                    },
                    actor: account.account,
                    permission: 'active',
                });
            } catch (error) {
                console.error(error);
                throw getAntelope().config.transactionError('antelope.evm.error_transfer_failed', error);
            } finally {
                useFeedbackStore().unsetLoading('transferNativeTokens');
            }
        },
        async transferEVMTokens(
            label: Label,
            settings: EVMChainSettings,
            account: EvmAccountModel,
            token: TokenClass,
            to: addressString,
            amount: BigNumber,
        ): Promise<EvmTransactionResponse | SendTransactionResult> {
            this.trace('transferEVMTokens', settings, account, token, to, amount.toString());
            try {
                useFeedbackStore().setLoading('transferEVMTokens');
                const result = await account.authenticator.transferTokens(token, amount, to);
                return result as EvmTransactionResponse | SendTransactionResult;
            } catch (error) {
                console.error(error);
                throw getAntelope().config.transactionError('antelope.evm.error_transfer_failed', error);
            } finally {
                useFeedbackStore().unsetLoading('transferEVMTokens');
            }
        },
        // sorting ----------
        splitTokensBasedOnHasFiatValue(tokens: TokenBalance[]): [TokenBalance[], TokenBalance[]] {
            const tokenHasFiatValue = (balance: TokenBalance) => balance.token.price.isAvailable;

            const sortByFiatValue = (b1: TokenBalance, b2: TokenBalance) => {
                const fiatValueOne = b1.token.price.getAmountInFiat(b1.balance);
                const fiatValueTwo = b2.token.price.getAmountInFiat(b2.balance);
                return fiatValueOne.gt(fiatValueTwo) ? -1 : 1;
            };

            const sortByTokenBalance = (b1: TokenBalance, b2: TokenBalance) => b1.balance.gt(b2.balance) ? -1 : 1;

            const tokensWithFiatValue   = tokens.filter(token => tokenHasFiatValue(token)).sort(sortByFiatValue);
            const tokensWithNoFiatValue = tokens.filter(token => !tokenHasFiatValue(token)).sort(sortByTokenBalance);

            // always show all tokens with fiat values before all tokens without
            return [tokensWithFiatValue, tokensWithNoFiatValue];
        },
        sortBalances(label: string): void {
            this.trace('sortBalances', label);
            const allTokens = this.__balances[label] as TokenBalance[];
            const systemTokenBalance = allTokens.filter(b => b.token.isSystem);
            const erc20TokenBalances = allTokens.filter(b => !b.token.isSystem);

            const [tokensWithFiatValue, tokensWithoutFiatValue] = this.splitTokensBasedOnHasFiatValue(erc20TokenBalances);
            this.__balances[label] = [
                ...systemTokenBalance,
                ...tokensWithFiatValue,
                ...tokensWithoutFiatValue,
            ];
        },
        // commits -----
        addNewBalance(label: string, balance: TokenBalance): void {
            this.trace('addNewBalance', label, balance);
            // if the balance already exists, we update it, if not, we add it
            if (this.__balances[label].find(b => b.token.id === balance.token.id)) {
                this.updateBalance(label, balance);
            } else {
                this.__balances[label] = [...this.__balances[label], balance];
                this.sortBalances(label);
            }
        },
        updateBalance(label: string, balance: TokenBalance): void {
            this.trace('updateBalance', label, balance.str, balance.token.symbol);
            const index = this.__balances[label].findIndex(b => b.token.id === balance.token.id);
            if (index >= 0) {
                if (
                    !balance.amount.eq(this.__balances[label][index].amount)
                ) {
                    this.__balances[label][index].balance = balance.amount;
                    this.sortBalances(label);
                }
            }
        },
        removeBalance(label: string, balance: TokenBalance): void {
            this.trace('removeBalance', label, balance);
            const index = this.__balances[label].findIndex(b => b.token.id === balance.token.id);
            if (index >= 0) {
                this.__balances[label].splice(index, 1);
            }
        },
        clearAllWagmiTokenTransferConfigs(label: Label) {
            this.trace('clearAllWagmiTokenTransferConfigs', label);

            this.setWagmiSystemTokenTransferConfig(null, label);
            this.setWagmiTokenTransferConfig(null, label);
        },
        setWagmiSystemTokenTransferConfig(config: PrepareSendTransactionResult | null, label: Label) {
            this.trace('setWagmiSystemTokenTransferConfig', config, label);

            this.__wagmiSystemTokenTransferConfig[label] = config;
        },
        setWagmiTokenTransferConfig(config: PrepareWriteContractResult<EvmABI, 'transfer', number> | null, label: Label) {
            this.trace('setWagmiTokenTransferConfig', config, label);

            this.__wagmiTokenTransferConfig[label] = config;
        },
        clearBalances(label: Label) {
            this.trace('clearBalances', label);
            this.__balances[label] = [];
        },
    },
});

const balancesInitialState: BalancesState = {
    __balances: {},
    __wagmiSystemTokenTransferConfig: {
        current: null,
        logged: null,
    },
    __wagmiTokenTransferConfig: {
        current: null,
        logged: null,
    },
};
