import { __awaiter } from "tslib";
import { Decimal } from "decimal.js";
import { Asset, asset_to_number, asset } from "eos-common";
import _ from "lodash";
import { compareString } from "~/api/helpers";
export function calculateReturn(balanceFrom, balanceTo, amount) {
    if (!balanceFrom.symbol.isEqual(amount.symbol))
        throw new Error("From symbol does not match amount symbol");
    if (amount.amount >= balanceFrom.amount)
        throw new Error("Impossible to buy the entire reserve or more");
    Decimal.set({ precision: 15, rounding: Decimal.ROUND_DOWN });
    const balanceFromNumber = new Decimal(asset_to_number(balanceFrom));
    const balanceToNumber = new Decimal(asset_to_number(balanceTo));
    const amountNumber = new Decimal(asset_to_number(amount));
    const reward = amountNumber
        .div(balanceFromNumber.plus(amountNumber))
        .times(balanceToNumber);
    const rewardAsset = new Asset(reward
        .times(Math.pow(10, balanceTo.symbol.precision()))
        .toDecimalPlaces(0, Decimal.ROUND_DOWN)
        .toNumber(), balanceTo.symbol);
    const slippage = asset_to_number(amount) / asset_to_number(balanceFrom);
    return { reward: rewardAsset, slippage };
}
export function calculateCost(balanceFrom, balanceTo, amountDesired) {
    if (!balanceTo.symbol.isEqual(amountDesired.symbol))
        throw new Error("From symbol does not match amount symbol");
    if (amountDesired.amount >= balanceTo.amount)
        throw new Error("Impossible to buy the entire reserve or more");
    const balanceFromNumber = new Decimal(asset_to_number(balanceFrom));
    const balanceToNumber = new Decimal(asset_to_number(balanceTo));
    const amountNumber = new Decimal(asset_to_number(amountDesired));
    const oneNumber = new Decimal(1);
    Decimal.set({ precision: 15, rounding: Decimal.ROUND_UP });
    const reward = balanceFromNumber
        .div(oneNumber.minus(amountNumber.div(balanceToNumber)))
        .minus(balanceFromNumber);
    const rewardAsset = new Asset(reward
        .times(Math.pow(10, balanceFrom.symbol.precision()))
        .toDecimalPlaces(0, Decimal.ROUND_FLOOR)
        .toNumber(), balanceFrom.symbol);
    const slippage = asset_to_number(amountDesired) / asset_to_number(balanceTo);
    return { reward: rewardAsset, slippage };
}
export function concatAffiliate(memo, affiliateAccount, percentNumber) {
    return memo.concat(`,${affiliateAccount},${percentNumber}`);
}
export function composeMemo(converters, minReturn, destAccount, version = 1, feeAccount, feePercent) {
    const receiver = converters
        .map(({ account, symbol, multiContractSymbol }) => {
            return `${account}${multiContractSymbol ? `:${multiContractSymbol}` : ""} ${symbol}`;
        })
        .join(" ");
    const base = `${version},${receiver},${minReturn},${destAccount}`;
    if (feeAccount && feePercent) {
        return concatAffiliate(base, feeAccount, feePercent);
    }
    return base;
}
export function relaysToConvertPaths(from, relays) {
    return relays
        .map(relay => relay.reserves.map(token => {
            const base = {
                account: relay.contract,
                symbol: token.symbol.code().to_string()
            };
            return relay.isMultiContract
                ? Object.assign(Object.assign({}, base), { multiContractSymbol: relay.smartToken.symbol.code().to_string() }) : base;
        }))
        .reduce((prev, curr) => prev.concat(curr))
        .filter(converter => converter.symbol !== from.code().to_string())
        .reduce((accum, item) => {
            return accum.find((converter) => converter.symbol == item.symbol)
                ? accum
                : [...accum, item];
        }, []);
}
const tokenToSymbolName = (token) => token.symbol.code().to_string();
const symbolToSymbolName = (symbol) => symbol.code().to_string();
export function relayHasBothSymbols(symbol1, symbol2) {
    return function (relay) {
        return relay.reserves.every(token => tokenToSymbolName(token) == symbolToSymbolName(symbol1) ||
            tokenToSymbolName(token) == symbolToSymbolName(symbol2));
    };
}
const zip = (arr1, arr2) => {
    if (arr1.length !== arr2.length)
        throw new Error("These arrays aren't the same");
    return arr1.map((item, index) => [item, arr2[index]]);
};
const reservesAreSame = (one, two) => {
    return one.contract == two.contract && one.symbol == two.symbol;
};
const relaysAreSame = (one, two) => {
    const zippedReserves = zip(one.reserves, two.reserves);
    const matchingReserves = zippedReserves.every(([reserve, opposingReserve]) => reservesAreSame(reserve, opposingReserve));
    const matchingContract = one.contract == two.contract;
    return matchingContract && matchingReserves;
};
export function removeChoppedRelay(relays, departingRelay) {
    const res = relays.filter(relay => !relaysAreSame(relay, departingRelay));
    if (res.length + 1 !== relays.length)
        throw new Error("Failed to remove chopped relay");
    return res;
}
export const chopRelay = (item) => {
    return [
        {
            contract: item.contract,
            reserves: [item.reserves[0], item.smartToken]
        },
        {
            contract: item.contract,
            reserves: [item.reserves[1], item.smartToken]
        }
    ];
};
export const chopRelays = (relays) => {
    return relays.reduce((accum, item) => {
        const [relay1, relay2] = chopRelay(item);
        return [...accum, relay1, relay2];
    }, []);
};
export function getOppositeSymbol(relay, symbol) {
    const oppositeToken = relay.reserves.find(token => !token.symbol.isEqual(symbol));
    return oppositeToken.symbol;
}
function relayOffersSymbols(symbol1, symbol2) {
    return function (relay) {
        const inReserves = relay.reserves.every(token => token.symbol.isEqual(symbol1) || token.symbol.isEqual(symbol2));
        if (inReserves)
            return inReserves;
        const inReserve = relay.reserves.some(token => token.symbol.isEqual(symbol1) || token.symbol.isEqual(symbol2));
        const inSmartToken = relay.smartToken.symbol.isEqual(symbol1) ||
            relay.smartToken.symbol.isEqual(symbol2);
        return inReserve && inSmartToken;
    };
}
export function unChopRelays(choppedRelays, relays) {
    return choppedRelays.reduce((accum, choppedRelay) => {
        const relayOfInterest = relayOffersSymbols(choppedRelay.reserves[0].symbol, choppedRelay.reserves[1].symbol);
        const alreadyExistingRelay = accum.find(relayOfInterest);
        return alreadyExistingRelay
            ? accum
            : [...accum, relays.find(relayOfInterest)];
    }, []);
}
const buildAdjacencyList = (edges, nodes) => {
    const adjacencyList = new Map();
    nodes.forEach(node => adjacencyList.set(node, []));
    edges.forEach(([from, to]) => adjacencyList.get(from).push(to));
    edges.forEach(([from, to]) => adjacencyList.get(to).push(from));
    return adjacencyList;
};
const compareEdge = (edge1, edge2) => edge1.every(edge => edge2.some(e => compareString(edge, e)));
const dfs = (fromId, toId, adjacencyList) => new Promise(resolve => callbackDfs(fromId, toId, adjacencyList, resolve));
const callbackDfs = (start, goal, adjacencyList, callBack, visited = new Set(), path = [start]) => {
    visited.add(start);
    const destinations = adjacencyList.get(start);
    if (destinations.includes(goal)) {
        callBack([...path, goal]);
    }
    for (const destination of destinations) {
        if (!visited.has(destination)) {
            callbackDfs(destination, goal, adjacencyList, callBack, visited, [
                ...path,
                destination
            ]);
        }
    }
};
export function findNewPath(fromId, toId, pools, identifier) {
    return __awaiter(this, void 0, void 0, function* () {
        const edges = _.uniqWith(pools.map(identifier), compareEdge);
        const nodes = _.uniqWith(edges.flat(1), compareString);
        const adjacencyList = buildAdjacencyList(edges, nodes);
        const startExists = adjacencyList.get(fromId);
        const goalExists = adjacencyList.get(toId);
        if (!(startExists && goalExists))
            throw new Error(`Start ${fromId} or goal ${toId} does not exist in adjacency list`);
        const dfsResult = yield dfs(fromId, toId, adjacencyList);
        if (!dfsResult || dfsResult.length == 0)
            throw new Error("Failed to find path");
        const hops = _.chunk(dfsResult, 2).map((tokenIds, index, arr) => {
            let searchAbleIds;
            if (tokenIds.length < 2) {
                searchAbleIds = [arr[index - 1][1], tokenIds[0]];
            }
            else
                searchAbleIds = tokenIds;
            const accomodatingRelays = pools.filter(pool => {
                const ids = identifier(pool);
                return ids.every(id => searchAbleIds.some(i => id == i));
            });
            return accomodatingRelays;
        });
        return {
            path: dfsResult,
            hops
        };
    });
}
export function chargeFee(asset, decimalFee, magnitude = 1) {
    Decimal.set({ precision: 15, rounding: Decimal.ROUND_DOWN });
    const assetAmount = new Decimal(asset_to_number(asset));
    const one = new Decimal(1);
    const totalFee = assetAmount.times(one.minus(Decimal.pow(one.minus(decimalFee), magnitude)));
    const newAmount = assetAmount.minus(totalFee);
    return new Asset(newAmount
        .times(Math.pow(10, asset.symbol.precision()))
        .toDecimalPlaces(0, Decimal.ROUND_FLOOR)
        .toNumber(), asset.symbol);
}
export function addFee(asset, decimalFee, magnitude = 1) {
    Decimal.set({ precision: 15, rounding: Decimal.ROUND_DOWN });
    const assetAmount = new Decimal(asset_to_number(asset));
    const one = new Decimal(1);
    const totalFee = assetAmount.times(one.minus(Decimal.pow(one.minus(decimalFee), magnitude)));
    const newAmount = assetAmount.plus(totalFee);
    return new Asset(newAmount
        .times(Math.pow(10, asset.symbol.precision()))
        .toDecimalPlaces(0, Decimal.ROUND_FLOOR)
        .toNumber(), asset.symbol);
}
const sortReservesByAsset = (asset, reserves) => {
    if (!reserves.some(reserve => reserve.amount.symbol.isEqual(asset.symbol)))
        throw new Error("Asset does not exist in these reserves");
    return reserves.sort((a, b) => a.amount.symbol.isEqual(asset.symbol) ? -1 : 1);
};
const highestNumber = (number1, number2) => number1 > number2 ? number1 : number2;
export const findReturn = (amount, relaysPath) => relaysPath.reduce(({ amount, highestSlippage }, relay) => {
    const [fromReserve, toReserve] = sortReservesByAsset(amount, relay.reserves);
    const { reward, slippage } = calculateReturn(fromReserve.amount, toReserve.amount, amount);
    return {
        amount: chargeFee(reward, relay.fee, 2),
        highestSlippage: highestNumber(highestSlippage, slippage)
    };
}, { amount, highestSlippage: 0 });
export const findCost = (amount, relaysPath) => relaysPath.reverse().reduce(({ amount, highestSlippage }, relay) => {
    const [toReserve, fromReserve] = sortReservesByAsset(amount, relay.reserves);
    const { reward, slippage } = calculateCost(fromReserve.amount, toReserve.amount, amount);
    return {
        amount: addFee(reward, relay.fee, 2),
        highestSlippage: highestNumber(highestSlippage, slippage)
    };
}, { amount, highestSlippage: 0 });
export function fund(smartTokens, reserveBalance, smartSupply) {
    Decimal.set({ precision: 18, rounding: Decimal.ROUND_HALF_EVEN });
    const cost = new Decimal(reserveBalance.amount.toString())
        .times(smartTokens.amount.toString())
        .div(smartSupply.amount.toString());
    const assetAmount = cost.ceil().toNumber();
    return asset(assetAmount, reserveBalance.symbol);
}
export function calculateFundReturn(reserveTokens, reserveBalance, smartSupply) {
    Decimal.set({ precision: 18, rounding: Decimal.ROUND_HALF_EVEN });
    const one = new Decimal(1);
    // y(s+1) + 1 / r
    const reward = new Decimal(reserveTokens.amount.toString())
        .times(new Decimal(smartSupply.amount.toString()))
        .plus(one)
        .div(reserveBalance.amount.toString());
    const rewardAmount = reward.floor().toNumber();
    return asset(rewardAmount, smartSupply.symbol);
}