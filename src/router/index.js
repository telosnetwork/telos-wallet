import { createRouter, createWebHistory } from 'vue-router'
import routes from './routes'


/**** TODO: move plugin and update implementation */
import Vue from 'vue'
import BigNumber from 'bignumber.js';
import CryptoJS from 'crypto-js'

Vue.mixin({
  data() {
    return {
      theme: 'gradientblue',
      themes: [
        'indigo',
        'platinum',
        'midnight',
        'aquamarine',
        'sunray',
        'coral',
        'gradientblue'
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
        case 'gradientblue':
          return '#1AD6FF';
        case 'saveBtn':
          return '#5a2fa0';
        case 'blackDark':
          return '#130C3F';
        case 'purple':
          return '#8946DF';
        default:
          return '#571AFF';
      }
    }
  },
  methods: {
    getFixed(value, decimal) {
      const decimalVal = Math.pow(10, decimal);
      return BigNumber((Math.floor(value * decimalVal) / decimalVal).toString()).toFormat();
    },
    encrypt (text) {
      return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(text));
    },
    decrypt (data) {
      return CryptoJS.enc.Base64.parse(data).toString(CryptoJS.enc.Utf8);
    },
    changeTheme() {
      const index = (this.themes.findIndex(theme => theme === this.theme.toLowerCase()) + 1) % this.themes.length;
      this.theme = this.themes[index];
    },
  },
})

/*** TODO: remove if not being used */
export const defaultModule = "tlos";
const PREFERRED_SERVICE = "preferredService";

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
    history: createHistory(process.env.VUE_ROUTER_BASE)
  })

  return Router
}
