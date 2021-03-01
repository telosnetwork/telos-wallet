import { __awaiter, __decorate } from "tslib";
import { createModule, action, mutation } from "vuex-class-component";
import { vxm } from "../../../store";
import { store } from "../../../store";
import { compareString, updateArray } from "../../../api/helpers";
import { fetchUsdPriceOfTlos } from "../../../api/helpers";
import { defaultModule } from "../../../router";
const VuexModule = createModule({
    strict: false
});
const moduleIds = [
    {
        label: "",
        id: "tlos"
    }
];
export class BancorModule extends VuexModule.With({
    namespaced: "bancor/"
}) {
    constructor() {
        super(...arguments);
        this.usdPriceOfTlos = {
            price: null,
            lastChecked: 0
        };
        this.usdTlos24hPriceMove = {
            percent_change_24h: null,
            lastChecked: 0
        };
        this.modules = moduleIds.map(({ id, label }) => ({
            id,
            label,
            loading: false,
            loaded: false,
            error: false
        }));
    }
    get currentNetwork() {
        if (
            store.state.routeModule &&
            store.state.routeModule.params &&
            store.state.routeModule.params.service) {
            return store.state.routeModule.params.service;
        }
        else {
            return defaultModule;
        }
    }
    get tokens() {
        return vxm[`${this.currentNetwork}Bancor`]["tokens"];
    }
    get supportedFeatures() {
        return vxm[`${this.currentNetwork}Bancor`]["supportedFeatures"];
    }
    get token() {
        return vxm[`${this.currentNetwork}Bancor`]["token"];
    }
    get relays() {
        return vxm[`${this.currentNetwork}Bancor`]["relays"];
    }
    get convertibleTokens() {
        return vxm[`${this.currentNetwork}Bancor`]["convertibleTokens"];
    }
    get moreTokensAvailable() {
        return vxm[`${this.currentNetwork}Bancor`]["moreTokensAvailable"];
    }
    get newPoolTokenChoices() {
        return vxm[`${this.currentNetwork}Bancor`]["newPoolTokenChoices"];
    }
    get newNetworkTokenChoices() {
        return vxm[`${this.currentNetwork}Bancor`]["newNetworkTokenChoices"];
    }
    get relay() {
        return vxm[`${this.currentNetwork}Bancor`]["relay"];
    }
    get morePoolsAvailable() {
        return vxm[`${this.currentNetwork}Bancor`]["morePoolsAvailable"];
    }
    get loadingPools() {
        return vxm[`${this.currentNetwork}Bancor`]["loadingPools"];
    }
    get wallet() {
        return vxm[`${this.currentNetwork}Bancor`]["wallet"];
    }
    updateModule({ id, updater }) {
        const newModules = updateArray(this.modules, module => compareString(id, module.id), updater);
        this.modules = newModules;
    }
    moduleInitialised(id) {
        return __awaiter(this, void 0, void 0, function* () {
            this.updateModule({
                id,
                updater: module => (Object.assign(Object.assign({}, module), { loaded: true, loading: false, error: false }))
            });
        });
    }
    moduleThrown(id) {
        return __awaiter(this, void 0, void 0, function* () {
            this.updateModule({
                id,
                updater: module => (Object.assign(Object.assign({}, module), { loaded: false, loading: false, error: true }))
            });
        });
    }
    moduleInitalising(id) {
        return __awaiter(this, void 0, void 0, function* () {
            this.updateModule({
                id,
                updater: module => (Object.assign(Object.assign({}, module), { loading: true }))
            });
        });
    }
    initialiseModule({ moduleId, params, resolveWhenFinished = false }) {
        return __awaiter(this, void 0, void 0, function* () {
            this.moduleInitalising(moduleId);
            if (resolveWhenFinished) {
                try {
                    yield this.$store.dispatch(`${moduleId}Bancor/init`, params || null, {
                        root: true
                    });
                    this.moduleInitialised(moduleId);
                }
                catch (e) {
                    this.moduleThrown(moduleId);
                }
            }
            else {
                try {
                    this.$store
                        .dispatch(`${moduleId}Bancor/init`, params || null, {
                            root: true
                        })
                        .then(() => this.moduleInitialised(moduleId));
                }
                catch (e) {
                    this.moduleThrown(moduleId);
                }
            }
        });
    }
    init(param) {
        return __awaiter(this, void 0, void 0, function* () {
            if (param && param.initialChain && param.initialModuleParam) {
                return this.initialiseModule({
                    moduleId: param.initialChain,
                    params: param.initialModuleParam,
                    resolveWhenFinished: true
                });
            }
            else {
                return Promise.all(this.modules
                    .map(module => module.id)
                    .map(moduleId => this.initialiseModule({ moduleId, resolveWhenFinished: true })));
            }
        });
    }
    getUsdPrice() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const reverse = (promise) => new Promise((resolve, reject) => Promise.resolve(promise).then(reject, resolve));
                const any = (arr) => reverse(Promise.all(arr.map(reverse)));
                const res = yield any([fetchUsdPriceOfTlos()]);
                const usdPrice = res;
                this.setUsdPriceOfTlos({
                    price: usdPrice,
                    lastChecked: new Date().getTime()
                });
                return usdPrice;
            }
            catch (e) {
                throw new Error(`Failed to find USD Price of TLOS from External API & Relay ${e.message}`);
            }
        });
    }
    fetchusdPriceOfTlos() {
        return __awaiter(this, void 0, void 0, function* () {
            const timeNow = new Date().getTime();
            const millisecondGap = 900000;
            const makeNetworkRequest = !this.usdPriceOfTlos.lastChecked ||
                this.usdPriceOfTlos.lastChecked + millisecondGap < timeNow;
            return makeNetworkRequest
                ? this.getUsdPrice()
                : this.usdPriceOfTlos.price;
        });
    }
    setUsdPriceOfTlos(usdPriceOfTlos) {
        this.usdPriceOfTlos = usdPriceOfTlos;
    }
    fetchUsd24hPriceMove() {
        return __awaiter(this, void 0, void 0, function* () {
            const timeNow = new Date().getTime();
            const millisecondGap = 900000;
            const makeNetworkRequest = !this.usdTlos24hPriceMove.lastChecked ||
                this.usdTlos24hPriceMove.lastChecked + millisecondGap < timeNow;
            return makeNetworkRequest
                ? this.getUsdPrice()
                : this.usdTlos24hPriceMove.percent_change_24h;
        });
    }
    setUsdTlos24hPriceMove(usdTlos24hPriceMove) {
        this.usdTlos24hPriceMove = usdTlos24hPriceMove;
    }
    loadMoreTokens(tokenIds) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.dispatcher(["loadMoreTokens", tokenIds]);
        });
    }
    fetchHistoryData(relayId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.dispatcher(["fetchHistoryData", relayId]);
        });
    }
    convert(tx) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.dispatcher(["convert", tx]);
        });
    }
    updateFee(fee) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.dispatcher(["updateFee", fee]);
        });
    }
    loadMorePools() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.dispatcher(["loadMorePools"]);
        });
    }
    removeRelay(symbolName) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.dispatcher(["removeRelay", symbolName]);
        });
    }
    updateOwner(owner) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.dispatcher(["updateOwner", owner]);
        });
    }
    getUserBalances(symbolName) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.dispatcher(["getUserBalances", symbolName]);
        });
    }
    createPool(newPoolParams) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.dispatcher(["createPool", newPoolParams]);
        });
    }
    async getCost(proposedTransaction) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.dispatcher(["getCost", proposedTransaction]);
        });
    }
    async getReturn(proposedTransaction) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.dispatcher(["getReturn", proposedTransaction]);
        });
    }
    addLiquidity(addLiquidityParams) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.dispatcher(["addLiquidity", addLiquidityParams]);
        });
    }
    removeLiquidity(removeLiquidityParams) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.dispatcher(["removeLiquidity", removeLiquidityParams]);
        });
    }
    calculateOpposingDeposit(opposingDeposit) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.dispatcher(["calculateOpposingDeposit", opposingDeposit]);
        });
    }
    calculateOpposingWithdraw(opposingWithdraw) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.dispatcher(["calculateOpposingWithdraw", opposingWithdraw]);
        });
    }
    focusSymbol(symbolName) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.dispatcher(["focusSymbol", symbolName]);
        });
    }
    dispatcher([methodName, params]) {
        return __awaiter(this, void 0, void 0, function* () {
            return params
                ? this.$store.dispatch(`${this.currentNetwork}Bancor/${methodName}`, params, { root: true })
                : this.$store.dispatch(`${this.currentNetwork}Bancor/${methodName}`, null, { root: true });
        });
    }
    refreshBalances(symbols = []) {
        return __awaiter(this, void 0, void 0, function* () {
            if (vxm.wallet.isAuthenticated) {
                return this.dispatcher(["refreshBalances", symbols]);
            }
        });
    }
}
__decorate([
    mutation
], BancorModule.prototype, "updateModule", null);
__decorate([
    action
], BancorModule.prototype, "moduleInitialised", null);
__decorate([
    action
], BancorModule.prototype, "moduleThrown", null);
__decorate([
    action
], BancorModule.prototype, "moduleInitalising", null);
__decorate([
    action
], BancorModule.prototype, "initialiseModule", null);
__decorate([
    action
], BancorModule.prototype, "init", null);
__decorate([
    action
], BancorModule.prototype, "getUsdPrice", null);
__decorate([
    action
], BancorModule.prototype, "fetchusdPriceOfTlos", null);
__decorate([
    mutation
], BancorModule.prototype, "setUsdPriceOfTlos", null);
__decorate([
    action
], BancorModule.prototype, "fetchUsd24hPriceMove", null);
__decorate([
    mutation
], BancorModule.prototype, "setUsdTlos24hPriceMove", null);
__decorate([
    action
], BancorModule.prototype, "loadMoreTokens", null);
__decorate([
    action
], BancorModule.prototype, "fetchHistoryData", null);
__decorate([
    action
], BancorModule.prototype, "convert", null);
__decorate([
    action
], BancorModule.prototype, "updateFee", null);
__decorate([
    action
], BancorModule.prototype, "loadMorePools", null);
__decorate([
    action
], BancorModule.prototype, "removeRelay", null);
__decorate([
    action
], BancorModule.prototype, "updateOwner", null);
__decorate([
    action
], BancorModule.prototype, "getUserBalances", null);
__decorate([
    action
], BancorModule.prototype, "createPool", null);
__decorate([
    action
], BancorModule.prototype, "getCost", null);
__decorate([
    action
], BancorModule.prototype, "getReturn", null);
__decorate([
    action
], BancorModule.prototype, "addLiquidity", null);
__decorate([
    action
], BancorModule.prototype, "removeLiquidity", null);
__decorate([
    action
], BancorModule.prototype, "calculateOpposingDeposit", null);
__decorate([
    action
], BancorModule.prototype, "calculateOpposingWithdraw", null);
__decorate([
    action
], BancorModule.prototype, "focusSymbol", null);
__decorate([
    action
], BancorModule.prototype, "dispatcher", null);
__decorate([
    action
], BancorModule.prototype, "refreshBalances", null);