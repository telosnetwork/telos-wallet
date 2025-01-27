import { EthereumClient } from '@web3modal/ethereum';
import { Web3ModalConfig } from '@web3modal/html';
import { boot } from 'quasar/wrappers';
import { installAntelope } from 'src/antelope';
import { AccountModel } from 'src/antelope/stores/account';
import { AntelopeError } from 'src/antelope/types';
import {
    MetamaskAuth,
    WalletConnectAuth,
    SafePalAuth,
} from 'src/antelope/wallets';
import { BraveAuth } from 'src/antelope/wallets/authenticators/BraveAuth';
import { App } from 'vue';
import { Router } from 'vue-router';
import { resetNativeApi } from 'src/boot/api';

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

    // if the user changes the network, we need to reset the native api
    ant.events.onNetworkChanged.subscribe({
        next: async ({ chain }) => {

            resetNativeApi(chain);
            chain.settings.getRPCEndpoint();
        },
    });

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
        },
    });

    ant.events.onNetworkChanged.subscribe({
        next: async () => {
            // first recreate the authenticators based on the new network
            const zeroAuthenticators = app.config.globalProperties.recreateAuthenticator();
            // set the new authenticators list
            ant.config.setAuthenticatorsGetter(() => zeroAuthenticators);
            for (const authenticator of zeroAuthenticators) {
                ant.wallets.addZeroAuthenticator(authenticator);
            }
        },
    });


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

    // We can simulate the indexer being down for testing purposes by uncommenting the following line
    // (ant.stores.chain.currentChain.settings as EVMChainSettings).simulateIndexerDown(true);




});
