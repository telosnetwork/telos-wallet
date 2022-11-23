import { __awaiter, __decorate } from "tslib";
import { createModule, action } from "vuex-class-component";
import { vxm } from "~/store/index";
import { store } from "~/store";
const VuexModule = createModule({
    strict: false
});
export class WalletModule extends VuexModule.With({ namespaced: "wallet/" }) {
    get currentWallet() {
        return vxm.bancor.wallet;
    }
    get currentNetwork() {
        return store.state.routeModule.params.service;
    }
    get isAuthenticated() {
        return vxm[`${vxm.bancor.wallet}Wallet`].isAuthenticated;
    }
    dispatcher(methodName, params = null) {
        return __awaiter(this, void 0, void 0, function* () {
            return params
                ? this.$store.dispatch(`${this.currentWallet}/${methodName}`, params)
                : this.$store.dispatch(`${this.currentWallet}/${methodName}`);
        });
    }
    tx(actions) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.dispatcher("tx", actions);
        });
    }
    initLogin() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.dispatcher("initLogin");
        });
    }
    logout() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.dispatcher("logout");
        });
    }
}
__decorate([action], WalletModule.prototype, "dispatcher", null);
__decorate([action], WalletModule.prototype, "tx", null);
__decorate([action], WalletModule.prototype, "initLogin", null);
__decorate([action], WalletModule.prototype, "logout", null);
