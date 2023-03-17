// Get pool info from chain by id, put into store
export const getRexBalance = async function ({ commit, dispatch }, account) {
    try {
        const rexbalRows = await this.$api.getTableRows({
            code: 'eosio', // Contract that we target
            scope: 'eosio', // Account that owns the data
            table: 'rexbal', // Table name
            lower_bound: account, // Lower bound of data
            upper_bound: account, // Upper bound of data
            reverse: false, // Optional: Get reversed data
            show_payer: false, // Optional: Show ram payer
        });
        const rexbal = rexbalRows.rows[0];

        const rexpoolRows = await this.$api.getTableRows({
            code: 'eosio',
            scope: 'eosio',
            table: 'rexpool',
            json: true,
            reverse: false,
        });
        const rexpool = rexpoolRows.rows[0];

        const rexfundRows = await this.$api.getTableRows({
            code: 'eosio',
            scope: 'eosio',
            table: 'rexfund',
            limit: '1',
            lower_bound: account, // Lower bound of data
            upper_bound: account, // Upper bound of data
            reverse: false,
        });
        const rexfund = rexfundRows.rows[0];

        if (rexbal) {

            const totalRex = Number(rexpool.total_rex.split(' ')[0]);
            const totalLendable = Number(rexpool.total_lendable.split(' ')[0]);
            const tlosRexRatio = totalRex > 0 ? totalLendable / totalRex : 1;
            const rexBalance =
                rexbal && rexbal.rex_balance
                    ? parseFloat(rexbal.rex_balance.split(' ')[0])
                    : 0;
            const rexFundBalance =
                rexfund && rexfund.balance
                    ? Number(rexfund.balance.split(' ')[0])
                    : 0.0;
            let coreBalance = totalRex > 0 ? tlosRexRatio * rexBalance : 0.0;
            coreBalance += rexFundBalance;

            return coreBalance;
        } else {
            return 0;
        }

    } catch (error) {
        console.error('getRexBalance', error);
        commit('general/setErrorMsg', error.message || error, { root: true });
    }
};
