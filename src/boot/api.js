import { boot } from 'quasar/wrappers';
import { Api, JsonRpc } from "eosjs";
import { TelosEvmApi } from "@telosnetwork/telosevm-js";
import { CosignAuthorityProvider, cosign_noop } from 'src/boot/fuel';

const signTransaction = async function (actions, detail = null) {
  actions.forEach(action => {
    if (!action.authorization || !action.authorization.length) {
      action.authorization = [
        {
          actor: this.state.account.accountName,
          permission: "active"
        }
      ];
    }
  });
  let transaction = null;
  try {

    // Greymass fuell noop action at first to delegate resource costs
    actions.unshift(cosign_noop);

    if (this.$type === "ual") {
        transaction = await this.$ualUser.signTransaction(
          {
            actions
          },
          {
            blocksBehind: 3,
            expireSeconds: 30
          }
        );
      }
  } catch (e) {
    console.log(actions, e.cause.message);
    throw e.cause.message;
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
    ...options
  });
};

const getAccount = async function (accountName) {
  const rpc = this.$api.getRpc();
  return await rpc.get_account(accountName);
};

export default boot(async ({ store }) => {

  // const rpc = new JsonRpc(
  //   `${process.env.NETWORK_PROTOCOL}://${process.env.NETWORK_HOST}:${process.env.NETWORK_PORT}`
  // );
  // TODO: this is a quick snippet to see if it works. We need to handle getting this endpoint from somewhere else.
  const rpc = new JsonRpc('https://telos.greymass.com');

  store["$account"] = {};

  store["$defaultApi"] = new Api({
    authorityProvider: new CosignAuthorityProvider(),
    rpc,
    textDecoder: new TextDecoder(),
    textEncoder: new TextEncoder()
  });

  store["$evmApi"] = new TelosEvmApi({
    endpoint: process.env.HYPERION_ENDPOINT,
    chainId: process.env.CHAIN_NAME === "telos" ? 40 : 41,
    ethPrivateKeys: [],
    telosContract: process.env.EVM_CONTRACT,
    telosPrivateKeys: []
  });

  store["$api"] = {
    signTransaction: signTransaction.bind(store),
    getTableRows: getTableRows.bind(store),
    getAccount: getAccount.bind(store),
    getRpc: getRpc.bind(store)
  };
  window.$api = store["$api"];
});
