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

    Router.beforeEach((to, from) => {
        // allow us to programmatically tell if the user came from the app or an external site. See AppNav.vue > goBack()
        sessionStorage.removeItem('navigatedFromApp');
        if (from.fullPath !== '/') {
            sessionStorage.setItem('navigatedFromApp', true);
        }

        // this prevents the general public from accessing the demo pages
        if (to.meta.notInProduction && window.location.origin.includes('telos.net')) {
            return { name: 'home' };
        }

        if (to.meta.requiresAuth) {
            const isAuthenticated = !!localStorage.getItem('account');

            if (!isAuthenticated) {
                return { name: 'home' };
            }
        }
    });

    return Router;
}
