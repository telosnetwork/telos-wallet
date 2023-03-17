// Pinia Global Store
import { defineStore } from 'pinia'
import { GlobalState } from "src/types/pinia.GlobalState.type";

export const useGlobalStore = defineStore('global', {
  // convert to a function
  state: (): GlobalState => (globalInitialState),
  getters: {
    footerHeight: ({ footer_height }) => footer_height,
    minSpace: ({ min_space }) => min_space,
    maxSpace: ({ max_space }) => max_space,
    suggestTokens: ({ suggest_tokens }) => suggest_tokens,
    supportTokens: ({ support_tokens }) => support_tokens,
    pTokens: ({ p_tokens }) => p_tokens,
    pTokenNetworks: ({ p_token_networks }) => p_token_networks,
  },
  actions: {
    setFooterHeight (height:number) {
      this.footer_height = height;
    },
  }
})

export const globalInitialState: GlobalState = {
  footer_height: 33,
  min_space: 60,
  max_space: 140,
  suggest_tokens: [
    { contract: "eosio.token", sym: "tlos" },
    { contract: "btc.ptokens", sym: "pbtc" },
    { contract: "eth.ptokens", sym: "peth" },
    { contract: "link.ptokens", sym: "plink" },
    { contract: "usdc.ptokens", sym: "pusdc" },
    { contract: "usdt.ptokens", sym: "pusdt" },
    { contract: "pnt.ptokens", sym: "pnt" }
  ],
  support_tokens: [
    "tlos",
    "pbtc",
    "peth",
    "plink",
    "pusdc",
    "pusdt",
    "pnt",
    "seeds",
    "qbe",
    "teach",
    "dric",
    "gem",
    "ezar",
    "sqrl",
    "tlosdac",
    "sand",
    "heart",
    "kanda",
    "ynt",
    "cnt",
    "viita",
    "viict",
    "acorn",
    "edna",
    "robo",
    "word",
    "eosp",
    "legend",
    "people",
    "steemp",
    "nfd",
    "ggwp",
    "date",
    "golos",
    "btcp",
    "ecoin"
  ],
  p_tokens: ["pbtc", "tlos"],
  p_token_networks: {
    pbtc: {
      telos: "Telos",
      ptoken: "Bitcoin"
    },
    tlos: {
      telos: "Telos",
      tevm: "tEVM",
      ethereum: "Ethereum"
    }
  }
};

