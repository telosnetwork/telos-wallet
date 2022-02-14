// Get pool info from chain by id, put into store
export const getRexBalance = async function ({ commit, dispatch }, account) {
    try {
        const rexbal = await this.$api.getTableRows({
            code: "eosio", // Contract that we target
            scope: "eosio", // Account that owns the data
            table: "rexbal", // Table name
            lower_bound: account, // Lower bound of data
            upper_bound: account, // Upper bound of data
            reverse: false, // Optional: Get reversed data
            show_payer: false, // Optional: Show ram payer
        });
        // console.log(rexbal.rows[0]);

        // commit("setRexBalance", rexbal.rows[0]);
        if (rexbal.rows[0]) {
            return Number(rexbal.rows[0].vote_stake.split(" ")[0]);
        } else {
            return 0;
        }

    } catch (error) {
        console.error("getRexBalance");
        commit("general/setErrorMsg", error.message || error, { root: true });
    }
};

// Get pool info from chain by id, put into store
export const stakeRex = async function ({ commit, dispatch }, account) {
    try {
        const rexbal = await this.$api.getTableRows({
            code: "eosio", // Contract that we target
            scope: "eosio", // Account that owns the data
            table: "rexbal", // Table name
            lower_bound: account, // Lower bound of data
            upper_bound: account, // Upper bound of data
            reverse: false, // Optional: Get reversed data
            show_payer: false, // Optional: Show ram payer
        });
        console.log(rexbal.rows[0]);

        commit("setRexBalance", rexbal.rows[0]);


        return rexbal;
    } catch (error) {
        console.error("getRexBalance");
        commit("general/setErrorMsg", error.message || error, { root: true });
    }
};

// Get pool info from chain by id, put into store
export const unstakeRex = async function ({ commit, dispatch }, account) {
    try {
        const rexbal = await this.$api.getTableRows({
            code: "eosio", // Contract that we target
            scope: "eosio", // Account that owns the data
            table: "rexbal", // Table name
            lower_bound: account, // Lower bound of data
            upper_bound: account, // Upper bound of data
            reverse: false, // Optional: Get reversed data
            show_payer: false, // Optional: Show ram payer
        });
        console.log(rexbal.rows[0]);

        commit("setRexBalance", rexbal.rows[0]);


        return rexbal;
    } catch (error) {
        console.error("getRexBalance");
        commit("general/setErrorMsg", error.message || error, { root: true });
    }
};
