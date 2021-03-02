import { __awaiter, __decorate } from "tslib";
import { createModule, mutation, action } from "vuex-class-component";
import { initAccessContext } from "eos-transit";
import { vxm } from "../../../store";
export var Chain;
(function (Chain) {
    Chain[Chain["telos"] = 0] = "telos";
    Chain[Chain["eos"] = 1] = "eos";
})(Chain || (Chain = {}));
const telos_chain_options = {
    appName: "TLOSD.Telos",
    network: {
        host: "telos.caleos.io",
        port: 443,
        protocol: "https",
        chainId: "4667b205c6838ef70ff7988f6e8257e8be0e1284a2f59699054a018f743b1d11"
    },
    walletProviders: []
};
const eos_chain_options = {
    appName: "TLOSD.EOS",
    network: {
        host: "eos.greymass.com",
        port: 443,
        protocol: "https",
        chainId: "aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906"
    },
    walletProviders: []
};
const VuexModule = createModule({
    strict: false
});
export class EosTransitModule extends VuexModule.With({
    namespaced: "tlosWallet/"
}) {
    constructor() {
        super(...arguments);
        this.chain = Chain.telos;
        this.accessContext = initAccessContext(telos_chain_options);
        this.isMobile = false;
        this.walletProviders = this.accessContext.getWalletProviders();
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
            const authIncluded = actions.every((action) => action.authorization);
            const builtActions = authIncluded
                ? actions
                : actions.map((action) => (Object.assign(Object.assign({}, action), {
                    authorization: [
                        {
                            actor: this.wallet.auth.accountName,
                            permission: this.wallet.auth.permission
                        }
                    ]
                })));
            try {
                return yield this.wallet.eosApi.transact({
                    actions: builtActions
                }, {
                    broadcast: true,
                    blocksBehind: 3,
                    expireSeconds: 60
                });
            }
            catch (e) {
                if (e.message == "Unexpected end of JSON input")
                    return yield this.wallet.eosApi.transact({
                        actions: builtActions
                    }, {
                        broadcast: true,
                        blocksBehind: 3,
                        expireSeconds: 60
                    });
                throw new Error(e.message);
            }
        });
    }
    initLogin(provider) {
        return __awaiter(this, void 0, void 0, function* () {
            this.setProvider(provider);
            this.checkDevice();
            const wallet = this.accessContext.initWallet(provider);
            wallet.subscribe((walletState) => {
                if (walletState)
                    this.setWalletState(walletState);
            });
            try {
                yield wallet.connect();
                try {
                    yield wallet.login();
                    this.setWallet(wallet);
                    localStorage.setItem("autoLogin", provider.id);
                }
                catch (e) {
                    console.log("auth error");
                    throw e;
                }
            }
            catch (e) {
                console.log("connection error");
                throw e;
            }
        });
    }
    logout() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.wallet) {
                this.wallet.logout();
                this.setWallet(false);
                this.setWalletState(false);
                localStorage.removeItem("autoLogin");
            }
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
        switch (chain) {
            case 0:
                this.accessContext = initAccessContext(telos_chain_options);
                break;
            case 1:
                this.accessContext = initAccessContext(eos_chain_options);
                break;
            default:
                this.accessContext = initAccessContext(telos_chain_options);
        }
        this.chain = chain;
        console.log("setAccessContext.accessContext", this.accessContext);
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