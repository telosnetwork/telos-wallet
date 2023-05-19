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
import { AccountModel, useAccountStore } from 'src/antelope/stores/account';
import {
    createTraceFunction,
    isTracingAll,
    useFeedbackStore,
} from 'src/antelope/stores/feedback';
import { errorToString } from 'src/antelope/config';
import { getAntelope } from '..';
import {
    AntelopeError,
    EvmToken,
    EvmTransactionResponse,
    Label,
    NativeToken,
    NativeTransactionResponse,
    Token,
    TransactionResponse,
} from 'src/antelope/types';
import NativeChainSettings from 'src/antelope/chains/NativeChainSettings';
import { useChainStore } from 'src/antelope/stores/chain';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { useEVMStore } from 'src/antelope/stores/evm';
import { formatWei } from 'src/antelope/stores/utils';
import { BigNumber, ethers } from 'ethers';
import { toRaw } from 'vue';
import { FetchBalanceResult, SendTransactionResult, fetchBalance, getAccount, getNetwork, prepareSendTransaction, prepareWriteContract, sendTransaction, writeContract } from '@wagmi/core';

export interface BalancesState {
    __balances:  { [label: Label]: Token[] };
}

type addressString = `0x${string}`; // required wagmi type

const store_name = 'balances';
const ERC_20 = 'erc20';

