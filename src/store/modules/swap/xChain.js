import { __awaiter, __decorate } from "tslib";
import { action, createModule, mutation } from "vuex-class-component";
import { vxm } from "../../../store";
import { get_fee, get_inverse_rate, get_rate, get_settings, get_slippage, get_spot_price, get_tokens, get_romote_tokens, get_volume, get_xchain_remote_tokens, get_xchain_settings, get_xchain_tokens } from "../../../api/xChain";
import { rpc } from "../../../api/rpc";
import { asset, asset_to_number, extended_asset, name, number_to_asset, Sym, symbol } from "eos-common";
import { buildTokenId, compareString, findOrThrow, getSxContracts, retryPromise } from "../../../api/helpers";
import _ from "lodash";
import wait from "waait";
import { Chain } from "../../../store/modules/wallet/tlosWallet";
const getRate = (asset, sym, tokens, settings) => {
    const rate = get_rate(asset, sym.code(), tokens, settings);
    const slippage = get_slippage(asset, sym.code(), tokens, settings);
    const fee = get_fee(asset, settings);
    return { rate, slippage, fee };
};
const getInverseRate = (asset, sym, tokens, settings) => {
    const rate = get_inverse_rate(asset, sym.code(), tokens, settings);
    const slippage = get_slippage(rate, sym.code(), tokens, settings);
    const fee = get_fee(rate, settings);
    return { rate, slippage, fee };
};
const shortAssetString = (asset) => `${asset_to_number(asset)} ${asset.symbol.code().to_string()}`;
const addNumbers = (acc, num) => acc + num;
const tokensToArray = (tokens) => Object.keys(tokens).map(key => tokens[key]);
const environmentCanBeTrusted = () => {
    const baseString = "eosio.token";
    const testAsset = extended_asset(asset("1.0000 TLOS"), name(baseString));
    return baseString == testAsset.contract.to_string();
};
const trusted = environmentCanBeTrusted();
const contractDb = [
//  { contract: "btc.ptokens", symbol: "PBTC" }
//  { contract: "tokens.swaps", symbol: "BTC" },
//  { contract: "tokens.swaps", symbol: "EOS" },
//  { contract: "tokens.swaps", symbol: "BNT" },
//  { contract: "tokens.swaps", symbol: "USDT" },
//  { contract: "tokens.swaps", symbol: "VIGOR" },
//  { contract: "tokens.swaps", symbol: "EOSDT" }
];
const symbolNameToContract = (symbolName) => findOrThrow(contractDb, token => compareString(token.symbol, symbolName), "failed to find hardcoded contract").contract;
const tokenToId = (token) => {
    const symbolName = token.sym.code().to_string();
    return buildTokenId({
        contract: trusted
            ? token.contract.to_string()
            : symbolNameToContract(symbolName),
        symbol: symbolName
    });
};
const VuexModule = createModule({
    strict: false
});
export class xChainModule extends VuexModule.With({ namespaced: "xchainBancor/" }) {
    constructor() {
        super(...arguments);
        this.newTokens = [];
        this.initiated = false;
        this.contracts = [];
        this.stats = [];
        this.xChainContracts = ["telosd.io"];
        this.xchainStats = [];
        this.lastLoaded = 0;
        //  @action async switchChain(chain: Chain) {
        //    console.log("xChain.switchChain", chain);
        //    this.updateStats();
        //  }
    }
    get wallet() {
        return "tlos";
    }
    get moreTokensAvailable() {
        return false;
    }
    get loadingTokens() {
        return !this.initiated;
    }
    get convertibleTokens() {
        return this.tokens.map(token => (Object.assign(Object.assign({}, token), { img: token.logo })));
    }
    loadMoreTokens() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    accountChange() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    get tokens() {
        if (!this.initiated) {
            return [];
        }
        return this.newTokens
            .map(token => {
            let name, logo;
            const { contract, symbol } = token;
            try {
                const eosModuleBorrowed = vxm.tlosBancor.tokenMeta.find(tokenMeta => tokenMeta.symbol == token.symbol);
                if (!eosModuleBorrowed)
                    throw new Error("Failed to find token");
                name = eosModuleBorrowed.name;
                logo = eosModuleBorrowed.logo;
            }
            catch (e) {
                console.warn("Failed to find name", token.symbol);
                name = token.symbol;
                logo =
                    "https://raw.githubusercontent.com/Telos-Swaps/TLOSD/master/icons/placeholder.jpg";
            }
            const baseToken = {
                contract,
                symbol
            };
            const tokenBalance = vxm.tlosNetwork.balance(baseToken);
            return Object.assign(Object.assign({}, token), { id: buildTokenId(baseToken), name,
                logo, balance: tokenBalance && tokenBalance.balance });
        })
            .sort((a, b) => b.liqDepth - a.liqDepth);
    }
    get token() {
        return (arg0) => {
            return findOrThrow(this.tokens, token => compareString(token.id, arg0), `getter: token ${arg0}`);
        };
    }
    setContracts(contracts) {
        this.contracts = contracts;
    }
    moduleInitiated() {
        this.initiated = true;
    }
    fetchContract(contract) {
        return __awaiter(this, void 0, void 0, function* () {
            const [tokens, volume, settings] = yield Promise.all([
                retryPromise(() => vxm.tlosWallet.chain == Chain.telos
                    ? get_tokens(rpc, contract)
                    : get_romote_tokens(rpc, contract), 4, 500),
                retryPromise(() => get_volume(rpc, contract, 1), 4, 500),
                retryPromise(() => get_settings(rpc, contract), 4, 500)
            ]);
            //    console.log("xChain.fetchContract", tokens);
            return { tokens, volume, settings, contract };
        });
    }
    fetchXchainContract(contract) {
        return __awaiter(this, void 0, void 0, function* () {
            const [tokens, remote_tokens, settings] = yield Promise.all([
                retryPromise(() => get_xchain_tokens(rpc, contract), 4, 500),
                retryPromise(() => get_xchain_remote_tokens(rpc, contract), 4, 500),
                retryPromise(() => get_xchain_settings(rpc, contract), 4, 500)
            ]);
            return { tokens, remote_tokens, settings, contract };
        });
    }
    checkPrices(contracts) {
        return __awaiter(this, void 0, void 0, function* () {
            //    console.log(contracts);
            const prices = yield Promise.all(contracts.map((contract) => __awaiter(this, void 0, void 0, function* () {
                const res = yield rpc.get_table_rows({
                    code: contract,
                    table: "spotprices",
                    scope: contract
                });
                const data = res.rows[0];
                return Object.assign({ contract }, data);
            })));
            console.log("usdsPrices", prices);
        });
    }
    refresh() {
        return __awaiter(this, void 0, void 0, function* () {
            //    console.log("refresh called on xchain, doing nothing");
            const registryData = yield getSxContracts();
            if (this.isAuthenticated) {
                vxm.tlosNetwork.getBalances({
                    tokens: registryData.flatMap(data => data.tokens),
                    slow: false
                });
            }
            const contracts = registryData.map(x => x.contract);
            this.checkPrices(contracts);
            this.setContracts(contracts);
            //    console.log(">>refresh");
            const allTokens = yield Promise.all(contracts.map(this.fetchContract));
            //    this.setStats(allTokens);
            retryPromise(() => this.updateStats(), 4, 1000);
            const all = yield Promise.all(allTokens.flatMap(token => this.buildTokens({
                tokens: token.tokens,
                volume: token.volume[0],
                settings: token.settings
            })));
            //    setInterval(() => this.checkRefresh(), 20000);
            const allWithId = all.flatMap(x => x.map(token => (Object.assign(Object.assign({}, token), { id: buildTokenId(token) }))));
            const uniqTokens = _.uniqBy(allWithId, "id").map(x => x.id);
            //    console.log("xChain.init.uniqTokens", uniqTokens);
            const newTokens = uniqTokens.map((id) => {
                const allTokensOfId = allWithId.filter(token => compareString(id, token.id));
                const { precision, contract, symbol } = allTokensOfId[0];
                const [highestLiquidityToken] = allTokensOfId.sort((a, b) => b.liqDepth - a.liqDepth);
                const { price } = highestLiquidityToken;
                const totalVolumeInToken = allTokensOfId
                    .map(token => token.volume24h)
                    .reduce(addNumbers, 0);
                const liqDepth = allTokensOfId
                    .map(token => token.liqDepth)
                    .reduce(addNumbers, 0);
                const volumeInPrice = price * totalVolumeInToken;
                return {
                    precision,
                    price,
                    contract,
                    id,
                    liqDepth,
                    symbol,
                    volume24h: volumeInPrice
                };
            });
            //    console.log("xChain.init.newTokens", newTokens);
            this.setNewTokens(newTokens);
            yield wait(10);
        });
    }
    init(params) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.initiated) {
                return this.refresh();
            }
            console.time("xchain");
            vxm.tlosBancor.init();
            const registryData = yield getSxContracts();
            if (this.isAuthenticated) {
                vxm.tlosNetwork.getBalances({
                    tokens: registryData.flatMap(data => data.tokens),
                    slow: false
                });
            }
            const contracts = registryData.map(x => x.contract);
            this.checkPrices(contracts);
            this.setContracts(contracts);
            //    console.log(">>init");
            const allTokens = yield Promise.all(contracts.map(this.fetchContract));
            this.setStats(allTokens);
            retryPromise(() => this.updateStats(), 4, 1000);
            const all = yield Promise.all(allTokens.flatMap(token => this.buildTokens({
                tokens: token.tokens,
                volume: token.volume[0],
                settings: token.settings
            })));
            //    const allXchainTokens = await Promise.all(this.xChainContracts.map(this.fetchXchainContract));
            //    console.log("xChain.init.allXchainTokens", allXchainTokens);
            setInterval(() => this.checkRefresh(), 20000);
            const allWithId = all.flatMap(x => x.map(token => (Object.assign(Object.assign({}, token), { id: buildTokenId(token) }))));
            const uniqTokens = _.uniqBy(allWithId, "id").map(x => x.id);
            //    console.log("xChain.init.uniqTokens", uniqTokens);
            const newTokens = uniqTokens.map((id) => {
                const allTokensOfId = allWithId.filter(token => compareString(id, token.id));
                const { precision, contract, symbol } = allTokensOfId[0];
                const [highestLiquidityToken] = allTokensOfId.sort((a, b) => b.liqDepth - a.liqDepth);
                const { price } = highestLiquidityToken;
                const totalVolumeInToken = allTokensOfId
                    .map(token => token.volume24h)
                    .reduce(addNumbers, 0);
                const liqDepth = allTokensOfId
                    .map(token => token.liqDepth)
                    .reduce(addNumbers, 0);
                const volumeInPrice = price * totalVolumeInToken;
                return {
                    precision,
                    price,
                    contract,
                    id,
                    liqDepth,
                    symbol,
                    volume24h: volumeInPrice
                };
            });
            //    console.log("xChain.init.newTokens", newTokens);
            this.setNewTokens(newTokens);
            this.moduleInitiated();
            yield wait(10);
            console.timeEnd("xchain");
        });
    }
    buildTokens({ tokens, volume, settings }) {
        return __awaiter(this, void 0, void 0, function* () {
            const tokensArray = tokensToArray(tokens);
            const addedPossibleVolumes = tokensArray.map(token => {
                const symbolName = token.sym.code().to_string();
                const hasVolume = Object.keys(volume.volume).includes(symbolName);
                return hasVolume
                    ? Object.assign(Object.assign({}, token), { volume24h: volume.volume[symbolName] }) : token;
            });
            const newTokens = yield Promise.all(addedPossibleVolumes.map((token) => __awaiter(this, void 0, void 0, function* () {
                const symbolName = token.sym.code().to_string();
                const precision = token.sym.precision();
                const contract = trusted
                    ? token.contract.to_string()
                    : symbolNameToContract(symbolName);
                const volume24h = token.volume24h || 0;
                const rate = yield get_spot_price("USDT", token.sym.code(), tokens, settings);
                const price = compareString(symbolName, "USDT") ? 1 : rate;
                return {
                    id: buildTokenId({ contract, symbol: symbolName }),
                    symbol: symbolName,
                    precision,
                    contract,
                    volume24h,
                    price,
                    liqDepth: asset_to_number(token.balance) * price
                };
            })));
            return newTokens;
        });
    }
    setNewTokens(tokens) {
        this.newTokens = tokens;
    }
    tokenById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return findOrThrow(this.newTokens, token => compareString(token.id, id), `failed to find ${id} in sx tokenById`);
        });
    }
    viewAmountToAsset(amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const token = yield this.tokenById(amount.id);
            return number_to_asset(Number(amount.amount), new Sym(token.symbol, token.precision));
        });
    }
    focusSymbol(symbolName) {
        return __awaiter(this, void 0, void 0, function* () {
            const tokens = this.newTokens.filter(token => compareString(token.symbol, symbolName));
            if (this.isAuthenticated) {
                vxm.tlosNetwork.getBalances({
                    tokens: tokens.map(token => ({
                        contract: token.contract,
                        symbol: token.symbol
                    }))
                });
            }
        });
    }
    refreshBalances(symbols = []) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    get isAuthenticated() {
        // @ts-ignore
        return this.$store.rootGetters[`${this.wallet}Wallet/isAuthenticated`];
    }
    convert(propose) {
        return __awaiter(this, void 0, void 0, function* () {
            if (compareString(propose.from.id, propose.to.id))
                throw new Error("Cannot convert a token to itself.");
            const accountName = this.isAuthenticated;
            const fromToken = yield this.tokenById(propose.from.id);
            const toToken = yield this.tokenById(propose.to.id);
            const tokens = [fromToken, toToken];
            const amountAsset = yield this.viewAmountToAsset(propose.from);
            const tokenContract = fromToken.contract;
            const poolReward = yield this.bestFromReturn({
                from: propose.from,
                toId: propose.to.id
            });
            const [txRes, originalBalances] = yield Promise.all([
                this.triggerTx([
                    {
                        account: tokenContract,
                        name: "transfer",
                        data: {
                            from: accountName,
                            to: poolReward.id,
                            memo: toToken.symbol,
                            quantity: amountAsset.to_string()
                        }
                    }
                ]),
                vxm.tlosNetwork.getBalances({
                    tokens
                })
            ]);
            vxm.tlosNetwork.pingTillChange({ originalBalances });
            return txRes.transaction_id;
        });
    }
    triggerTx(actions) {
        return __awaiter(this, void 0, void 0, function* () {
            // @ts-ignore
            return this.$store.dispatch("tlosWallet/tx", actions, { root: true });
        });
    }
    checkRefresh() {
        return __awaiter(this, void 0, void 0, function* () {
            const biggestGap = 5000;
            const timeNow = new Date().getTime();
            if (this.lastLoaded + biggestGap < timeNow) {
                this.updateStats();
            }
        });
    }
    getTradeData({ propose }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Object.keys(propose).includes("from")) {
                const data = propose;
                const toToken = yield this.tokenById(data.toId);
                const amountAsset = yield this.viewAmountToAsset(data.from);
                const opposingSymbol = symbol(toToken.symbol, toToken.precision);
                return {
                    opposingSymbol,
                    amountAsset
                };
            }
            else {
                const data = propose;
                const fromToken = yield this.tokenById(data.fromId);
                const amountAsset = yield this.viewAmountToAsset(data.to);
                const opposingSymbol = symbol(fromToken.symbol, fromToken.precision);
                return {
                    opposingSymbol,
                    amountAsset
                };
            }
        });
    }
    returnAcrossPools({ calculator, tokenIds }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (tokenIds.length !== 2)
                throw new Error("Can only trade between two tokens");
            const miniRelays = this.stats.map((stat) => ({
                id: stat.contract,
                tokenIds: tokensToArray(stat.tokens).map(tokenToId)
            }));
            const [fromId, toId] = tokenIds;
            const poolCandidates = miniRelays.filter(relay => relay.tokenIds.includes(fromId) && relay.tokenIds.includes(toId));
            if (poolCandidates.length == 0)
                throw new Error("Failed to find pool to facilitate trade, please convert to TLOS or TLOSD first");
            const hydratedPools = this.stats.filter(stat => poolCandidates.some(pool => compareString(stat.contract, pool.id)));
            return hydratedPools.map(pool => ({
                id: pool.contract,
                amount: calculator(pool.tokens, pool.settings)
            }));
        });
    }
    bestFromReturn(propose) {
        return __awaiter(this, void 0, void 0, function* () {
            const { opposingSymbol, amountAsset } = yield this.getTradeData({
                propose
            });
            const poolResults = yield this.returnAcrossPools({
                calculator: (tokens, settings) => getRate(amountAsset, opposingSymbol, tokens, settings),
                tokenIds: [propose.from.id, propose.toId]
            });
            const sortedByAmount = poolResults.sort((a, b) => b.amount.rate.isLessThan(a.amount.rate) ? -1 : 1);
            return sortedByAmount[0];
        });
    }
    bestToReturn(propose) {
        return __awaiter(this, void 0, void 0, function* () {
            const { opposingSymbol, amountAsset } = yield this.getTradeData({
                propose
            });
            const poolResults = yield this.returnAcrossPools({
                calculator: (tokens, settings) => getInverseRate(amountAsset, opposingSymbol, tokens, settings),
                tokenIds: [propose.fromId, propose.to.id]
            });
            const sortedByAmount = poolResults.sort((a, b) => b.amount.rate.isGreaterThan(a.amount.rate) ? -1 : 1);
            return sortedByAmount[0];
        });
    }
    getReturn(propose) {
        return __awaiter(this, void 0, void 0, function* () {
            if (compareString(propose.from.id, propose.toId))
                throw new Error("Cannot convert a token to itself.");
            this.checkRefresh();
            const bestReturn = yield this.bestFromReturn(propose);
            return {
                amount: String(asset_to_number(bestReturn.amount.rate)),
                fee: shortAssetString(bestReturn.amount.fee),
                slippage: bestReturn.amount.slippage
            };
        });
    }
    getCost(propose) {
        return __awaiter(this, void 0, void 0, function* () {
            if (compareString(propose.fromId, propose.to.id))
                throw new Error("Cannot convert a token to itself.");
            this.checkRefresh();
            const cheapestCost = yield this.bestToReturn(propose);
            return {
                amount: String(asset_to_number(cheapestCost.amount.rate)),
                fee: shortAssetString(cheapestCost.amount.fee),
                slippage: cheapestCost.amount.slippage
            };
        });
    }
    resetTimer() {
        this.lastLoaded = new Date().getTime();
    }
    updateStats() {
        return __awaiter(this, void 0, void 0, function* () {
            this.resetTimer();
            const contracts = this.contracts;
            //    console.log(">>updateStats");
            const allTokens = yield Promise.all(contracts.map(this.fetchContract));
            this.setStats(allTokens);
        });
    }
    setStats(stats) {
        this.stats = stats;
        this.lastLoaded = new Date().getTime();
    }
}
__decorate([
    action
], xChainModule.prototype, "loadMoreTokens", null);
__decorate([
    action
], xChainModule.prototype, "accountChange", null);
__decorate([
    mutation
], xChainModule.prototype, "setContracts", null);
__decorate([
    mutation
], xChainModule.prototype, "moduleInitiated", null);
__decorate([
    action
], xChainModule.prototype, "fetchContract", null);
__decorate([
    action
], xChainModule.prototype, "fetchXchainContract", null);
__decorate([
    action
], xChainModule.prototype, "checkPrices", null);
__decorate([
    action
], xChainModule.prototype, "refresh", null);
__decorate([
    action
], xChainModule.prototype, "init", null);
__decorate([
    action
], xChainModule.prototype, "buildTokens", null);
__decorate([
    mutation
], xChainModule.prototype, "setNewTokens", null);
__decorate([
    action
], xChainModule.prototype, "tokenById", null);
__decorate([
    action
], xChainModule.prototype, "viewAmountToAsset", null);
__decorate([
    action
], xChainModule.prototype, "focusSymbol", null);
__decorate([
    action
], xChainModule.prototype, "refreshBalances", null);
__decorate([
    action
], xChainModule.prototype, "convert", null);
__decorate([
    action
], xChainModule.prototype, "triggerTx", null);
__decorate([
    action
], xChainModule.prototype, "checkRefresh", null);
__decorate([
    action
], xChainModule.prototype, "getTradeData", null);
__decorate([
    action
], xChainModule.prototype, "returnAcrossPools", null);
__decorate([
    action
], xChainModule.prototype, "bestFromReturn", null);
__decorate([
    action
], xChainModule.prototype, "bestToReturn", null);
__decorate([
    action
], xChainModule.prototype, "getReturn", null);
__decorate([
    action
], xChainModule.prototype, "getCost", null);
__decorate([
    mutation
], xChainModule.prototype, "resetTimer", null);
__decorate([
    action
], xChainModule.prototype, "updateStats", null);
__decorate([
    mutation
], xChainModule.prototype, "setStats", null);
//# sourceMappingURL=xChain.js.map