import { boot } from 'quasar/wrappers';
import { installAntelope } from 'src/antelope';

export default boot(({ app }) => {
    const ant = installAntelope(app);

    // settting notifucation handlers --
    ant.config.setNotifyErrorHandler(app.config.globalProperties.$errorNotification);
    ant.config.setNotifySuccessHandler(app.config.globalProperties.$successNotification);
    ant.config.setNotifyWarningHandler(app.config.globalProperties.$unexpectedErrorNotification);

    // setting log in and out callbacks --
    ant.events.onLoggedIn.subscribe({
        next: () => {
            const $router = app.config.globalProperties.$router;
            if ($router.currentRoute.value.path === '/') {
                $router.push({ path: '/balance' });
            }
        },
    });
    ant.events.onLoggedOut.subscribe({
        next: () => {
            const $router = app.config.globalProperties.$router;
            if ($router.currentRoute.value.path !== '/') {
                $router.push({ path: '/' });
            }
        },
    });

    // setting authenticators getter --
    ant.config.setAuthenticatorsGetter(() => app.config.globalProperties.$ual.getAuthenticators().availableAuthenticators);

    // setting translation handler --
    ant.config.setLocalizationHandler((key:string) => app.config.globalProperties.$t(key));
});
