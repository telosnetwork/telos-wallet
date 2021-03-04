import { __awaiter } from "tslib";
import { vxm } from "../store";
import { Asset, asset_to_number, number_to_asset, Sym } from "eos-common";
import { rpc } from "./rpc";
import { sortByNetworkTokens } from "./sortByNetworkTokens";
export const networkTokens = ["TLOS"];
export const isOdd = (num) => num % 2 == 1;
export const multiSteps = ({ items, onUpdate }) => __awaiter(void 0, void 0, void 0, function* () {
    let state = {};
    for (const todo in items) {
        let steps = items.map((todo, index) => ({
            name: String(index),
            description: todo.description
        }));
        if (typeof onUpdate == "function") {
            onUpdate(Number(todo), steps);
        }
        else if (typeof onUpdate !== "undefined") {
            throw new Error("onUpdate should be either a function or undefined");
        }
        let newState = yield items[todo].task(state);
        if (typeof newState !== "undefined") {
            state = newState;
        }
    }
    return state;
});
const telosRpc = rpc;
export const getSxContracts = () => __awaiter(void 0, void 0, void 0, function* () {
    const res = (yield rpc.get_table_rows({
        code: "config.swaps",
        table: "swap",
        scope: "config.swaps"
    }));
    return res.rows.map(set => ({
        contract: set.contract,
        tokens: set.ext_tokens.map(token => ({
            contract: token.contract,
            symbol: new Sym(token.sym).code().to_string()
        }))
    }));
});
export const findOrThrow = (arr, iteratee, message) => {
    const res = arr.find(iteratee);
    if (!res)
        throw new Error(message || "Failed to find object in find or throw");
    return res;
};
export const compareToken = (a, b) => compareString(a.contract, b.contract) && compareString(a.symbol, b.symbol);
export const compareString = (stringOne, stringTwo) => {
    const strings = [stringOne, stringTwo];
    if (!strings.every(str => typeof str == "string"))
        throw new Error(`String one: ${stringOne} String two: ${stringTwo} one of them are falsy or not a string`);
    return stringOne.toLowerCase() == stringTwo.toLowerCase();
};
export const fetchUsdPriceOfTlos = () => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield rpc.get_table_rows({
        code: "tlosto.seeds",
        table: "price",
        scope: "tlosto.seeds"
    });
    if (res.rows.length == 0)
        throw new Error(`Failed fetching USD price of TLOS`);
    const usdPriceOfTlosString = res.rows[0].current_tlos_per_usd;
    const usdPriceOfTlosAsset = new Asset(usdPriceOfTlosString);
    const usdPriceOfTlos = 1 / asset_to_number(usdPriceOfTlosAsset);
    return usdPriceOfTlos;
});
export const updateArray = (arr, conditioner, updater) => arr.map(element => (conditioner(element) ? updater(element) : element));
export const fetchReserveBalance = (converterContract, reserveTokenAddress, versionNumber) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const res = yield converterContract.methods[Number(versionNumber) >= 17 ? "getConnectorBalance" : "getReserveBalance"](reserveTokenAddress).call();
        return res;
    }
    catch (e) {
        try {
            const res = yield converterContract.methods[Number(versionNumber) >= 17
                ? "getReserveBalance"
                : "getConnectorBalance"](reserveTokenAddress).call();
            return res;
        }
        catch (e) {
            throw new Error("Failed getting reserve balance" + e);
        }
    }
});
export const fetchTokenSymbol = (contractName, symbolName) => __awaiter(void 0, void 0, void 0, function* () {
    const statRes = yield rpc.get_table_rows({
        code: contractName,
        scope: symbolName,
        table: "stat"
    });
    if (statRes.rows.length == 0)
        throw new Error(`Unexpected stats table return from tokenContract ${contractName} ${symbolName}`);
    const maxSupplyAssetString = statRes.rows[0].max_supply;
    const maxSupplyAsset = new Asset(maxSupplyAssetString);
    return maxSupplyAsset.symbol;
});
export const getBalance = (contract, symbolName, precision) => __awaiter(void 0, void 0, void 0, function* () {
    const account = isAuthenticatedViaModule(vxm.tlosWallet);
    const res = yield rpc.get_table_rows({
        code: contract,
        scope: account,
        table: "accounts",
        limit: 99
    });
    const balance = res.rows.find(balance => compareString(new Asset(balance.balance).symbol.code().to_string(), symbolName));
    if (!balance) {
        if (typeof precision == "number") {
            return number_to_asset(0, new Sym(symbolName, precision)).to_string();
        }
        else {
            return number_to_asset(0, new Sym(symbolName, 4)).to_string();
        }
    }
    return balance.balance;
});
export const fetchTokenStats = (contract, symbol) => __awaiter(void 0, void 0, void 0, function* () {
    const tableResult = yield telosRpc.get_table_rows({
        code: contract,
        table: "stat",
        scope: symbol,
        limit: 1
    });
    const tokenExists = tableResult.rows.length > 0;
    if (!tokenExists)
        throw new Error("Token does not exist");
    const { supply, max_supply } = tableResult.rows[0];
    return {
        supply: new Asset(supply),
        max_supply: new Asset(max_supply)
    };
});
export const retryPromise = (promise, maxAttempts = 10, interval = 1000) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        for (let i = 0; i < maxAttempts; i++) {
            try {
                return resolve(yield promise());
            }
            catch (e) {
                yield new Promise(res => setTimeout(res, interval));
                if (i == maxAttempts)
                    reject(e);
            }
        }
    }));
});
const isValidBalance = (data) => typeof data.contract == "string" &&
    typeof data.symbol == "string" &&
    data.contract.length > 0 &&
    data.symbol.length > 0;
