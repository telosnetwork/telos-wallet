import { Api, JsonRpc } from "eosjs";

const signTransaction = async function(actions) {
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
    if (this.$type === "ual") {
      if (this.$idx === 0) {
        if (!this.$account.privateKey) {
          this.$account.needAuth = true;
          return 'needAuth';
        }
        transaction = await this.$blockchain.transact({
          account: this.$account.account,
          password: this.$account.privateKey,
          params: [
            {
              actions
            },
            {
              blocksBehind: 3,
              broadcast: true,
              expireSeconds: 30
            }
          ]
        })
      } else {
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
    }
  } catch (e) {
    console.log(actions, e.cause.message);
    throw e.cause.message;
  }
  return transaction;
};

const getRpc = function () {
  return this.$type === "ual" ? this.$ualUser.rpc : this.$defaultApi.rpc;
}

const getTableRows = async function(options) {
  const rpc = this.$api.getRpc();
  return await rpc.get_table_rows({
    json: true,
    ...options
  });
};

const getAccount = async function (accountName) {
  const rpc = this.$api.getRpc();
  return await rpc.get_account(accountName);
}

export default ({ store }) => {
  const rpc = new JsonRpc(
    `${process.env.NETWORK_PROTOCOL}://${process.env.NETWORK_HOST}:${process.env.NETWORK_PORT}`
  );
  
  store["$account"] = {};

  store["$defaultApi"] = new Api({
    rpc,
    textDecoder: new TextDecoder(),
    textEncoder: new TextEncoder()
  });

  store["$api"] = {
    signTransaction: signTransaction.bind(store),
    getTableRows: getTableRows.bind(store),
    getAccount: getAccount.bind(store),
    getRpc: getRpc.bind(store)
  };
  window.$api = store["$api"];
};
