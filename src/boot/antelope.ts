import { EthereumClient } from '@web3modal/ethereum';
import { Web3ModalConfig } from '@web3modal/html';
import { boot } from 'quasar/wrappers';
import { installAntelope } from 'src/antelope';
import { MetamaskAuth, WalletConnectAuth } from 'src/antelope/wallets';
import { App } from 'vue';
import { Router } from 'vue-router';


const getRouter = async (app: App) => new Promise<Router>((resolve) => {
    const intervalId = setInterval(() => {
        if (app.config.globalProperties?.$router) {
            clearInterval(intervalId);
            resolve(app.config.globalProperties.$router as Router);
        }
    }, 100); // Interval time in milliseconds (adjust as needed)
});


export default boot(({ app }) => {
    const ant = installAntelope(app);

    // settting notification handlers --
    ant.config.setNotifySuccessfulTrxHandler(app.config.globalProperties.$notifySuccessTransaction);
    ant.config.setNotifySuccessMessageHandler(app.config.globalProperties.$notifySuccessMessage);
    ant.config.setNotifySuccessCopyHandler(app.config.globalProperties.$notifySuccessCopy);
    ant.config.setnotifyFailureMessage(app.config.globalProperties.$notifyFailure);
    ant.config.setNotifyDisconnectedHandler(app.config.globalProperties.$notifyDisconnected);
    ant.config.setNotifyNeutralMessageHandler(app.config.globalProperties.$notifyNeutralMessage);

    // setting log in and out callbacks --

    // we need to wait 1000 milisec to ensure app.config.globalProperties?.$router is not null
    ant.events.onLoggedIn.subscribe({
        next: async () => {
            if (window.location.pathname === '/') {
                (await getRouter(app)).push({ path: '/evm/wallet?tab=balance' });
            }
        },
    });
    ant.events.onLoggedOut.subscribe({
        next: async () => {
            if (window.location.pathname !== '/') {
                (await getRouter(app)).push({ path: '/' });
            }
        },
    });

    // setting authenticators getter --
    ant.config.setAuthenticatorsGetter(() => app.config.globalProperties.$ual.getAuthenticators().availableAuthenticators);

    // setting translation handler --
    ant.config.setLocalizationHandler((key:string) => app.config.globalProperties.$t(key));

    // set evm authenticators --
    const options: Web3ModalConfig = app.config.globalProperties.$wagmiOptions as Web3ModalConfig;
    const wagmiClient = app.config.globalProperties.$wagmi as EthereumClient;
    ant.wallets.addEVMAuthenticator(new WalletConnectAuth(options, wagmiClient));
    ant.wallets.addEVMAuthenticator(new MetamaskAuth());

    // autologin --
    ant.stores.account.autoLogin();

    // constants --
    ant.config.setIndexerHealthThresholdSeconds(10);
    ant.config.setIndexerHealthCheckInterval(5000);

    // Finally, we check if the url has the network parameter and if so, we connect to that network
    // Otherwise we just let the store decide which network to connect to
    const network = new URLSearchParams(window.location.search).get('network');
    if (network) {
        ant.stores.chain.setCurrentChain(network);
    }

});
