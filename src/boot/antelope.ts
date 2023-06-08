import { boot } from 'quasar/wrappers';
import { installAntelope } from 'src/antelope';

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
    ant.events.onLoggedIn.subscribe({
        next: () => {
            if (window.location.pathname === '/') {
                app.config.globalProperties?.$router?.push({ path: '/evm/wallet?tab=balance' });
            }
        },
    });
    ant.events.onLoggedOut.subscribe({
        next: () => {
            if (window.location.pathname !== '/') {
                app.config.globalProperties?.$router?.push({ path: '/' });
            }
        },
    });

    // setting authenticators getter --
    ant.config.setAuthenticatorsGetter(() => app.config.globalProperties.$ual.getAuthenticators().availableAuthenticators);

    // setting translation handler --
    ant.config.setLocalizationHandler((key:string) => app.config.globalProperties.$t(key));

    // autologin --
    ant.stores.account.autoLogin();

    // constants --
    ant.config.setIndexerHealthThresholdSeconds(10);
    ant.config.setIndexerHealthCheckInterval(5000);

});
