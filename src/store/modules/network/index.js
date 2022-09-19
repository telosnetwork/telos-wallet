import { __awaiter, __decorate } from "tslib";
import { createModule, action } from "vuex-class-component";
import { vxm } from "../../../store";
import { moduleStore } from "../../../store"
const VuexModule = createModule({
    strict: false
});
export class NetworkModule extends VuexModule.With({ namespaced: "network/" }) {
    constructor() {
        super(...arguments);
        this.chains = ["tlos", "usds", "xchain"];
    }
    get currentNetwork() {
        return moduleStore.state.routeModule.params.service;
    }
    get balances() {
        return vxm[`${this.currentNetwork}Network`]["balances"];
    }
    get balance() {
        return vxm[`${this.currentNetwork}Network`]["balance"];
    }
    get networkId() {
        return vxm[`${this.currentNetwork}Network`]["networkId"];
    }
    get protocol() {
        return vxm[`${this.currentNetwork}Network`]["protocol"];
    }
    transfer(params) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.dispatcher(["transfer", params]);
        });
    }
    getBalances(params) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.dispatcher(["getBalances", params]);
        });
    }
    dispatcher([methodName, params]) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.$store.dispatch(
                `${this.currentNetwork}Network/${methodName}`,
                params,
                { root: true }
            );
        });
    }
}
__decorate([action], NetworkModule.prototype, "transfer", null);
__decorate([action], NetworkModule.prototype, "getBalances", null);
__decorate([action], NetworkModule.prototype, "dispatcher", null);
