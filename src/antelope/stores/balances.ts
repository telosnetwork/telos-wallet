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
import { convertCurrency } from 'src/antelope/stores/utils/currency-utils';

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
                    if (label === 'current') {
                        await useBalancesStore().updateBalancesForAccount(label, toRaw(account));
                    }
                },
            });

            // update logged balances every 10 seconds
            setInterval(async () => {
                await useBalancesStore().updateBalancesForAccount('current', useAccountStore().loggedAccount);
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

                        // first we assert that the balances array exists and is the same until the user changes
                        this.__balances[label] = this.__balances[label] ?? [];

                        // then we wait for the chain indexer to be consulted at least once
                        this.trace('updateBalancesForAccount', 'await chain_settings.initialized()');
                        await chain_settings.initialized();

                        // if the chain index is healthy, we use it to fetch the all the balances at once
                        if (chain_settings.isIndexerHealthy()) {
                            this.trace('updateBalancesForAccount', 'Indexer OK!');
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
                            this.sortBalances(label);

                            useFeedbackStore().unsetLoading('updateBalancesForAccount');
                        } else {
                            this.trace('updateBalancesForAccount', 'Indexer is NOT healthy!', chain_settings.getNetwork(), toRaw(chain_settings.indexerHealthState));
                            // In case the chain does not support index, we need to fetch the balances using Web3
                            await this.updateSystemTokensPrices(label);
                            const tokens = await chain_settings.getTokenList();
                            await this.updateSystemBalanceForAccount(label, account.account as addressString);
                            this.trace('updateBalancesForAccount', 'tokens:', toRaw(tokens));

                            const authenticator = account.authenticator as EVMAuthenticator;
                            const promises = tokens
                                .filter(token => token.address !== chain_settings.getSystemToken().address)
                                .map(token => authenticator.getERC20TokenBalance(account.account, token.address)
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
                const chain_settings = useChainStore().getChain(label).settings as EVMChainSettings;
                const sysToken = chain_settings.getSystemToken();
                const wrpToken = chain_settings.getWrappedSystemToken();
                const stkToken = chain_settings.getStakedSystemToken();

                // get the price for both system and wrapped tokens
                const price = (await chain_settings.getUsdPrice()).toString();
                const marketInfo = { price } as MarketSourceInfo;
                sysToken.market = new TokenMarketData(marketInfo);
                wrpToken.market = new TokenMarketData(marketInfo);

                // first we need the contract instance to be able to execute queries
                const evm = useEVMStore();
                const authenticator = useAccountStore().getEVMAuthenticator(label);
                const contract = await evm.getContract(authenticator, stkToken.address, stkToken.type);
                if (!contract) {
                    throw new AntelopeError('antelope.balances.error_token_contract_not_found', { address: stkToken.address });
                }
                const contractInstance = await contract.getContractInstance();

                // Now we preview a deposit of 1 SYS to get the ratio
                const oneSys = ethers.utils.parseUnits('1.0', sysToken.decimals);
                const ratio:BigNumber = await contractInstance.previewDeposit(oneSys);
                const ratioNumber = ethers.utils.formatUnits(ratio, stkToken.decimals);

                // Now we calculate the price of 1 STK = (price of 1 SYS) / ratio
                const stkPrice = convertCurrency(oneSys, sysToken.decimals, stkToken.decimals, ratioNumber);
                const stkPriceNumber = ethers.utils.formatUnits(stkPrice, sysToken.decimals);

                // Finally we update the STK token price
                const stkMarketInfo = { price:stkPriceNumber } as MarketSourceInfo;
                // TODO: this is removed until we decide what to do whith the STK token price
                // https://github.com/telosnetwork/telos-wallet/issues/544
                // stkToken.market = new TokenMarketData(stkMarketInfo);
                this.trace('updateSystemTokensPrices', `STLOS price: ${toRaw(stkMarketInfo)}`);

            } catch (error) {
                console.error(error);
                // we won't thorw an error here, as it is not critical
            }
        },
        async updateSystemBalanceForAccount(label: string, address: addressString): Promise<void> {
            this.trace('updateSystemBalanceForAccount', label, address);
            const chain_settings = useChainStore().getChain(label).settings as EVMChainSettings;
            const sys_token = chain_settings.getSystemToken();
            const price = (await chain_settings.getUsdPrice()).toString();
            const marketInfo = { price } as MarketSourceInfo;
            sys_token.market = new TokenMarketData(marketInfo);
            const balanceBn = await useAccountStore().getEVMAuthenticator(label)?.getSystemTokenBalance(address);
            this.processBalanceForToken(label, sys_token, balanceBn);
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
                    if (usePlatformStore().isMobile) {
                        response.wait = async () => Promise.resolve({} as ethers.providers.TransactionReceipt);
                    } else {
                        throw new AntelopeError('antelope.evm.error_no_provider');
                    }
                }
            }
            return response;
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
                abi: useEVMStore().getTokenABI(token.type),
                functionName: 'transfer',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                args: [to, amount] as any[],
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
                        .then(r => this.subscribeForTransactionReceipt(account, r as TransactionResponse));
                }
            } catch (error) {
                console.error(error);
                throw getAntelope().config.wrapError('antelope.evm.error_transfer_failed', error);
            } finally {
                useFeedbackStore().unsetLoading('transferTokens');
                await useBalancesStore().updateBalancesForAccount(label, toRaw(useAccountStore().loggedAccount));
            }
        },
        async wrapSystemTokens(amount: BigNumber): Promise<TransactionResponse> {
            this.trace('wrapSystemTokens', amount.toString());
            const label = 'logged';
            try {
                useFeedbackStore().setLoading('wrapSystemTokens');
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
                console.error(error);
                throw getAntelope().config.wrapError('antelope.evm.error_wrap_failed', error);
            } finally {
                useFeedbackStore().unsetLoading('wrapSystemTokens');
            }
        },
        async unwrapSystemTokens(amount: BigNumber): Promise<TransactionResponse> {
            this.trace('unwrapSystemTokens', amount.toString());
            const label = 'logged';
            try {
                useFeedbackStore().setLoading('unwrapSystemTokens');
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
                console.error(error);
                throw getAntelope().config.wrapError('antelope.evm.error_unwrap_failed', error);
            } finally {
                useFeedbackStore().unsetLoading('unwrapSystemTokens');
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
                const result = await account.authenticator.transferTokens(token, amount, to);
                return result as EvmTransactionResponse | SendTransactionResult;
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
        clearBalances() {
            this.trace('clearBalances');
            this.__balances = {};
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
