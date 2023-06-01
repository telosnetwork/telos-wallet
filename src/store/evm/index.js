import state from '~/store/evm/state';
import * as getters from '~/store/evm/getters';
import * as mutations from '~/store/evm/mutations';
import * as actions from '~/store/evm/actions';

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