export const useBalancesStore = defineStore(store_name, {
    state: (): BalancesState => (balancesInitialState),
    getters: {
        loggedBalances: state => state.__balances['logged'] ?? [],
        currentBalances: state => state.__balances['current'] ?? [],
        nativeBalances: state => (state.__balances['current'] ?? []) as NativeToken[],
        evmBalances: state => (state.__balances['current'] ?? []) as EvmToken[],
        getBalances: state => (label: string) => state.__balances[label] ?? [],
    },
    actions: {
        trace: createTraceFunction(store_name),
        init: () => {
            useFeedbackStore().setDebug(store_name, isTracingAll());
            getAntelope().events.onAccountChanged.subscribe({
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
                        this.__balances[label] = await chain_settings.getTokens(account.account);
                        useFeedbackStore().unsetLoading('updateBalancesForAccount');
                    }
                } else {
                    const chain_settings = chain.settings as EVMChainSettings;
                    if (account?.account) {
                        if (chain_settings.hasIndexSupport()) {
                            if (account?.account) {
                                this.__balances[label] = await chain_settings.getAllBalances(account.account);
                                this.sortBalances(label);
                                useFeedbackStore().unsetLoading('updateBalancesForAccount');
                            }
                        } else {
                            // In case the chain does not support index, we need to fetch the balances using Web3
                            this.__balances[label] = this.__balances[label] ?? [];
                            const tokens = await chain_settings.getTokenList();
                            await this.updateSystemBalanceForAccount(label, account.account);
                            this.trace('updateBalancesForAccount', 'tokens:', toRaw(tokens));
                            const evm = useEVMStore();
                            let promises: Promise<void>[] = [];

                            if (localStorage.getItem('wagmi.connected')) {

                                promises = tokens.map(async (token) => {
                                    fetchBalance({
                                        address: getAccount().address as addressString,
                                        chainId: getNetwork().chain?.id,
                                        token: token.address as addressString,
                                    }).then((balanceBn: FetchBalanceResult) => {
                                        this.processBalanceForToken(label, token, balanceBn.value);
                                    });
                                });

                            } else {
                                promises = tokens
                                    .map(token => evm.getERC20TokenBalance(account.account, token.address)
                                        .then((balanceBn: BigNumber) => {
                                            this.processBalanceForToken(label, token, balanceBn);
                                        }),
                                    );

                            }

                            Promise.allSettled(promises).then(() => {
                                useFeedbackStore().unsetLoading('updateBalancesForAccount');
                                this.trace('updateBalancesForAccount', 'balances:', toRaw(this.__balances[label]));
                            });
                        }
                    }
                }
            } catch (error) {
                useFeedbackStore().unsetLoading('updateBalancesForAccount');
                console.error('Error: ', errorToString(error));
            }
        },

        async updateSystemBalanceForAccount(label: string, address: string): Promise<void> {
            const evm = useEVMStore();
            const provider = toRaw(evm.rpcProvider);
            const chain_settings = useChainStore().getChain(label).settings as EVMChainSettings;
            const token = chain_settings.getSystemToken();
            token.price = await chain_settings.getUsdPrice();

            if (provider) {
                const balanceBn = await provider.getBalance(address);
                this.processBalanceForToken(label, token, balanceBn);
            } else if (localStorage.getItem('wagmi.connected')) {
                const balanceBn = await fetchBalance({
                    address: getAccount().address as addressString,
                    chainId: getNetwork().chain?.id,
                });
                this.processBalanceForToken(label, token, balanceBn.value);
            } else {
                throw new AntelopeError('antelope.evm.error_no_provider');
            }
        },
        shouldAddTokenBalance(label: string, balanceBn: BigNumber, token: EvmToken): boolean {
            const importantTokens = useChainStore().getChain(label).settings.getImportantTokensIdList();
            let result = false;
            if (importantTokens.includes(token.tokenId)) {
                // if the token is important, we always add it. Even with 0 balance.
                result = true;
            } else {
                result = !balanceBn.isNegative() && !balanceBn.isZero();
            }
            this.trace('shouldAddTokenBalance', label, ethers.utils.formatUnits(balanceBn, token.decimals), token.symbol, '=>', result);
            return result;
        },
        processBalanceForToken(label: string, token: EvmToken, balanceBn: BigNumber): void {
            this.trace('processBalanceForToken', label, ethers.utils.formatUnits(balanceBn, token.decimals), token.symbol);
            const balance = `${formatWei(balanceBn, token.decimals, 4)}`;
            const fullBalance = `${formatWei(balanceBn, token.decimals, token.decimals)}`;
            const fiatBalance = token.price > 0 ? `${parseFloat(balance) * token.price}` : '';

            const tokenBalance = {
                ...token,
                balanceBn,
                balance,
                fullBalance,
                fiatBalance,
            } as EvmToken;

            if (this.shouldAddTokenBalance(label, balanceBn, token)) {
                this.addNewBalance(label, tokenBalance);
            } else {
                this.removeBalance(label, tokenBalance);
            }
        },
        async subscribeForTransactionReceipt(response: TransactionResponse): Promise<TransactionResponse> {
            this.trace('subscribeForTransactionReceipt', response.hash);
            const provider = toRaw(useEVMStore().rpcProvider);
            if (provider) {
                // instead of await, we use then() to return the response immediately
                // and perform the balance update in the background
                provider.waitForTransaction(response.hash).then((receipt: ethers.providers.TransactionReceipt) => {
                    this.trace('subscribeForTransactionReceipt', response.hash, 'receipt:', receipt.status, receipt);
                    if (receipt.status === 1) {
                        const account = useAccountStore().loggedAccount;
                        if (account?.account) {
                            this.updateBalancesForAccount('logged', account);
                        }
                    }
                    // TODO: should we notify the user that the transaction succeeded of failed?
                    // https://github.com/telosnetwork/telos-wallet/issues/328
                });
            } else {
                throw new AntelopeError('antelope.evm.error_no_provider');
            }
            return response;
        },
        async transferTokens(token: Token, to: string, amount: BigNumber, memo?: string): Promise<TransactionResponse> {
            this.trace('transferTokens', token, to, amount.toString(), memo);
            const label = 'logged';
            try {
                useFeedbackStore().setLoading('transferTokens');
                const chain = useChainStore().loggedChain;
                if (chain.settings.isNative()) {
                    const chain_settings = chain.settings as NativeChainSettings;
                    const account = useAccountStore().loggedAccount;
                    return await this.transferNativeTokens(chain_settings, account, token as NativeToken, to, amount, memo ?? '')
                        .then(this.subscribeForTransactionReceipt);
                } else {
                    const chain_settings = chain.settings as EVMChainSettings;
                    const account = useAccountStore().loggedAccount;
                    return await this.transferEVMTokens(chain_settings, account, token as EvmToken, to, amount)
                        .then(this.subscribeForTransactionReceipt);
                }
            } catch (error) {
                console.error('Error: ', errorToString(error));
                throw error;
            } finally {
                useFeedbackStore().unsetLoading('transferTokens');
                await useBalancesStore().updateBalancesForAccount(label, toRaw(useAccountStore().loggedAccount));
            }
        },
        async transferNativeTokens(
            settings: NativeChainSettings,
            account: AccountModel,
            token: NativeToken,
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
                console.error('Error: ', errorToString(error));
                throw error;
            } finally {
                useFeedbackStore().unsetLoading('transferNativeTokens');
            }
        },
        async transferEVMTokens(
            settings: EVMChainSettings,
            account: AccountModel,
            token: EvmToken,
            to: string,
            amount: BigNumber,
        ): Promise<EvmTransactionResponse | SendTransactionResult> {
            this.trace('transferEVMTokens', settings, account, token, to, amount.toString());
            try {
                useFeedbackStore().setLoading('transferEVMTokens');

                if (localStorage.getItem('wagmi.connected')) {
                    return await this.transferWalletConnect(token, to, amount);
                } else {
                    return await this.transferMetaMask(token, to, amount);
                }
            } catch (error) {
                console.error('Error: ', errorToString(error));
                throw new Error('antelope.balances.error_at_transfer_tokens');
            } finally {
                useFeedbackStore().unsetLoading('transferEVMTokens');
            }
        },

        async transferWalletConnect(token: EvmToken, to: string, amount: BigNumber): Promise<SendTransactionResult>{
            if (token.isSystem) {

                const config = await prepareSendTransaction({
                    request: {
                        to,
                        value: amount,
                    },
                });

                return await sendTransaction(config);
            } else {

                const config = await prepareWriteContract({
                    address: token.address as addressString,
                    abi: useEVMStore().getTokenABI(ERC_20),
                    functionName: 'transfer',
                    args: [to, amount],
                });

                return await writeContract(config);
            }
        },

        async transferMetaMask(token: EvmToken, to: string, amount: BigNumber): Promise<EvmTransactionResponse> {
            const evm = useEVMStore();

            if (token.isSystem) {
                return evm.sendSystemToken(to, amount);
            } else {
                const contract = await evm.getContract(token.address, ERC_20);
                if (contract) {
                    const contractInstance = contract.getContractInstance();
                    const amountInWei = amount.toString();
                    return contractInstance.transfer(to, amountInWei);
                } else {
                    throw new AntelopeError('antelope.balances.error_token_contract_not_found', { address: token.address });
                }
            }
        },
        // sorting ----------
        splitTokensBasedOnHasFiatValue(tokens: EvmToken[]): [EvmToken[], EvmToken[]] {
            const tokenHasFiatValue = (token: EvmToken) => !!token.fiatBalance;

            const sortByFiatValue = (t1: EvmToken, t2: EvmToken) => {
                const fiatValueOne = ethers.utils.parseUnits(t1.fiatBalance ?? '0', t1.decimals);
                const fiatValueTwo = ethers.utils.parseUnits(t2.fiatBalance ?? '0', t2.decimals);
                return fiatValueOne.gt(fiatValueTwo) ? -1 : 1;
            };

            const sortByTokenBalance = (t1: EvmToken, t2: EvmToken) => t1.balanceBn.gt(t2.balanceBn) ? -1 : 1;

            const tokensWithFiatValue   = tokens.filter(token => tokenHasFiatValue(token)).sort(sortByFiatValue);
            const tokensWithNoFiatValue = tokens.filter(token => !tokenHasFiatValue(token)).sort(sortByTokenBalance);

            // always show all tokens with fiat values before all tokens without
            return [tokensWithFiatValue, tokensWithNoFiatValue];
        },
        sortBalances(label: string): void {
            this.trace('sortBalances', label);
            // TODO: refactor this to be EVM agnostic
            // https://github.com/telosnetwork/telos-wallet/issues/280
            const allTokens = this.__balances[label] as EvmToken[];
            const [tokensWithFiatValue, tokensWithoutFiatValue] = this.splitTokensBasedOnHasFiatValue(allTokens);
            this.__balances[label] = [
                ...tokensWithFiatValue,
                ...tokensWithoutFiatValue,
            ];
        },
        // commits -----
        addNewBalance(label: string, balance: Token): void {
            this.trace('addNewBalance', label, ethers.utils.formatUnits(balance.balanceBn, (balance as EvmToken).decimals));

            // if the balance already exists, we update it, if not, we add it
            if (this.__balances[label].find(b => b.tokenId === balance.tokenId)) {
                this.updateBalance(label, balance);
            } else {
                this.__balances[label] = [...this.__balances[label], balance];
                this.sortBalances(label);
                if (useAccountStore().currentIsLogged && label === 'current') {
                    this.__balances['logged'] = this.__balances[label];
                }
            }
        },
        updateBalance(label: string, token: Token): void {
            const index = this.__balances[label].findIndex(b => b.tokenId === token.tokenId);
            if (index >= 0) {
                this.trace('updateBalance', label,
                    'new:', ethers.utils.formatUnits(token.balanceBn, (token as EvmToken).decimals),
                    'old:', ethers.utils.formatUnits(this.__balances[label][index].balanceBn, (token as EvmToken).decimals),
                );
                if (
                    !token.balanceBn.eq(this.__balances[label][index].balanceBn) ||
                    token.balance !== this.__balances[label][index].balance ||
                    token.fullBalance !== this.__balances[label][index].fullBalance ||
                    token.price !== this.__balances[label][index].price ||
                    token.fiatBalance !== this.__balances[label][index].fiatBalance
                ) {
                    this.__balances[label][index] = {
                        ...this.__balances[label][index],
                        balanceBn: token.balanceBn,
                        balance: token.balance,
                        fullBalance: token.fullBalance,
                        price: token.price,
                        fiatBalance: token.fiatBalance,
                    } as Token;
                    this.sortBalances(label);
                    if (useAccountStore().currentIsLogged && label === 'current') {
                        this.__balances['logged'] = this.__balances[label];
                    }
                }
            } else {
                this.trace('updateBalance', label, ethers.utils.formatUnits(token.balanceBn, (token as EvmToken).decimals));
            }
        },
        removeBalance(label: string, token: Token): void {
            this.trace('removeBalance', label, token);
            const index = this.__balances[label].findIndex(b => b.tokenId === token.tokenId);
            if (index >= 0) {
                this.__balances[label].splice(index, 1);
            }
            if (useAccountStore().currentIsLogged && label === 'current') {
                this.__balances['logged'] = this.__balances[label];
            }
        },
    },
});

const balancesInitialState: BalancesState = {
    __balances: {},
};
