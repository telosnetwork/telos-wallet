export default () => ({
  footerHeight: 50,
  minSpace: 60,
  maxSpace: 140,
  suggestTokens: [
    { contract: "eosio.token", sym: "tlos" },
    { contract: "btc.ptokens", sym: "pbtc" },
    { contract: "eth.ptokens", sym: "peth" },
    { contract: "link.ptokens", sym: "plink" },
    { contract: "usdc.ptokens", sym: "pusdc" },
    { contract: "usdt.ptokens", sym: "pusdt" },
    { contract: "pnt.ptokens", sym: "pnt" }
  ],
  supportTokens: [
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
  pTokens: ["pbtc", "tlos"],
  pTokenNetworks: {
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
});
