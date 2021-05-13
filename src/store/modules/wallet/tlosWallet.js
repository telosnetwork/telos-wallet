import { __awaiter, __decorate } from "tslib";
import { createModule, mutation, action } from "vuex-class-component";
import { vxm } from "../../../store";
export var Chain;
(function (Chain) {
    Chain[Chain["telos"] = 0] = "telos";
    Chain[Chain["eos"] = 1] = "eos";
})(Chain || (Chain = {}));
const VuexModule = createModule({
    strict: false
});
export class EosTransitModule extends VuexModule.With({
    namespaced: "tlosWallet/"
}) {
    constructor() {
        super(...arguments);
        this.chain = Chain.telos;
        this.isMobile = false;
        this.selectedProvider = "";
        this.wallet = false;
        this.walletState = false;
    }
    get loginStatus() {
        const login = ["Login", "arrow-circle-right", false];
        if (!this.wallet && !this.walletState)
            return login;
        else if (this.walletState && this.walletState.authenticating)
            return ["Authenticating", "spinner", true];
        else if (this.walletState && this.walletState.connecting)
            return ["Connecting", "spinner", true];
        else if (this.walletState && this.walletState.accountFetching)
            return ["Fetching", "spinner", true];
        else if (this.wallet && this.wallet.auth) {
            return [this.wallet.auth.accountName, "power-off", false];
        }
        else
            return login;
    }
    get isAuthenticated() {
        return this.wallet && this.wallet.auth && this.wallet.auth.accountName;
    }
    checkDevice() {
        return __awaiter(this, void 0, void 0, function* () {
            const width = window.innerWidth;
            this.setIsMobile(width <= 768);
        });
    }
    setIsMobile(isMobile) {
        this.isMobile = isMobile;
    }
    tx(actions) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield window.$api.signTransaction(actions.actions ? actions.actions : actions, actions.detail);
        });
    }
    setProvider(provider) {
        this.selectedProvider = provider;
    }
    setWallet(wallet) {
        this.wallet = wallet;
    }
    setWalletState(state) {
        this.walletState = state;
    }
    setAccessContext(chain) {
        console.log("setAccessContext.chain", chain);
        vxm.tlosWallet.logout();
        this.chain = chain;
        const provider = vxm.tlosWallet.selectedProvider;
        console.log("setAccessContext.provider", provider);
        if (provider)
            vxm.tlosWallet.initLogin(provider);
    }
}
__decorate([
    action
], EosTransitModule.prototype, "checkDevice", null);
__decorate([
    mutation
], EosTransitModule.prototype, "setIsMobile", null);
__decorate([
    action
], EosTransitModule.prototype, "tx", null);
__decorate([
    action
], EosTransitModule.prototype, "initLogin", null);
__decorate([
    action
], EosTransitModule.prototype, "logout", null);
__decorate([
    mutation
], EosTransitModule.prototype, "setProvider", null);
__decorate([
    mutation
], EosTransitModule.prototype, "setWallet", null);
__decorate([
    mutation
], EosTransitModule.prototype, "setWalletState", null);
__decorate([
    mutation
], EosTransitModule.prototype, "setAccessContext", null);