export const getTokenBalances = (accountName) => __awaiter(void 0, void 0, void 0, function* () {
    return { account: "", query_time: 0, tokens: [] };
});
export const identifyVersionBySha3ByteCodeHash = (sha3Hash) => {
    if (sha3Hash ==
        "0xf0a5de528f6d887b14706f0e66b20bee0d4c81078b6de9f395250e287e09e55f")
        return "11";
    throw new Error("Failed to identify version of Pool");
};
const isAuthenticatedViaModule = (module) => {
    const isAuthenticated = module.wallet && module.wallet.auth && module.wallet.auth.accountName;
    if (!isAuthenticated)
        throw new Error("Not logged in");
    return isAuthenticated;
};
export const getBankBalance = () => __awaiter(void 0, void 0, void 0, function* () {
    const account = isAuthenticatedViaModule(vxm.tlosWallet);
    const res = yield rpc.get_table_rows({
        code: process.env.VUE_APP_MULTICONTRACT,
        scope: account,
        table: "accounts"
    });
    return res.rows;
});
export var Feature;
(function (Feature) {
    Feature[Feature["Trade"] = 0] = "Trade";
    Feature[Feature["Wallet"] = 1] = "Wallet";
    Feature[Feature["Liquidity"] = 2] = "Liquidity";
})(Feature || (Feature = {}));
export const services = [
    {
        namespace: "tlos",
        features: [Feature.Trade, Feature.Liquidity, Feature.Wallet]
    },
    { namespace: "usds", features: [Feature.Trade, Feature.Wallet] },
    { namespace: "xchain", features: [Feature.Bridge] }
];
export const buildTokenId = ({ contract, symbol }) => contract + "-" + symbol;
export const fetchMultiRelays = () => __awaiter(void 0, void 0, void 0, function* () {
    return [];
});
export const fetchMultiRelay = (smartTokenSymbol) => __awaiter(void 0, void 0, void 0, function* () {
    const relays = yield fetchMultiRelays();
    const relay = findOrThrow(relays, relay => compareString(relay.smartToken.symbol, smartTokenSymbol), `failed to find multi relay with smart token symbol of ${smartTokenSymbol}`);
    return Object.assign(Object.assign({}, relay), {
        reserves: sortByNetworkTokens(relay.reserves, reserve => reserve.symbol, [
            "TLOS"
        ])
    });
});

