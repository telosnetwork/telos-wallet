import Vue from 'vue'
import VueRouter from 'vue-router'

import routes from './routes'

Vue.use(VueRouter)
Vue.mixin({
  data() {
    return {
      theme: 'indigo',
      themes: [
        'indigo',
        'platinum',
        'midnight',
        'aquamarine',
        'sunray',
        'coral'
      ],
    };
  },
  computed: {
    themeColor() {
      switch (this.theme.toLowerCase()) {
        case 'indigo':
          return '#571AFF';
        case 'platinum':
          return '#DFDFED';
        case 'midnight':
          return '#010035';
        case 'aquamarine':
          return '#55C3B3';
        case 'sunray':
          return '#FFD75E';
        case 'coral':
          return '#FF422A';
        default:
          return '#571AFF';
      }
    }
  },
  methods: {
    getFixed(value, decimal) {
      const decimalVal = Math.pow(10, decimal);
      return Math.round(value * decimalVal) / decimalVal;
    },
    changeTheme() {
      const index = (this.themes.findIndex(theme => theme === this.theme.toLowerCase()) + 1) % this.themes.length;
      this.theme = this.themes[index];
    },
  },
})

export default function (/* { store, ssrContext } */) {
  const Router = new VueRouter({
    scrollBehavior: () => ({ x: 0, y: 0 }),
    routes,

    mode: process.env.VUE_ROUTER_MODE,
    base: process.env.VUE_ROUTER_BASE
  })

  return Router
}

export const defaultModule = "tlos";
const PREFERRED_SERVICE = "preferredService";

const setPreferredService = (service) => {
  localStorage.setItem(PREFERRED_SERVICE, service);
};