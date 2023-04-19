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

            // update logged balances every 10 seconds only if the user is logged
            setInterval(() => {
                if (useAccountStore().loggedAccount) {
                    useBalancesStore().updateBalancesForAccount('logged', useAccountStore().loggedAccount);
                }
            }, 10000);

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
                        // we take the whole list of tokens and add the system token to the beginning
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
                                        return contractInstance.balanceOf(address).then((value: BigNumber) => {
                                            const balance = `${formatWei(value, token.decimals, 4)}`;
                                            token.balance = `${formatWei(value, token.decimals, 4)}`;
                                            token.fullBalance = `${formatWei(value, token.decimals)}`;
                                            // only adding balance if it is greater than 0
                                            if (parseFloat(balance) > 0) {
                                                this.addNewBalance(label, token);
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
            if (provider) {
                provider.getBalance(address).then(async (balance: BigNumber) => {
                    token.balance = `${formatWei(balance, token.decimals, 4)}`;
                    token.fullBalance = `${formatWei(balance, token.decimals)}`;
                    // only adding balance if it is greater than 0
                    if (parseFloat(token.balance) > 0) {
                        this.addNewBalance(label, token);
                    }

                    const price = await chain_settings.getUsdPrice();
                    token.fiatBalance = `${parseFloat(token.balance) * price}`;
                    token.price = price;
                });
            }
            return Promise.resolve(token);
        },
        async transferTokens(token: Token, to: string, amount: string, memo?: string): Promise<TransactionResponse> {
            this.trace('transferTokens', token, to, amount, memo);
            const label = 'logged';
            try {
                useFeedbackStore().setLoading('transferTokens');
                const chain = useChainStore().loggedChain;
                if (chain.settings.isNative()) {
                    const chain_settings = chain.settings as NativeChainSettings;
                    const account = useAccountStore().loggedAccount;
                    return await this.transferNativeTokens(chain_settings, account, token as NativeToken, to, amount, memo ?? '');
                } else {
                    const chain_settings = chain.settings as EVMChainSettings;
                    const account = useAccountStore().loggedAccount;
                    return await this.transferEVMTokens(chain_settings, account, token as EvmToken, to, amount);
                }
            } catch (error) {
                console.error('Error: ', errorToString(error));
                throw error;
            } finally {
                useFeedbackStore().unsetLoading('transferTokens');
                useBalancesStore().updateBalancesForAccount(label, toRaw(useAccountStore().loggedAccount));
            }
        },
        async transferNativeTokens(
            settings: NativeChainSettings,
            account: AccountModel,
            token: NativeToken,
            to: string,
            amount: string,
            memo: string,
        ): Promise<NativeTransactionResponse> {
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
            amount: string,
        ): Promise<EvmTransactionResponse> {
            this.trace('transferEVMTokens', settings, account, token, to, amount);
            try {
                useFeedbackStore().setLoading('transferEVMTokens');
                const evm = useEVMStore();

                if (token.isSystem) {
                    return evm.sendSystemToken(to, amount);
                } else {
                    const contract = await evm.getContract(token.address, 'erc20');
                    if (contract) {
                        const contractInstance = contract.getContractInstance();
                        const amountInWei = evm.toWei(amount, token.decimals);
                        return contractInstance.transfer(to, amountInWei);
                    } else {
                        throw new AntelopeError('antelope.balances.error_token_contract_not_found', { address: token.address });
                    }
                }
            } catch (error) {
                console.error('Error: ', errorToString(error));
                throw new Error('antelope.balances.error_at_transfer_tokens');
            } finally {
                useFeedbackStore().unsetLoading('transferEVMTokens');
            }
        },
        // commits -----
        addNewBalance(label: string, balance: Token): void {
            this.trace('addNewBalance', label, balance);
            // if the balance already exists, we update it, if not, we add it
            if (this.__balances[label].find(b => b.tokenId === balance.tokenId)) {
                this.updateBalance(label, balance);
            } else {
                this.__balances[label] = [...this.__balances[label], balance];
            }
        },
        updateBalance(label: string, token: Token): void {
            this.trace('updateBalance', label, token);
            const index = this.__balances[label].findIndex(b => b.tokenId === token.tokenId);
            if (index >= 0) {
                this.__balances[label][index].balance = token.balance;
                this.__balances[label][index].fullBalance = token.fullBalance;
                this.__balances[label][index].price = token.price;
                this.__balances[label][index].fiatBalance = token.fiatBalance;
            }
        },
    },
});

const balancesInitialState: BalancesState = {
    __balances: {},
};
