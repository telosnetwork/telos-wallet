import { EthereumClient } from '@web3modal/ethereum';
import { Web3ModalConfig } from '@web3modal/html';
import { boot } from 'quasar/wrappers';
import { CURRENT_CONTEXT, installAntelope } from 'src/antelope';
import { AccountModel } from 'src/antelope/stores/account';
import { AntelopeError } from 'src/antelope/types';
import {
    MetamaskAuth,
    WalletConnectAuth,
    SafePalAuth,
    MetaKeepAuth,
    MetakeepOptions,
} from 'src/antelope/wallets';
import { BraveAuth } from 'src/antelope/wallets/authenticators/BraveAuth';
import { googleCtrl } from 'src/pages/home/GoogleOneTap';
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
    ant.config.setNotifyWarningWithAction(app.config.globalProperties.$notifyWarningWithAction);
    ant.config.setNotifyDisconnectedHandler(app.config.globalProperties.$notifyDisconnected);
    ant.config.setNotifyNeutralMessageHandler(app.config.globalProperties.$notifyNeutralMessage);
    ant.config.setNotifyRememberInfoHandler(app.config.globalProperties.$notifyRememberInfo);

    // setting log in and out callbacks --

    // we need to wait 1000 milisec to ensure app.config.globalProperties?.$router is not null
    ant.events.onLoggedIn.subscribe({
        next: async (account: AccountModel) => {
            if (account.isNative) {
                if (!window.location.pathname.startsWith('/zero')) {
                    const router = await getRouter(app);
                    router.push({ path: '/zero/balance' });
                }
            } else {
                if (!window.location.pathname.startsWith('/evm')) {
                    const router = await getRouter(app);
                    router.push({ path: '/evm/wallet?tab=balance' });
                }
            }

        },
    });
    ant.events.onLoggedOut.subscribe({
        next: async () => {
            if (window.location.pathname !== '/') {
                (await getRouter(app)).push({ path: '/' });
            }
            // we also need to clear Google One Tap Controller
            googleCtrl.logout();
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
    const metakeepOptions: MetakeepOptions = {
        appName: process.env.APP_NAME as string,
        appId: process.env.METAKEEP_APP_ID_EVM as string,
    };
    ant.wallets.addEVMAuthenticator(new MetaKeepAuth(metakeepOptions));

    // autologin --
    ant.stores.account.autoLogin();

    // constants --
    ant.config.setIndexerHealthThresholdSeconds(10);
    ant.config.setIndexerHealthCheckInterval(5000);

    // We only allow debug mode if we are not in production or in a sensitive environment
    const weAreNotInProduction = process.env.NODE_ENV !== 'production';
    const weAreInLocalhost = document.location.hostname === 'localhost';
    const weAreInNetlify = document.location.hostname.includes('netlify');
    ant.config.debug.allowDebugMode(weAreNotInProduction || weAreInLocalhost || weAreInNetlify);

    // Finally, we check if the url has the network parameter and if so, we connect to that network
    // Otherwise we just let the store decide which network to connect to
    const network = new URLSearchParams(window.location.search).get('network');
    if (network) {
        ant.stores.chain.setChain(CURRENT_CONTEXT, network);
    } else if (typeof process.env.DEFAULT_NETWORK === 'string') {
        // if we have a default network, we connect to it (this can be changed dynamically later on)
        const defaultNetwork = process.env.DEFAULT_NETWORK;
        console.log('setChain: ', defaultNetwork);
        ant.stores.chain.setChain(CURRENT_CONTEXT, defaultNetwork);
    }

});
