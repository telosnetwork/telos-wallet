import { boot } from 'quasar/wrappers';
import { Api, JsonRpc } from 'eosjs';
import { TelosEvmApi } from '@telosnetwork/telosevm-js';

const signTransaction = async function (actions, detail = null) {
    actions.forEach((action) => {
        if (!action.authorization || !action.authorization.length) {
            action.authorization = [
                {
                    actor: this.state.account.accountName,
                    permission: 'active',
                },
            ];
        }
    });
    let transaction = null;
    try {
        if (this.$type === 'ual') {
            transaction = await this.$ualUser.signTransaction(
                {
                    actions,
                },
                {
                    broadcast: true,
                    blocksBehind: 3,
                    expireSeconds: 30,
                },
            );
        }
    } catch (e) {
        console.error(actions, e);
        throw e;
    }
    return transaction;
};

const getRpc = function () {
    return this.$defaultApi.rpc;
};

const getTableRows = async function (options) {
    const rpc = this.$api.getRpc();
    return await rpc.get_table_rows({
        json: true,
        ...options,
    });
};

const getAbi = async function (accountName) {
    const rpc = this.$api.getRpc();
    return await rpc.get_abi(accountName);
};

const getInfo = async function () {
    const rpc = this.$api.getRpc();
    return await rpc.get_info();
};

const getAccount = async function (accountName) {
    const rpc = this.$api.getRpc();
    return await rpc.get_account(accountName);
};

export default boot(async ({ store }) => {
    const rpc = new JsonRpc(
        `${process.env.NETWORK_PROTOCOL}://${process.env.NETWORK_HOST}:${process.env.NETWORK_PORT}`,
    );

    store['$account'] = {};

    store['$defaultApi'] = new Api({
        rpc,
        textDecoder: new TextDecoder(),
        textEncoder: new TextEncoder(),
    });

    store['$evmApi'] = new TelosEvmApi({
        endpoint: process.env.HYPERION_ENDPOINT,
        chainId: process.env.CHAIN_NAME === 'telos' ? 40 : 41,
        ethPrivateKeys: [],
        telosContract: process.env.EVM_CONTRACT,
        telosPrivateKeys: [],
    });

    store['$api'] = {
        getInfo: getInfo.bind(store),
        getAbi: getAbi.bind(store),
        signTransaction: signTransaction.bind(store),
        getTableRows: getTableRows.bind(store),
        getAccount: getAccount.bind(store),
        getRpc: getRpc.bind(store),
    };

    window.$api = store['$api'];
});
