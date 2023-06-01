import { createStore } from 'vuex';
import account from '~/store/account';
import general from '~/store/general';
import global from '~/store/global';
import resources from '~/store/resources';
import evm from '~/store/evm';
import rex from '~/store/rex';

export default function() {
    const Store = createStore({
        modules: {
            general,
            account,
            global,
            resources,
            evm,
            rex,
        },

        strict: process.env.DEV,
    });

    return Store;
}

