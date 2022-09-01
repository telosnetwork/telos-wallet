import { UAL } from "universal-authenticator-library";
import { Anchor } from "ual-anchor";
import { Wombat } from "ual-wombat";

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
    new Wombat([chain], { appName: process.env.APP_NAME }),
    new Anchor([chain], { appName: process.env.APP_NAME })
  ];

  const ual = new UAL([chain], "ual", authenticators);
  store["$ual"] = ual;
  Vue.prototype.$ual = ual;
};
