export const setLoadingWallet = (state, wallet) => {
  state.loading = wallet;
};

export const setAccount = (state, account) => {
  state.account = account;
};

export const setAccountName = (state, accountName) => {
  state.accountName = accountName;
};

export const setAutoLogin = (state, status) => {
  state.autoLogin = status;
};
