export const setLoadingWallet = (state, wallet) => {
    state.loading = wallet;
};

export const setAccountName = (state, accountName) => {
    state.accountName = accountName;
};

export const setEvmAddress = (state, address) => {
    state.evmAddress = address;
};

export const setEvmBalance = (state, balance) => {
    state.evmBalance = balance;
};

export const setAutoLogin = (state, status) => {
    state.autoLogin = status;
};

export const setJustViewer = (state, status) => {
    state.justViewer = status;
};

export const setProfile = (state, profile = undefined) => {
    if (!profile) {
        return;
    }
    state.profiles[profile.account_name] = profile;
};

export const setData = (state, status) => {
    state.data = status;
};
