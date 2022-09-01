import { store } from 'quasar/wrappers';
import { createStore } from 'vuex';
import general from './general';
import evm from './evm';
import account from "./account";
import global from "./global";
import resources from "./resources";
import rex from "./rex";
import { GeneralModule } from "./modules/general";
import { EosTransitModule } from "./modules/wallet/tlosWallet";
import { TlosBancorModule } from "./modules/swap/tlosBancor";
import { BancorModule } from "./modules/swap/index";
import { WalletModule } from "./modules/wallet/index";
import { NetworkModule } from "./modules/network/index";
import { TlosNetworkModule } from "./modules/network/tlosNetwork";
import { createProxy, extractVuexModule } from "vuex-class-component";

export default store(function (/* { ssrContext } */) {
  const Store = createStore({
      modules: {
        general,
        account,
        global,
        resources,
        evm,
        rex
      },

      // enable strict mode (adds overhead!)
      // for dev mode only
      strict: process.env.DEV,
  });

  return Store;
});

// TODO: refactor this
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






