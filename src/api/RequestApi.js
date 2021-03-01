import { __awaiter } from "tslib";
import axios from "axios";
const baseURL = axios.create({
    baseURL: "https://us-central1-coolx-242811.cloudfunctions.net/"
});
function requestApi(endpoint, params) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return baseURL.post(endpoint, params);
        }
        catch (error) {
            throw error;
        }
    });
}
export default requestApi;