export const getTokenMeta = () => __awaiter(void 0, void 0, void 0, function* () {
    const res = require('../../tokens/tokens.json');
    return res
        .filter(token => compareString(token.chain, "eos"))
        .map(token => (Object.assign(Object.assign({}, token), { id: buildTokenId({ contract: token.account, symbol: token.symbol }) })));
});
export const fetchTradeData = () => __awaiter(void 0, void 0, void 0, function* () {
    const rawTradeData = yield telosRpc.get_table_rows({
        code: "data.tbn",
        table: "tradedata",
        scope: "data.tbn",
        limit: 100
    });
    const dataExists = rawTradeData.rows.length > 0;
    if (!dataExists)
        throw new Error("Trade data not found");
    const parsedTradeData = rawTradeData.rows;
    let usdPriceOfTlos = yield vxm.bancor.fetchusdPriceOfTlos();
    let usdTlos24hPriceMove = yield vxm.bancor.fetchUsd24hPriceMove();
    let newTlosObj = {};
    newTlosObj.id = 1;
    newTlosObj.code = "TLOS";
    newTlosObj.name = newTlosObj.code;
    newTlosObj.primaryCommunityImageName = newTlosObj.code;
    newTlosObj.liquidityDepth = 0.0;
    newTlosObj.price = usdPriceOfTlos;
    newTlosObj.change24h = 100.0 * usdTlos24hPriceMove;
    let volume24h = {};
    volume24h.USD = 0.0;
    newTlosObj.volume24h = volume24h;
    newTlosObj.smartPrice = 0.0;
    newTlosObj.smartPriceApr = 0.0;
    let newArr = [];
    let i = 2;
    parsedTradeData.forEach(function (itemObject) {
        let newObj = {};
        newObj.id = i;
        let tokenCode = itemObject.liquidity_depth.find((token) => !compareString(token.key, "TLOS")).key;
        newObj.code = tokenCode;
        newObj.name = tokenCode;
        newObj.primaryCommunityImageName = newObj.code;
        if (itemObject.liquidity_depth.find((token) => compareString(token.key, "TLOS"))) {
            newObj.liquidityDepth =
                itemObject.liquidity_depth
                    .find((token) => compareString(token.key, "TLOS"))
                    .value.split(" ")[0] *
                usdPriceOfTlos *
                2.0;
            newObj.price =
                itemObject.price.find((token) => compareString(token.key, "TLOS"))
                    .value * usdPriceOfTlos;
            let raw24hChange = itemObject.price_change_24h.find((token) => compareString(token.key, "TLOS")).value * usdPriceOfTlos;
            let a = 1.0 / (1.0 + usdTlos24hPriceMove);
            newObj.change24h =
                100.0 * (newObj.price / (a * (newObj.price - raw24hChange)) - 1.0);
            let volume24h = {};
            volume24h.USD =
                itemObject.volume_24h
                    .find((token) => compareString(token.key, "TLOS"))
                    .value.split(" ")[0] * usdPriceOfTlos;
            newObj.volume24h = volume24h;
            let smartPrice = itemObject.smart_price
                .find((token) => compareString(token.key, "TLOS"))
                .value.split(" ")[0];
            let smartPriceApr = itemObject.smart_price_change_30d
                .find((token) => compareString(token.key, "TLOS"))
                .value.split(" ")[0];
            newObj.smartPrice = smartPrice;
            newObj.smartPriceApr = smartPriceApr;
            newTlosObj.liquidityDepth += newObj.liquidityDepth;
            newTlosObj.volume24h.USD += newObj.volume24h.USD;
            newArr.push(newObj);
        }
        i++;
    });
    newArr.push(newTlosObj);
    return newArr;
});