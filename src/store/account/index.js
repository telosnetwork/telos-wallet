import state from '~/store/account/state';
import * as getters from '~/store/account/getters';
import * as mutations from '~/store/account/mutations';
import * as actions from '~/store/account/actions';

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
