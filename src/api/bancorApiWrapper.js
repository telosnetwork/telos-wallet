import { __awaiter } from "tslib";
import axios from "axios";
function chunk(array, size) {
    const chunked = [];
    let index = 0;
    while (index < array.length) {
        chunked.push(array.slice(index, index + size));
        index += size;
    }
    return chunked;
}
var Blockchain;
(function (Blockchain) {
    Blockchain[Blockchain["TLOS"] = 0] = "TLOS";
})(Blockchain || (Blockchain = {}));
export class BancorApi {
    constructor(blockchain) {
        this.instance = axios.create({
            baseURL: "https://api.bancor.network/0.1/"
        });
        this.photoBaseUrl = `https://storage.googleapis.com/bancor-prod-file-store/images/communities/`;
        this.blockchain = blockchain;
    }
    request(endpoint, params = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.instance.get(endpoint, {
                params
            });
            return res.data;
        });
    }
    post(endpoint, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.instance.post(endpoint, params);
            return res.data;
        });
    }
    getToken(symbol) {
        return __awaiter(this, void 0, void 0, function* () {
            const endpoint = "currencies/" + symbol;
            const res = yield this.request(endpoint, {});
            return Object.assign(Object.assign({}, res.data.currency), { primaryCommunityImageName: this.photoBaseUrl + res.data.currency.primaryCommunityImageName });
        });
    }
    convert(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const final = Object.assign(Object.assign(Object.assign({}, payload), { blockchainType: this.blockchain == Blockchain.TLOS ? "tlos" : "ethereum" }), (this.blockchain == Blockchain.TLOS && { format: "json" }));
            const res = yield this.post("currencies/convert", final);
            if (res.errorCode) {
                throw new Error(res.errorCode);
            }
            return res;
        });
    }
    getPath(fromId, toId) {
        return __awaiter(this, void 0, void 0, function* () {
            const endpoint = `transactions/conversionPath?fromCurrencyId=${fromId}&toCurrencyId=${toId}`;
            const res = yield this.request(endpoint);
            return res;
        });
    }
    getPathBySymbol(fromSymbol, toSymbol) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.request(`transactions/conversionPath?fromCurrencyCode=${fromSymbol}&toCurrencyCode=${toSymbol}`);
            return chunk(res.data, 2);
        });
    }
    getTokens() {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.request("currencies/tokens", {
                blockchainType: this.blockchain == Blockchain.TLOS ? "tlos" : "ethereum",
                fromCurrencyCode: "USD",
                includeTotal: true,
                limit: 150,
                orderBy: "volume24h",
                skip: 0,
                sortOrder: "desc"
            });
            return res.data.page.map((token) => (Object.assign(Object.assign({}, token), { primaryCommunityImageName: this.photoBaseUrl + token.primaryCommunityImageName })));
        });
    }
    getTokenTicker(symbol) {
        return __awaiter(this, void 0, void 0, function* () {
            const endpoint = "currencies/" + symbol + "/ticker";
            const params = {
                displayCurrencyCode: "USD"
            };
            const res = yield this.request(endpoint, params);
            return res.data;
        });
    }
    priceDiscovery(tokenId, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const endpoint = "currencies/" + tokenId + "/value";
            const res = yield this.request(endpoint, params);
            return res.data;
        });
    }
    calculateCost(fromId, toId, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.priceDiscovery(fromId, {
                toCurrencyId: toId,
                toAmount: amount,
                streamId: "loadDefaultConversionRateValue"
            });
        });
    }
    calculateReturn(fromId, toId, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.priceDiscovery(fromId, {
                toCurrencyId: toId,
                fromAmount: amount,
                streamId: "loadValue"
            });
        });
    }
    getRate(toCurrency, fromCurrency) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.request(`currencies/rate`, {
                toCurrencyCode: toCurrency,
                fromCurrencyCode: fromCurrency
            });
            return res.data;
        });
    }
}
export const bancorApi = new BancorApi(Blockchain.TLOS);