import { Sym } from "eos-common";
const tlosToken = {
    contract: "eosio.token",
    symbol: "4,TLOS"
};
const oldRelays = [
    {
        contract: "tlosdx.swaps",
        smartToken: {
            contract: "relays.swaps",
            symbol: "8,TLOSDX"
        },
        reserves: [
            {
                contract: "tokens.swaps",
                symbol: "4,TLOSD"
            },
            tlosToken
        ]
    },
    {
        contract: "zar.tbn",
        smartToken: {
            contract: "zarrelay.tbn",
            symbol: "8,TLOSZAR"
        },
        reserves: [
            {
                contract: "stablecoin.z",
                symbol: "2,EZAR"
            },
            tlosToken
        ]
    },
    {
        contract: "cx.tbn",
        smartToken: {
            contract: "cxrelay.tbn",
            symbol: "8,TLOSCX"
        },
        reserves: [
            {
                contract: "thecooltoken",
                symbol: "4,COOL"
            },
            tlosToken
        ]
    },
    {
        contract: "bnt.swaps",
        smartToken: {
            contract: "relays.swaps",
            symbol: "8,TLOSBNT"
        },
        reserves: [
            {
                contract: "tokens.swaps",
                symbol: "10,BNT"
            },
            tlosToken
        ]
    },
    {
        contract: "btc.swaps",
        smartToken: {
            contract: "relays.swaps",
            symbol: "8,TLOSBTC"
        },
        reserves: [
            {
                contract: "btc.ptokens",
                symbol: "8,PBTC"
            },
            tlosToken
        ]
    },
    {
        contract: "dric.tbn",
        smartToken: {
            contract: "dricrly.tbn",
            symbol: "8,TLSDRIC"
        },
        reserves: [
            {
                contract: "persiandaric",
                symbol: "4,DRIC"
            },
            tlosToken
        ]
    },
    {
        contract: "eos.swaps",
        smartToken: {
            contract: "relays.swaps",
            symbol: "8,TLOSEOS"
        },
        reserves: [
            {
                contract: "tokens.swaps",
                symbol: "4,EOS"
            },
            tlosToken
        ]
    },
    {
        contract: "ecoin.swaps",
        smartToken: {
            contract: "relays.swaps",
            symbol: "8,TLOSECO"
        },
        reserves: [
            {
                contract: "ecoin1nation",
                symbol: "4,ECOIN"
            },
            tlosToken
        ]
    },
    {
        contract: "gem.tbn",
        smartToken: {
            contract: "gemrelay.tbn",
            symbol: "8,TLOSGEM"
        },
        reserves: [
            {
                contract: "lord",
                symbol: "4,GEM"
            },
            tlosToken
        ]
    },
    {
        contract: "kanda.swaps",
        smartToken: {
            contract: "relays.swaps",
            symbol: "8,TLOSKAN"
        },
        reserves: [
            {
                contract: "telokandaone",
                symbol: "8,KANDA"
            },
            tlosToken
        ]
    },
    {
        contract: "seeds.tbn",
        smartToken: {
            contract: "seedsrly.tbn",
            symbol: "8,TLSEEDS"
        },
        reserves: [
            {
                contract: "token.seeds",
                symbol: "4,SEEDS"
            },
            tlosToken
        ]
    },
    {
        contract: "reward.swaps",
        smartToken: {
            contract: "relays.swaps",
            symbol: "8,TLOSWAP"
        },
        reserves: [
            {
                contract: "swap.swaps",
                symbol: "8,SWAP"
            },
            tlosToken
        ]
    },
    {
        contract: "ppl.tbn",
        smartToken: {
            contract: "pplrelay.tbn",
            symbol: "8,TLOSPPL"
        },
        reserves: [
            {
                contract: "vapaeetokens",
                symbol: "4,PEOPLE"
            },
            tlosToken
        ]
    },
    {
        contract: "ynt.tbn",
        smartToken: {
            contract: "yntrelay.tbn",
            symbol: "8,TLOSYNT"
        },
        reserves: [
            {
                contract: "sesacashmain",
                symbol: "4,YNT"
            },
            tlosToken
        ]
    },
    {
        contract: "san.tbn",
        smartToken: {
            contract: "sanrelay.tbn",
            symbol: "8,TLOSSAN"
        },
        reserves: [
            {
                contract: "sandiegocoin",
                symbol: "8,SAND"
            },
            tlosToken
        ]
    },
    {
        contract: "rev.tbn",
        smartToken: {
            contract: "revrelay.tbn",
            symbol: "8,TLOSREV"
        },
        reserves: [
            {
                contract: "revelation21",
                symbol: "4,HEART"
            },
            tlosToken
        ]
    },
    {
        contract: "qbe.tbn",
        smartToken: {
            contract: "qberelay.tbn",
            symbol: "8,TLOSQBE"
        },
        reserves: [
            {
                contract: "qubicletoken",
                symbol: "4,QBE"
            },
            tlosToken
        ]
    },
    {
        contract: "sql.tbn",
        smartToken: {
            contract: "sqlrelay.tbn",
            symbol: "8,TLOSSQL"
        },
        reserves: [
            {
                contract: "sqrlwalletio",
                symbol: "4,SQRL"
            },
            tlosToken
        ]
    },
    {
        contract: "dac.tbn",
        smartToken: {
            contract: "dacrelay.tbn",
            symbol: "8,TLSDAC"
        },
        reserves: [
            {
                contract: "telosdacdrop",
                symbol: "4,TLOSDAC"
            },
            tlosToken
        ]
    }
];
export const getHardCodedRelays = () => oldRelays.map(relay => (
    {
        ...relay,
        isMultiContract: false,
        smartToken: {
            contract: relay.smartToken.contract,
            symbol: new Sym(relay.smartToken.symbol)
        },
        reserves: relay.reserves.map(reserve => ({
            ...reserve,
            symbol: new Sym(reserve.symbol)
        }))
    })
);