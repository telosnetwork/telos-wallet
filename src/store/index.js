import { createStore } from 'vuex';
import account from "~/store/account";
import general from "~/store/general";
import global from "~/store/global";
import resources from "~/store/resources";
import evm from "~/store/evm";
import rex from "~/store/rex";
import { GeneralModule } from "~/store/modules/general";
import { EosTransitModule } from "~/store/modules/wallet/tlosWallet";
import { TlosBancorModule } from "~/store/modules/swap/tlosBancor";
import { BancorModule } from "~/store/modules/swap/index";
import { WalletModule } from "~/store/modules/wallet/index";
import { NetworkModule } from "~/store/modules/network/index";
import { TlosNetworkModule } from "~/store/modules/network/tlosNetwork";
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
