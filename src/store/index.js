import Vue from "vue";
import Vuex from "vuex";

import account from "./account"

Vue.use(Vuex);

export default function() {
  const Store = new Vuex.Store({
    modules: {
      account
    },

    strict: process.env.DEV
  });

  return Store;
}
