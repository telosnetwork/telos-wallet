import Vue from "vue";
import Vuex from "vuex";

import account from "./account";
import general from "./general";
import global from "./global";

Vue.use(Vuex);

export default function() {
  const Store = new Vuex.Store({
    modules: {
      general,
      account,
      global,
    },

    strict: process.env.DEV
  });

  return Store;
}
