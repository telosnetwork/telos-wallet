import { __awaiter, __decorate } from "tslib";
import { createModule, mutation, action } from "vuex-class-component";
import {
    getBalance,
    getTokenBalances,
    compareString,
    compareToken
} from "../../../api/helpers";
import { vxm } from "../../../store";
import _ from "lodash";
import { multiContract } from "../../../api/multiContractTx";
import { Asset, asset_to_number, number_to_asset, Sym } from "eos-common";
import { Chain } from "../../../store/modules/wallet/tlosWallet";
const requiredProps = ["balance", "contract", "symbol"];
const pickBalanceReturn = data => {
    const res = _.pick(data, requiredProps);
    if (!res.contract || !res.symbol)
        throw new Error("Failed to parse contract or symbol in pickBalanceReturn");
    return res;
};
const tokenBalanceToTokenBalanceReturn = token =>
    Object.assign(Object.assign({}, token), { balance: token.amount });
const VuexModule = createModule({
    strict: false
});
const includedInTokens = tokens => token =>
    tokens.some(t => compareToken(token, t));
export class TlosNetworkModule extends VuexModule.With({
    namespaced: "tlosNetwork/"
}) {
    constructor() {
        super(...arguments);
        this.tokenBalances = [];
    }
    get balances() {
        return this.tokenBalances;
    }
    get balance() {
        return ({ contract, symbol }) => {
            return this.balances.find(
                x =>
                    compareString(x.symbol, symbol) && compareString(x.contract, contract)
            );
        };
    }
    get isAuthenticated() {
        return this.$store.getters["tlosWallet/isAuthenticated"];
    }
    get networkId() {
        return "4667b205c6838ef70ff7988f6e8257e8be0e1284a2f59699054a018f743b1d11";
    }
    get protocol() {
        return "eosio";
    }
    pingTillChange({ originalBalances, maxPings = 20, interval = 1000 }) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) =>
                __awaiter(this, void 0, void 0, function* () {
                    for (let i = 0; i < maxPings; i++) {
                        const newBalanceArray = yield this.getBalances({
                            tokens: originalBalances,
                            disableSetting: true
                        });
                        if (!newBalanceArray) return [];
                        const allBalancesDifferent = originalBalances.every(balance => {
                            var _a;
                            return (
                                ((_a = newBalanceArray.find(b =>
                                    compareString(b.symbol, balance.symbol)
                                )) === null || _a === void 0
                                    ? void 0
                                    : _a.balance) !== balance.balance
                            );
                        });
                        if (allBalancesDifferent) {
                            this.updateTokenBalances(newBalanceArray);
                            break;
                        } else {
                            yield new Promise(res => setTimeout(res, interval));
                        }
                    }
                    resolve();
                })
            );
        });
    }
    transfer({ to, amount, id, memo }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isAuthenticated) throw new Error("Not authenticated!");
            const symbol = id;
            const dirtyReserve = vxm.tlosBancor.relaysList
                .flatMap(relay => relay.reserves)
                .find(reserve => compareString(reserve.symbol, symbol));
            if (!dirtyReserve) throw new Error("Failed finding dirty reserve");
            const { contract, precision } = dirtyReserve;
            const asset = number_to_asset(amount, new Sym(symbol, precision));
            const actions = yield multiContract.tokenTransfer(contract, {
                to,
                quantity: asset.to_string(),
                memo
            });
            const originalBalances = yield this.getBalances({
                tokens: [{ contract, symbol }]
            });
            yield vxm.tlosWallet.tx(actions);
            this.pingTillChange({ originalBalances });
        });
    }
    xtransfer({ to, amount, id, memo }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isAuthenticated) throw new Error("Not authenticated!");
            const symbol = id;
            const tokens = vxm.xchainBancor.tokens;
            const token = tokens.find(x =>
                compareString(x.symbol.toString(), symbol)
            );
            if (!token) throw new Error("Failed finding token");
            const contract = token.contract;
            const precision = token.precision;
            const asset = number_to_asset(amount, new Sym(symbol, precision));
            const new_memo =
                to.toString() +
                (vxm.tlosWallet.chain == Chain.telos ? "@eos" : "@telos") +
                (memo === "" ? "" : "|" + memo);
            const bridge_account = "telosd.io";
            const actions = yield multiContract.tokenTransfer(contract, {
                to: bridge_account,
                quantity: asset.to_string(),
                memo: new_memo
            });
            const originalBalances = yield this.getBalances({
                tokens: [{ contract, symbol }]
            });
            yield vxm.tlosWallet.tx(actions);
            this.pingTillChange({ originalBalances });
        });
    }
    fetchBulkBalances(tokens) {
        return __awaiter(this, void 0, void 0, function* () {
            const balances = yield Promise.all(
                tokens.map(token =>
                    __awaiter(this, void 0, void 0, function* () {
                        const balance = yield getBalance(
                            token.contract,
                            token.symbol,
                            token.precision
                        );
                        return Object.assign(Object.assign({}, token), {
                            balance: asset_to_number(new Asset(balance))
                        });
                    })
                )
            );
            return balances;
        });
    }
    getBalances(params) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isAuthenticated) throw new Error("Not logged in.");
            if (
                !params ||
                ((_a =
                    params === null || params === void 0 ? void 0 : params.tokens) ===
                    null || _a === void 0
                    ? void 0
                    : _a.length) == 0
            ) {
                const tokensToFetch = this.balances;
                const [directTokens, bonusTokens] = yield Promise.all([
                    this.fetchBulkBalances(tokensToFetch),
                    getTokenBalances(this.isAuthenticated).catch(() => ({
                        tokens: []
                    }))
                ]);
                const equalisedBalances = bonusTokens.tokens.map(
                    tokenBalanceToTokenBalanceReturn
                );
                const merged = _.uniqWith(
                    [...directTokens, ...equalisedBalances],
                    compareToken
                );
                this.updateTokenBalances(merged);
                return merged;
            }
            const tokensAskedFor = params.tokens;
            if (params === null || params === void 0 ? void 0 : params.slow) {
                const bulkTokens = yield getTokenBalances(this.isAuthenticated);
                const equalisedBalances = bulkTokens.tokens.map(
                    tokenBalanceToTokenBalanceReturn
                );
                this.updateTokenBalances(equalisedBalances);
                const missedTokens = _.differenceWith(
                    tokensAskedFor,
                    equalisedBalances,
                    compareToken
                );
                const remainingBalances = yield this.fetchBulkBalances(missedTokens);
                this.updateTokenBalances(remainingBalances);
                return [...equalisedBalances, ...remainingBalances].filter(
                    includedInTokens(tokensAskedFor)
                );
            }
            const [directTokens, bonusTokens] = yield Promise.all([
                this.fetchBulkBalances(tokensAskedFor),
                getTokenBalances(this.isAuthenticated).catch(() => ({
                    tokens: []
                }))
            ]);
            const allTokensReceived = tokensAskedFor.every(fetchableToken =>
                directTokens.some(fetchedToken =>
                    compareToken(fetchableToken, fetchedToken)
                )
            );
            console.assert(
                allTokensReceived,
                "fetch bulk balances failed to return all tokens asked for!"
            );
            const equalisedBalances = bonusTokens.tokens.map(
                tokenBalanceToTokenBalanceReturn
            );
            const merged = _.uniqWith(
                [...directTokens, ...equalisedBalances],
                compareToken
            );
            if (!params.disableSetting) {
                this.updateTokenBalances(merged);
            }
            return directTokens.filter(includedInTokens(tokensAskedFor));
        });
    }
    updateTokenBalances(tokens) {
        const toSet = _.uniqWith(
            [...tokens.map(pickBalanceReturn), ...this.tokenBalances],
            compareToken
        );
        this.tokenBalances = toSet;
    }
}
__decorate([action], TlosNetworkModule.prototype, "pingTillChange", null);
__decorate([action], TlosNetworkModule.prototype, "transfer", null);
__decorate([action], TlosNetworkModule.prototype, "xtransfer", null);
__decorate([action], TlosNetworkModule.prototype, "fetchBulkBalances", null);
__decorate([action], TlosNetworkModule.prototype, "getBalances", null);
__decorate(
    [mutation],
    TlosNetworkModule.prototype,
    "updateTokenBalances",
    null
);
