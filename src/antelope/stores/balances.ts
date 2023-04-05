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
    Label,
    Token,
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
        getLoggedBalances: state => state.__balances['logged'],
        getCurrentBalances: state => state.__balances['current'],
        getBalances: state => (label: string) => state.__balances[label],
    },
    actions: {
        trace: createTraceFunction(store_name),
        init: () => {
            useFeedbackStore().setDebug(store_name, isTracingAll());
            getAntelope().events.onAccountChanged.subscribe({
                next: ({ label, account }) => {
                    useBalancesStore().updateTokensForAccount(label, toRaw(account));
                },
            });
        },
        async updateTokensForAccount(label: string, account: AccountModel | null) {
            this.trace('updateTokensForAccount', label, account);
            try {
                useFeedbackStore().setLoading('updateTokensForAccount');
                const chain = useChainStore().getChain(label);
                let balances: Token[] = [];
                if (chain.settings.isNative()) {
                    const chain_settings = chain.settings as NativeChainSettings;
                    if (account) {
                        balances = await chain_settings.getTokens(account?.account);
                    }
                } else {
                    const chain_settings = chain.settings as EVMChainSettings;
                    if (account) {
                        const evm = useEVMStore();
                        const tokens = await chain_settings.getTokenList();
                        balances = tokens;
                        const promises = tokens.map((token, index) => evm.getContract(token.address)
                            .then((contract) => {
                                if (contract) {
                                    try {
                                        const contractInstance = contract.getContractInstance();
                                        const address = account.account;
                                        return contractInstance.balanceOf(address).then((balance: BigNumber) => {
                                            token.balance = `${formatWei(balance, token.decimals, 4)}`;
                                            token.fullBalance = `${formatWei(balance, token.decimals)}`;
                                            this.__balances[label][index] = token;
                                        });
                                    } catch (e) {
                                        console.error(e);
                                    }
                                }
                            }));

                        Promise.allSettled(promises).then(() => {
                            useFeedbackStore().unsetLoading('updateTokensForAccount');
                            this.trace('updateTokensForAccount', 'balances:', toRaw(this.__balances[label]));
                        });
                    }
                }
                this.__balances[label] = balances;
                const accountStore = useAccountStore();
                if (accountStore.currentIsLogged && label === 'current') {
                    this.__balances['logged'] = balances;
                }
                this.trace('updateTokensForAccount', 'balances: ', balances);

            } catch (error) {
                console.error('Error: ', errorToString(error));
            }
        },
    },
});

const balancesInitialState: BalancesState = {
    __balances: {},
};
