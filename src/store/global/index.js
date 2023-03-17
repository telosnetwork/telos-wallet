import state from '~/store/global/state';
import * as getters from '~/store/global/getters';
import * as mutations from '~/store/global/mutations';
import * as actions from '~/store/global/actions';

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
