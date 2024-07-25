import BigNumber from 'bignumber.js';
import { initFuelUserWrapper } from 'src/api/fuel';
import { OreUser } from 'ual-oreid';

export const login = async function(
    { commit, dispatch },
    { idx, account, returnUrl, justViewer },
) {
    const authenticator = this.$ual.authenticators[idx];
    try {
        commit('setLoadingWallet', authenticator.getStyle().text);
        await authenticator.init();
        if (!account) {
            const requestAccount = await authenticator.shouldRequestAccountName();
            if (requestAccount) {
                await dispatch('fetchAvailableAccounts', idx);
                commit('setRequestAccount', true);
                return;
            }
        }
        commit('setJustViewer', justViewer);
        const users = await authenticator.login(account);
        if (users.length) {
            this.$ualUser = await initFuelUserWrapper(users[0]);
            const accountName = await this.$ualUser.getAccountName();
            this.$type = 'ual';
            this.$idx = idx;
            commit('setAccountName', accountName);
            // all localhost data is set src/antelope/stores/account.ts on loginZero function
            if (this.$router.currentRoute.path === '/') {
                await this.$router.push({ path: '/zero/balance' });
            }
            dispatch('getAccountData');
            dispatch('getAccountProfile');
        }
    } catch (e) {
        const error =
            (authenticator.getError() && authenticator.getError().message) ||
            e.message ||
            e.reason ||
            e.cause;
        if (error !== 'cancelled') {
            commit('general/setErrorMsg', error, { root: true });
            throw e;
        } else {
            console.debug('Login cancelled');
        }
    } finally {
        commit('setLoadingWallet');
    }
};

export const memoryAutoLogin = async function ({
    dispatch,
    rootState,
}) {
    const account = localStorage.getItem('account');
    if (account) {
        if (!rootState.account.accountName) {
            await dispatch('autoLogin', location.pathname);
        }
    } else {
        return null;
    }
    return null;
};

export const autoLogin = async function({ dispatch, commit }, returnUrl) {
    const { authenticator, idx } = getAuthenticator(this.$ual);
    if (authenticator) {
        commit('setAutoLogin', true);
        const network = localStorage.getItem('network');
        await dispatch('login', {
            idx,
            returnUrl,
            network,
            account: localStorage.getItem('account'),
        });
        this.$idx = idx;
        commit('setAutoLogin', false);
    }
};

const getAuthenticator = function(ual, wlt = null) {
    const wallet = wlt || localStorage.getItem('autoLogin');
    const idx = ual.authenticators.findIndex(
        auth => auth.getName() === wallet,
    );
    return {
        authenticator: ual.authenticators[idx],
        idx,
    };
};

export const logout = async function({ commit }, telosZeroLogout = false) {
    const { authenticator } = getAuthenticator(this.$ual);
    try {
        authenticator && (await authenticator.logout());
    } catch (error) {
        console.error('Authenticator logout error', error);
    }
    this.$account = {};

    localStorage.removeItem('autoLogin');
    localStorage.removeItem('account');

    commit('setProfile', undefined);
    commit('setData', undefined);
    commit('setAccountName');
    commit('setEvmAddress', null);
    commit('setEvmBalance', null);

    if (this.$router.currentRoute.path !== '/') {
        this.$router.push({ path: '/', query: { login: telosZeroLogout ? 'zero' : '' } });
    }
};


export const getAccountData = async function({ commit, dispatch }) {
    if (!this.state.account.accountName) {
        commit('setData', undefined);
        return;
    }

    const data = await this.$api.getAccount(this.state.account.accountName);
    commit('setData', data);
};

export const getUserProfile = async function({ commit }, accountName) {
    try {
        const profileResult = await this.$api.getTableRows({
            code: 'profiles',
            scope: 'profiles',
            table: 'profiles',
            limit: 1,
            index_position: 1,
            key_type: 'i64',
            lower_bound: accountName,
            upper_bound: accountName,
        });
        const profile = profileResult.rows[0];
        commit('setProfile', profile);
    } catch (error) {
        commit('general/setErrorMsg', error.message || error, { root: true });
    }
};

export const getAccountProfile = async function({ commit, dispatch }) {
    if (!this.state.account.accountName) {
        return;
    }

    dispatch('getUserProfile', this.state.account.accountName);
};

export const accountExists = async function({ commit, dispatch }, accountName) {
    try {
        const account = await this.$api.getAccount(accountName);
        return !!account;
    } catch (e) {
        return false;
    }
};

export const setEvmState = async function({ commit, dispatch }) {
    let evmAccount;

    if (!this.state.account.accountName) {
        return;
    }

    // If linked evm address does not exist, disregard error as this will always throw for newly created native accounts
    try {
        evmAccount = await this.$evmApi.telos.getEthAccountByTelosAccount(
            this.state.account.accountName,
        );
    } catch(e) {
        // `No address associated with ${account}`
        return;
    }

    if (evmAccount && evmAccount.address){
        commit('setEvmAddress', evmAccount.address);
        commit('setEvmBalance', BigNumber(evmAccount.balance.toString())
            .div(1e18)
            .toFixed(4));
    }else{
        commit('setEvmAddress', null);
        commit('setEvmBalance', null);
    }
};


