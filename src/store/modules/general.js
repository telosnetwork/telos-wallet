import { __decorate } from "tslib";
import { createModule } from "vuex-class-component";
const VuexModule = createModule({
    strict: false
});
export class GeneralModule extends VuexModule.With({ namespaced: "general/" }) {
    constructor() {
        super(...arguments);
    }
}
