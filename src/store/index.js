import { createStore } from 'vuex';
import account from "./account";
import general from "./general";
import global from "./global";
import resources from "./resources";
import evm from "./evm";
import rex from "./rex";
import { GeneralModule } from "./modules/general";
import { EosTransitModule } from "./modules/wallet/tlosWallet";
import { TlosBancorModule } from "./modules/swap/tlosBancor";
import { BancorModule } from "./modules/swap/index";
import { WalletModule } from "./modules/wallet/index";
import { NetworkModule } from "./modules/network/index";
import { TlosNetworkModule } from "./modules/network/tlosNetwork";
import { createProxy, extractVuexModule } from "vuex-class-component";


export default function() {
  const Store = createStore({
    modules: {
      general,
      account,
      global,
      resources,
      evm,
      rex
    },

    strict: process.env.DEV
  });

  return Store;
}

export const store = createStore({
  modules: Object.assign(
    Object.assign(
      Object.assign(
        Object.assign(
          Object.assign(
            Object.assign(
              Object.assign({}, extractVuexModule(TlosBancorModule)),
              extractVuexModule(GeneralModule)
            ),
            extractVuexModule(EosTransitModule)
          ),
          extractVuexModule(BancorModule)
        ),
        extractVuexModule(WalletModule)
      ),
      extractVuexModule(NetworkModule)
    ),
    extractVuexModule(TlosNetworkModule)
  ),
  strict: process.env.DEV
});

export const vxm = {
  general: createProxy(store, GeneralModule),
  wallet: createProxy(store, WalletModule),
  tlosWallet: createProxy(store, EosTransitModule),
  tlosBancor: createProxy(store, TlosBancorModule),
  bancor: createProxy(store, BancorModule),
  tlosNetwork: createProxy(store, TlosNetworkModule),
  network: createProxy(store, NetworkModule)
};
