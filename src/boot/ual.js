import { UAL } from "universal-authenticator-library";
import { KeycatAuthenticator } from "../utils/ual-telos-keycat";
import { Scatter } from "ual-scatter";
import { Sqrl } from "@smontero/ual-sqrl";
import { Anchor } from "ual-anchor";

export default async ({ Vue, store }) => {
  const chain = {
    chainId: process.env.NETWORK_CHAIN_ID,
    rpcEndpoints: [
      {
        protocol: process.env.NETWORK_PROTOCOL,
        host: process.env.NETWORK_HOST,
        port: process.env.NETWORK_PORT
      }
    ]
  };

  const authenticators = [
    new KeycatAuthenticator([chain], { appName: process.env.APP_NAME }),
    new Sqrl([chain], { appName: process.env.APP_NAME }),
    new Anchor([chain], { appName: process.env.APP_NAME }),
    new Scatter([chain], { appName: process.env.APP_NAME })
  ];

  const config = {
    name:
      process.env.NETWORK_CHAIN_ID ===
      "4667b205c6838ef70ff7988f6e8257e8be0e1284a2f59699054a018f743b1d11"
        ? "telos"
        : "telos-testnet",
    nodes: [`${process.env.HYPERION_ENDPOINT}:${process.env.NETWORK_PORT}`],
    plugin: "eos"
  };
  const injectConfig = module => {
    const Plugin = module.default;
    return new Plugin(config);
  };
  const loader = import("../utils/telos-keycat/plugins/EosPlugin").then(
    injectConfig
  );
  const blockchain = await loader;
  store["$blockchain"] = blockchain;
  Vue.prototype.$blockchain = blockchain;

  const ual = new UAL([chain], "ual", authenticators);
  store["$ual"] = ual;
  Vue.prototype.$ual = ual;
};
