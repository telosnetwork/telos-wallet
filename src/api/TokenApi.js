import { __awaiter } from "tslib";
import RequestApi from "./RequestApi";
class TokenApi {
    constructor() {
        console.log("Token Api created");
    }
    testRequest(params) {
        return RequestApi("users", params);
    }
    /**
     * Get tokens detail
     */
    getDetails() {
        return __awaiter(this, void 0, void 0, function* () {
            const tokens = yield RequestApi("tokens", {});
            return tokens.data.tokens;
        });
    }
    /**
     * Get all tokens summary
     * @param {offset, limit, orderBy, sortOrder}
     */
    getTradeSummary(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const tokens = yield RequestApi("tokenTradeSummaries", params);
            return tokens.data;
        });
    }
    /**
     * Calculate Rete between tokens
     * @param {fromTokenId, toTokenId, amount }
     */
    calculateRate(params) {
        return RequestApi("calculateRate", params);
    }
}
export default TokenApi;