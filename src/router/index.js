import { createRouter, createWebHistory } from 'vue-router';
import routes from '~/router/routes';


/*** TODO: remove if not being used */
export const defaultModule = 'tlos';
const PREFERRED_SERVICE = 'preferredService';

const setPreferredService = (service) => {
    localStorage.setItem(PREFERRED_SERVICE, service);
};
/*********************************** */


export default function (/* { store, ssrContext } */) {
    const createHistory =  createWebHistory;

    const Router = createRouter({
        scrollBehavior: () => ({ left: 0, top: 0 }),
        routes,

        // Leave this as is and make changes in quasar.config.js instead!
        // quasar.config.js -> build -> vueRouterMode
        // quasar.config.js -> build -> publicPath
        history: createHistory(process.env.VUE_ROUTER_BASE),
    });

    // this prevents the general public from accessing the demo pages
    Router.beforeEach((to, from) => {
        if (to.meta.notInProduction && process.env.NODE_ENV === 'production') {
            return { name: 'home' };
        }

        // eztodo verify with native as well
        if (to.meta.requiresAuth) {
            const isAuthenticated = !!localStorage.getItem('account');

            if (!isAuthenticated) {
                return { name: 'home' };
            }
        }
    });

    return Router;
}
