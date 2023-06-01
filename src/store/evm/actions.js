// Get pool info from chain by id, put into store
export const getGasPrice = async function({ commit, dispatch }) {
    try {
        const tableResults = await this.$api.getTableRows({
            code: process.env.EVM_CONTRACT, // Contract that we target
            scope: process.env.EVM_CONTRACT, // Account that owns the data
            table: 'config', // Table name
            reverse: false, // Optional: Get reversed data
            show_payer: false, // Optional: Show ram payer
        });

        return tableResults.rows[0].gas_price;
    } catch (error) {
        commit('general/setErrorMsg', error.message || error, { root: true });
    }
};
