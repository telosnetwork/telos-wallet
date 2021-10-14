// Get balance from chain for given address and token
export const getBalanceFromChain = async function({ commit }, payload) {
    try {
      const rpc = this.$api.getRpc();
      if (payload.accountName !== null) {
        let balance = (
          await rpc.get_currency_balance(
            payload.address,
            payload.accountName,
            payload.sym
          )
        )[0];
        // console.log("balance:")
        // console.log(balance)
        if (balance !== undefined) {
          return balance;
        } else {
          return `0 ${payload.sym}`;
        }
      }
    } catch (error) {
      commit("general/setErrorMsg", error.message || error, { root: true });
      return `0 ${payload.sym}`;
    }
  };