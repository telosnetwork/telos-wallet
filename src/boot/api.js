import { boot } from 'quasar/wrappers';
import axios from 'axios';
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

const holder = {};
export default boot(async ({ store, app }) => {
    holder.store = store;
    holder.app = app;
});

export const resetNativeApi = async function (chain) {
    if (!chain.settings.isNative()) {
        return;
    }
    const p = chain.settings.getRPCEndpoint();
    const url = `${p.protocol}://${p.host}:${p.port}${p.path ?? ''}`;
    const rpc = new JsonRpc(url);

    holder.store['$account'] = {};

    holder.store['$defaultApi'] = new Api({
        rpc,
        textDecoder: new TextDecoder(),
        textEncoder: new TextEncoder(),
    });

    holder.store['$evmApi'] = new TelosEvmApi({
        endpoint: chain.settings.getHyperionEndpoint(),
        chainId: chain.settings.getNetwork() === 'telos' ? 40 : 41,
        ethPrivateKeys: [],
        telosContract: process.env.EVM_CONTRACT,
        telosPrivateKeys: [],
    });

    holder.store['$api'] = {
        getInfo: getInfo.bind(holder.store),
        getAbi: getAbi.bind(holder.store),
        signTransaction: signTransaction.bind(holder.store),
        getTableRows: getTableRows.bind(holder.store),
        getAccount: getAccount.bind(holder.store),
        getRpc: getRpc.bind(holder.store),
    };

    window.$api = holder.store['$api'];

    holder.hyperion = axios.create({
        baseURL: chain.settings.getHyperionEndpoint(),
    });
};

export const getHyperion = function () {
    return holder.hyperion;
};


