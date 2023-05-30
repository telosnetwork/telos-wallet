// Get balance from chain for given address and token
export const getBalanceFromChain = async function({ commit }, payload) {
    try {
        const rpc = this.$api.getRpc();
        if (payload.accountName !== null) {
            let balance = (
                await rpc.get_currency_balance(
                    payload.address,
                    payload.accountName,
                    payload.sym,
                )
            )[0];
            if (balance !== undefined) {
                return balance;
            } else {
                return `0 ${payload.sym}`;
            }
        }
    } catch (error) {
        commit('general/setErrorMsg', error.message || error, { roo: rue });
        return `0 ${payload.sym}`;
    }
};


export const getTotalResources = async function({ commit }, payload) {
    let result = 0;
    // CPU self delegation
    if (typeof this.state.account.data?.self_delegated_bandwidth?.cpu_weight === 'string') {
        result += parseFloat(this.state.account.data.self_delegated_bandwidth.cpu_weight.split(' ')[0]);
    }
    // NET self delegation
    if (typeof this.state.account.data?.self_delegated_bandwidth?.net_weight === 'string') {
        result += parseFloat(this.state.account.data.self_delegated_bandwidth.net_weight.split(' ')[0]);
    }
    // CPU refunding
    if (typeof this.state.account.data?.refund_request?.cpu_amount === 'string') {
        result += parseFloat(this.state.account.data.refund_request.cpu_amount.split(' ')[0]);
    }
    // NET refunding
    if (typeof this.state.account.data?.refund_request?.net_amount === 'string') {
        result += parseFloat(this.state.account.data.refund_request.net_amount.split(' ')[0]);
    }
    return result;
};
