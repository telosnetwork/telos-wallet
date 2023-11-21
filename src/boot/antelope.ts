import { EthereumClient } from '@web3modal/ethereum';
import { Web3ModalConfig } from '@web3modal/html';
import { OreIdOptions } from 'oreid-js';
import { boot } from 'quasar/wrappers';
import { CURRENT_CONTEXT, installAntelope } from 'src/antelope';
import { AntelopeError } from 'src/antelope/types';
import {
    MetamaskAuth,
    WalletConnectAuth,
    OreIdAuth,
    SafePalAuth,
} from 'src/antelope/wallets';
import { BraveAuth } from 'src/antelope/wallets/authenticators/BraveAuth';
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
    ant.config.setNotifyFailureMessage(app.config.globalProperties.$notifyFailure);
    ant.config.setNotifyFailureWithAction(app.config.globalProperties.$notifyFailureWithAction);
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
    ant.config.setLocalizationHandler((key:string, payload?: Record<string, unknown>) => app.config.globalProperties.$t(key, payload ? payload : {}));

    // setting transaction error handler --
    ant.config.setTransactionErrorHandler((err: object) => {
        if (err instanceof AntelopeError) {
            const evmErr = err as AntelopeError;
            if (evmErr.message === 'antelope.evm.error_transaction_canceled') {
                ant.config.notifyNeutralMessageHandler(ant.config.localizationHandler(evmErr.message));
            } else {
                ant.config.notifyFailureMessage(ant.config.localizationHandler(evmErr.message), evmErr.payload);
            }
        } else {
            ant.config.notifyFailureMessage(ant.config.localizationHandler('evm_wallet.general_error'));
        }
    });

    // set evm authenticators --
    const options: Web3ModalConfig = app.config.globalProperties.$wagmiOptions as Web3ModalConfig;
    const wagmiClient = app.config.globalProperties.$wagmi as EthereumClient;
    ant.wallets.addEVMAuthenticator(new WalletConnectAuth(options, wagmiClient));
    ant.wallets.addEVMAuthenticator(new MetamaskAuth());
    ant.wallets.addEVMAuthenticator(new SafePalAuth());
    ant.wallets.addEVMAuthenticator(new BraveAuth());
    const oreIdOptions: OreIdOptions = {
        appName: process.env.APP_NAME,
        appId: process.env.OREID_APP_ID as string,
    };
    ant.wallets.addEVMAuthenticator(new OreIdAuth(oreIdOptions));

    // autologin --
    ant.stores.account.autoLogin();

    // constants --
    ant.config.setIndexerHealthThresholdSeconds(10);
    ant.config.setIndexerHealthCheckInterval(5000);

    // Finally, we check if the url has the network parameter and if so, we connect to that network
    // Otherwise we just let the store decide which network to connect to
    const network = new URLSearchParams(window.location.search).get('network');
    if (network) {
        ant.stores.chain.setChain(CURRENT_CONTEXT, network);
    }

});
