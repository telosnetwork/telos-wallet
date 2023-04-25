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
import { getAntelope, useUserStore } from '..';
import {
    EvmToken,
    Label,
    NativeToken,
    Token,
} from 'src/antelope/types';
import NativeChainSettings from 'src/antelope/chains/NativeChainSettings';
import { useChainStore } from 'src/antelope/stores/chain';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { useEVMStore } from 'src/antelope/stores/evm';
import { formatWei, prettyPrintCurrencyTiny, prettyPrintFiatCurrency } from 'src/antelope/stores/utils';
import { BigNumber } from 'ethers';
import { toRaw } from 'vue';

export interface BalancesState {
    __balances:  { [label: Label]: Token[] };
}

const store_name = 'balances';

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
                next: ({ label, account }) => {
                    useBalancesStore().updateBalancesForAccount(label, toRaw(account));
                },
            });
        },
        async updateBalancesForAccount(label: string, account: AccountModel | null) {
            this.trace('updateBalancesForAccount', label, account);
            try {
                useFeedbackStore().setLoading('updateBalancesForAccount');
                const chain = useChainStore().getChain(label);
                const accountStore = useAccountStore();
                let balances: Token[] = [];
                if (chain.settings.isNative()) {
                    const chain_settings = chain.settings as NativeChainSettings;
                    if (account) {
                        balances = await chain_settings.getTokens(account?.account);
                    }
                } else {
                    const chain_settings = chain.settings as EVMChainSettings;
                    if (account) {
                        // we take the hole list of tokens and add the system token to the beginning
                        const evm = useEVMStore();
                        const tokens = await chain_settings.getTokenList();
                        this.updateSystemBalanceForAccount(label, account.account);
                        this.trace('updateBalancesForAccount', 'tokens:', toRaw(tokens));
                        const promises = tokens.map(token => evm.getContract(token.address)
                            .then((contract) => {
                                if (contract) {
                                    try {
                                        const contractInstance = contract.getContractInstance();
                                        const address = account.account;
                                        return contractInstance.balanceOf(address).then((balance: BigNumber) => {
                                            token.balance = `${formatWei(balance, token.decimals, 4)}`;
                                            token.fullBalance = `${formatWei(balance, token.decimals)}`;
                                            token.tinyBalance = prettyPrintCurrencyTiny(token.fullBalance, useUserStore().locale);
                                            // only adding balance if it is greater than 0
                                            if (parseFloat(token.balance) > 0) {
                                                this.__balances[label] = [...this.__balances[label], token];
                                            }
                                        });
                                    } catch (e) {
                                        console.error(e);
                                    }
                                }
                            }));

                        Promise.allSettled(promises).then(() => {
                            useFeedbackStore().unsetLoading('updateBalancesForAccount');
                            this.trace('updateBalancesForAccount', 'balances:', toRaw(this.__balances[label]));
                        });
                    }
                }
                this.__balances[label] = balances;
                if (accountStore.currentIsLogged && label === 'current') {
                    this.__balances['logged'] = balances;
                }
                this.trace('updateBalancesForAccount', 'balances: ', balances);

            } catch (error) {
                console.error('Error: ', errorToString(error));
            }
        },
        async updateSystemBalanceForAccount(label: string, address: string): Promise<EvmToken> {
            const evm = useEVMStore();
            const chain_settings = useChainStore().getChain(label).settings as EVMChainSettings;
            const provider = toRaw(evm.rpcProvider);
            const token = chain_settings.getSystemToken();
            const price = await chain_settings.getUsdPrice();
            token.price = price;
            if (provider) {
                provider.getBalance(address).then((balance: BigNumber) => {
                    token.balance = `${formatWei(balance, token.decimals, 4)}`;
                    token.fiatBalance = `${parseFloat(token.balance) * price}`;
                    token.fullBalance = `${formatWei(balance, token.decimals)}`;
                    token.tinyBalance = prettyPrintCurrencyTiny(token.fullBalance, useUserStore().locale);
                    // token.tinyFiatBalance = prettyPrintFiatCurrency(token.fiatBalance, useUserStore().locale);
                    // only adding balance if it is greater than 0
                    if (parseFloat(token.balance) > 0) {
                        this.__balances[label] = [token, ...this.__balances[label]];
                    }
                });
            }
            return Promise.resolve(token);
        },
        async updateBalancesPrettyPrints(label: string) {
            this.trace('updateBalancesPrettyPrints', label);
            try {
                const chain_settings = useChainStore().getChain(label).settings;
                if (chain_settings.isNative()) {
                } else {
                    useFeedbackStore().setLoading('updateBalancesPrettyPrints');
                    const balances = this.getBalances(label) as EvmToken[];
                    balances.forEach((token) => {
                        token.tinyBalance = prettyPrintCurrencyTiny(token.fullBalance, useUserStore().locale);
                        token.prettyBalance = prettyPrintCurrencyTiny(token.fullBalance, useUserStore().locale);
                    });
                }
            } catch (error) {
                console.error('Error: ', errorToString(error));
            } finally {
                useFeedbackStore().unsetLoading('updateBalancesPrettyPrints');
            }
        },
        async transferTokens(token: Token, to: string, amount: string, memo?: string): Promise<unknown> {
            this.trace('transferTokens', token, to, amount, memo);
            try {
                useFeedbackStore().setLoading('transferTokens');
                const chain = useChainStore().loggedChain;
                if (chain.settings.isNative()) {
                    const chain_settings = chain.settings as NativeChainSettings;
                    const account = useAccountStore().loggedAccount;
                    return this.transferNativeTokens(chain_settings, account, token as NativeToken, to, amount, memo ?? '');
                } else {
                    const chain_settings = chain.settings as EVMChainSettings;
                    const account = useAccountStore().loggedAccount;
                    return this.transferEVMTokens(chain_settings, account, token as EvmToken, to, amount);
                }
            } catch (error) {
                console.error('Error: ', errorToString(error));
            } finally {
                useFeedbackStore().unsetLoading('transferTokens');
            }
        },
        async transferNativeTokens(
            settings: NativeChainSettings,
            account: AccountModel,
            token: NativeToken,
            to: string,
            amount: string,
            memo: string,
        ): Promise<unknown> {
            this.trace('transferNativeTokens', settings, account, token, to, amount, memo);
            try {
                useFeedbackStore().setLoading('transferNativeTokens');
                return useAccountStore().sendAction({
                    name: 'transfer',
                    account: token.contract,
                    data: {
                        from: account.account,
                        to,
                        quantity: `${parseFloat(amount).toFixed(token.precision)} ${token.symbol}`,
                        memo,
                    },
                    actor: account.account,
                    permission: 'active',
                });
            } catch (error) {
                console.error('Error: ', errorToString(error));
            } finally {
                useFeedbackStore().unsetLoading('transferNativeTokens');
            }
        },
        async transferEVMTokens(
            settings: EVMChainSettings,
            account: AccountModel,
            token: EvmToken,
            to: string,
            amount: string,
        ): Promise<unknown> {
            this.trace('transferEVMTokens', settings, account, token, to, amount);
            try {
                useFeedbackStore().setLoading('transferEVMTokens');
                const evm = useEVMStore();

                if (token.isSystem) {
                    evm.sendSystemToken(to, amount).then((a:unknown) => {
                        console.log('Transaction sent:', a);
                    }).catch((error: unknown) => {
                        console.error(error);
                    });
                } else {
                    const contract = await evm.getContract(token.address, 'erc20');
                    if (contract) {
                        const contractInstance = contract.getContractInstance();
                        const amountInWei = evm.toWei(amount, token.decimals);
                        return contractInstance.transfer(to, amountInWei).then((a:unknown) => {
                            console.log('Transaction sent:', a);
                        }).catch((error: unknown) => {
                            console.error(error);
                        });
                    }
                }

            } catch (error) {
                console.error('Error: ', errorToString(error));
            } finally {
                useFeedbackStore().unsetLoading('transferEVMTokens');
            }
        },
    },
});

const balancesInitialState: BalancesState = {
    __balances: {},
};
