import state from '~/store/general/state';
import * as getters from '~/store/general/getters';
import * as mutations from '~/store/general/mutations';
import * as actions from '~/store/general/actions';

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
