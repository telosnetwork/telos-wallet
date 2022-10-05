import { vxm } from "../../store";
import BigNumber from "bignumber.js";

export const login = async function(
  { commit, dispatch },
  { idx, account, returnUrl }
) {
  const authenticator = this.$ual.authenticators[idx];
  try {
    commit("setLoadingWallet", authenticator.getStyle().text);
    await authenticator.init();
    if (!account) {
      const requestAccount = await authenticator.shouldRequestAccountName();
      if (requestAccount) {
        await dispatch("fetchAvailableAccounts", idx);
        commit("setRequestAccount", true);
        return;
      }
    }
    const users = await authenticator.login(account);
    if (users.length) {
      const account = users[0];
      const accountName = await account.getAccountName();
      this.$ualUser = account;
      this.$type = "ual";
      this.$idx = idx;
      commit("setAccountName", accountName);
      localStorage.setItem("autoLogin", authenticator.constructor.name);
      localStorage.setItem("account", accountName);
      localStorage.setItem("returning", true);
      if (this.$router.currentRoute.path === "/") {
        await this.$router.push({ path: "/balance" });
      }
      dispatch("getAccountProfile");
      vxm.tlosWallet.wallet = {
        auth: {
          accountName: accountName,
          permission: "active"
        },
        eosApi: this.$ualUser
      };
    }
  } catch (e) {
    const error =
      (authenticator.getError() && authenticator.getError().message) ||
      e.message ||
      e.reason;
    commit("general/setErrorMsg", error, { root: true });
    console.log("Login error: ", error);
  } finally {
    commit("setLoadingWallet");
  }
};

export const autoLogin = async function({ dispatch, commit }, returnUrl) {
  const { authenticator, idx } = getAuthenticator(this.$ual);
  if (authenticator) {
    commit("setAutoLogin", true);
    await dispatch("login", {
      idx,
      returnUrl,
      account: localStorage.getItem("account")
    });
    this.$idx = idx;
    commit("setAutoLogin", false);
  }
};

const getAuthenticator = function(ual, wallet = null) {
  wallet = wallet || localStorage.getItem("autoLogin");
  const idx = ual.authenticators.findIndex(
    auth => auth.constructor.name === wallet
  );
  return {
    authenticator: ual.authenticators[idx],
    idx
  };
};

export const logout = async function({ commit }) {
  const { authenticator } = getAuthenticator(this.$ual);
  try {
    authenticator && (await authenticator.logout());
  } catch (error) {
    console.log("Authenticator logout error", error);
  }
  this.$account = {};
  commit("setProfile", undefined);
  commit("setAccountName");
  localStorage.removeItem("autoLogin");

  if (this.$router.currentRoute.path !== "/") {
    this.$router.push({ path: "/" });
  }
};

export const getUserProfile = async function({ commit }, accountName) {
  try {
    const profileResult = await this.$api.getTableRows({
      code: "profiles",
      scope: "profiles",
      table: "profiles",
      limit: 1,
      index_position: 1,
      key_type: "i64",
      lower_bound: accountName,
      upper_bound: accountName
    });
    const profile = profileResult.rows[0];
    commit("setProfile", profile);
  } catch (error) {
    commit("general/setErrorMsg", error.message || error, { root: true });
  }
};

export const getAccountProfile = async function({ commit, dispatch }) {
  if (!this.state.account.accountName) {
    return;
  }

  dispatch("getUserProfile", this.state.account.accountName);
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
  const evmAccount = await this.$evmApi.telos.getEthAccountByTelosAccount(
    this.accountName
  );

  if (evmAccount && evmAccount.address){
    commit("account/setEvmAddress", evmAccount.address);
    commit("account/setEvmBalance", BigNumber(evmAccount.balance.toString())
    .div(1e18)
    .toFixed(4));
  }else{
    commit("account/setEvmAddress", null);
    commit("account/setEvmBalance", null)
  }
};


