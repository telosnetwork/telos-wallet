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
import { createTraceFunction, isTracingAll } from 'src/antelope/stores/feedback';
import NativeChainSettings from 'src/antelope/chains/NativeChainSettings';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import {
    getAntelope,
    useAccountStore,
    useFeedbackStore,
    useChainStore,
    useEVMStore,
    usePlatformStore,
} from 'src/antelope';
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

export interface BalancesState {
    __balances:  { [label: Label]: TokenBalance[] };
    __wagmiSystemTokenTransferConfig: { [label: Label]: PrepareSendTransactionResult | null };
    __wagmiTokenTransferConfig: { [label: Label]: PrepareWriteContractResult<EvmABI, 'transfer', number> | null };
}

const store_name = 'balances';

export const useBalancesStore = defineStore(store_name, {
    state: (): BalancesState => (balancesInitialState),
    getters: {
        loggedBalances: state => state.__balances['logged'] ?? [],
        currentBalances: state => state.__balances['current'] ?? [],
        getBalances: state => (label: string) => state.__balances[label] ?? [],
    },
    actions: {
        trace: createTraceFunction(store_name),
        init: () => {
            useFeedbackStore().setDebug(store_name, isTracingAll());
            getAntelope().events.onAccountChanged.pipe(
                filter(({ label, account }) => !!label && !!account),
            ).subscribe({
                next: async ({ label, account }) => {
                    await useBalancesStore().updateBalancesForAccount(label, toRaw(account));
                },
            });

            // update logged balances every 10 seconds only if the user is logged
            setInterval(async () => {
                if (useAccountStore().loggedAccount) {
                    await useBalancesStore().updateBalancesForAccount('logged', useAccountStore().loggedAccount);
                }
            }, 10000);

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
                        if (chain_settings.isIndexerHealthy()) {
                            this.trace('updateBalancesForAccount', 'Indexer OK!');
                            if (account?.account) {
                                this.__balances[label] = await chain_settings.getBalances(account.account);
                                // if new account with no index records display default zero TLOS balance
                                if (this.__balances[label].length === 0){
                                    await this.updateSystemBalanceForAccount(label, account.account as addressString);
                                }
                                this.sortBalances(label);
                                useFeedbackStore().unsetLoading('updateBalancesForAccount');
                            }
                        } else {
                            this.trace('updateBalancesForAccount', 'Indexer is NOT healthy!', chain_settings.getNetwork(), toRaw(chain_settings.indexerHealthState));
                            // In case the chain does not support index, we need to fetch the balances using Web3
                            this.__balances[label] = this.__balances[label] ?? [];
                            const tokens = await chain_settings.getTokenList();
                            await this.updateSystemBalanceForAccount(label, account.account as addressString);
                            this.trace('updateBalancesForAccount', 'tokens:', toRaw(tokens));

                            const authenticator = account.authenticator as EVMAuthenticator;
                            const promises = tokens
                                .map(token => authenticator.getERC20TokenBalance(account.account, token.address)
                                    .then((balanceBn: BigNumber) => {
                                        this.processBalanceForToken(label, token, balanceBn);
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

        async updateSystemBalanceForAccount(label: string, address: addressString): Promise<void> {
            const chain_settings = useChainStore().getChain(label).settings as EVMChainSettings;
            const token = chain_settings.getSystemToken();
            const price = (await chain_settings.getUsdPrice()).toString();
            const marketInfo = { price } as MarketSourceInfo;
            const marketData = new TokenMarketData(marketInfo);
            token.market = marketData;

            const balanceBn = await useAccountStore().getEVMAuthenticator(label)?.getSystemTokenBalance(address);
            this.processBalanceForToken(label, token, balanceBn);
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
            const tokenBalance = new TokenBalance(token, balanceBn);
            if (this.shouldAddTokenBalance(label, balanceBn, token)) {
                this.addNewBalance(label, tokenBalance);
            } else {
                this.removeBalance(label, tokenBalance);
            }
        },
        async subscribeForTransactionReceipt(account: AccountModel, response: TransactionResponse): Promise<TransactionResponse> {
            this.trace('subscribeForTransactionReceipt', response.hash);
            if (account.isNative) {
                throw new AntelopeError('Not implemented yet for native');
            } else {
                const authenticator = account.authenticator as EVMAuthenticator;
                const provider = await authenticator.web3Provider();
                if (provider) {
                    // instead of await, we use then() to return the response immediately
                    // and perform the balance update in the background
                    const whenConfirmed = provider.waitForTransaction(response.hash).then((receipt: ethers.providers.TransactionReceipt) => {
                        this.trace('subscribeForTransactionReceipt', response.hash, 'receipt:', receipt.status, receipt);
                        if (receipt.status === 1) {
                            const account = useAccountStore().loggedAccount;
                            if (account?.account) {
                                this.updateBalancesForAccount('logged', account);
                            }
                        }
                        return receipt;
                    });
                    // we add the wait method to the response,
                    // so that the caller can subscribe to the confirmation event
                    response.wait = async () => whenConfirmed;
                } else {
                    // TODO: mobile fix
                    if (usePlatformStore().isMobile) {
                        response.wait = async () => Promise.resolve({} as ethers.providers.TransactionReceipt);
                    } else {
                        throw new AntelopeError('antelope.evm.error_no_provider');
                    }
                }
            }
            return response;
        },
        async prepareWagmiSystemTokenTransferConfig(label: Label, to: string, amount: BigNumber): Promise<void> {
            const config = await prepareSendTransaction({
                request: {
                    to,
                    value: amount,
                },
            });

            this.setWagmiSystemTokenTransferConfig(config, label);
            this.setWagmiTokenTransferConfig(null, label);
        },
        async prepareWagmiTokenTransferConfig(label: Label, token: TokenClass, to: string, amount: BigNumber): Promise<void> {
            const config = (await prepareWriteContract({
                address: token.address as addressString,
                abi: useEVMStore().getTokenABI(token.type),
                functionName: 'transfer',
                args: [to, amount],
            })) as PrepareWriteContractResult<EvmABI, 'transfer', number>;

            this.setWagmiTokenTransferConfig(config, label);
            this.setWagmiSystemTokenTransferConfig(null, label);
        },
        async transferTokens(token: TokenClass, to: string, amount: BigNumber, memo?: string): Promise<TransactionResponse> {
            this.trace('transferTokens', token, to, amount.toString(), memo);
            const label = 'logged';
            try {
                useFeedbackStore().setLoading('transferTokens');
                const chain = useChainStore().loggedChain;
                if (chain.settings.isNative()) {
                    const chain_settings = chain.settings as NativeChainSettings;
                    const account = useAccountStore().loggedAccount;
                    return await this.transferNativeTokens(chain_settings, account, token, to, amount, memo ?? '')
                        .then(r => this.subscribeForTransactionReceipt(account, r));
                } else {
                    const chain_settings = chain.settings as EVMChainSettings;
                    const account = useAccountStore().loggedAccount as EvmAccountModel;
                    return await this.transferEVMTokens(label, chain_settings, account, token, to, amount)
                        .then(r => this.subscribeForTransactionReceipt(account, r));
                }
            } catch (error) {
                console.error(error);
                throw getAntelope().config.wrapError('antelope.evm.error_transfer_failed', error);
            } finally {
                useFeedbackStore().unsetLoading('transferTokens');
                await useBalancesStore().updateBalancesForAccount(label, toRaw(useAccountStore().loggedAccount));
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
                throw getAntelope().config.wrapError('antelope.evm.error_transfer_failed', error);
            } finally {
                useFeedbackStore().unsetLoading('transferNativeTokens');
            }
        },
        async transferEVMTokens(
            label: Label,
            settings: EVMChainSettings,
            account: EvmAccountModel,
            token: TokenClass,
            to: string,
            amount: BigNumber,
        ): Promise<EvmTransactionResponse | SendTransactionResult> {
            this.trace('transferEVMTokens', settings, account, token, to, amount.toString());

            try {
                useFeedbackStore().setLoading('transferEVMTokens');
                return await account.authenticator.transferTokens(token, amount, to);
            } catch (error) {
                console.error(error);
                throw getAntelope().config.wrapError('antelope.evm.error_transfer_failed', error);
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
            const [tokensWithFiatValue, tokensWithoutFiatValue] = this.splitTokensBasedOnHasFiatValue(allTokens);
            this.__balances[label] = [
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
                if (useAccountStore().currentIsLogged && label === 'current') {
                    this.__balances['logged'] = this.__balances[label];
                }
            }
        },
        updateBalance(label: string, balance: TokenBalance): void {
            this.trace('updateBalance', label, balance);
            const index = this.__balances[label].findIndex(b => b.token.id === balance.token.id);
            if (index >= 0) {
                if (
                    !balance.amount.eq(this.__balances[label][index].amount)
                ) {
                    this.__balances[label][index].balance = balance.amount;
                    this.sortBalances(label);
                    if (useAccountStore().currentIsLogged && label === 'current') {
                        this.__balances['logged'] = this.__balances[label];
                    }
                }
            }
        },
        removeBalance(label: string, balance: TokenBalance): void {
            this.trace('removeBalance', label, balance);
            const index = this.__balances[label].findIndex(b => b.token.id === balance.token.id);
            if (index >= 0) {
                this.__balances[label].splice(index, 1);
            }
            if (useAccountStore().currentIsLogged && label === 'current') {
                this.__balances['logged'] = this.__balances[label];
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
