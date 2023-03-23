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
import { Token } from 'src/antelope/types/Actions';
import { useChainStore } from 'src/antelope/stores/chain';
import NativeChain from 'src/antelope/chains/NativeChain';


export interface BalancesState {
    __balances: Map<string, Token[]>;
}

const store_name = 'balances';

export const useBalancesStore = defineStore(store_name, {
    state: (): BalancesState => (balancesInitialState),
    getters: {
        getBalancesForAccount: state => (label: string, account: AccountModel | null) => {
            if (account) {
                const key = `${label}:${account.account}`;
                return state.__balances.get(key);
            }
            return null;
        },
        getBalances: state => state.__balances.get('current'),
    },
    actions: {
        trace: createTraceFunction(store_name),
        init: () => {
            useFeedbackStore().setDebug(store_name, isTracingAll());
            getAntelope().events.onAccountChanged.subscribe({
                next: ({ label, account }) => {
                    useBalancesStore().updateTokensForAccount(label, account);
                },
            });
        },
        async updateTokensForAccount(label: string, account: AccountModel | null) {
            this.trace('updateTokensForAccount', label, account);
            try {
                useFeedbackStore().setLoading('updateTokensForAccount');
                if (account) {
                    const chain = useChainStore().getChain(label).settings as NativeChain;
                    const balances = await chain.getTokens(account.account);
                    this.__balances.set(label, balances);
                    const accountStore = useAccountStore();
                    if (accountStore.currentIsLogged && label === 'current') {
                        this.__balances.set('logged', balances);
                    }
                    this.trace('updateTokensForAccount', 'balances: ', balances);
                }
            } catch (error) {
                console.error('Error: ', errorToString(error));
            } finally {
                useFeedbackStore().unsetLoading('updateTokensForAccount');
            }
        },
    },
});

const balancesInitialState: BalancesState = {
    __balances: new Map(),
};
