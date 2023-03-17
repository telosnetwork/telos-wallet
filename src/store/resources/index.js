import state from '~/store/resources/state';
import * as getters from '~/store/resources/getters';
import * as mutations from '~/store/resources/mutations';
import * as actions from '~/store/resources/actions';

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
