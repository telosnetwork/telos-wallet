// Redirect or iFrame -----------------------------------------------------------
// if redirect or iframe is set, it means the user is coming from an external source
// and wants to use the wallet to login and come back to the external source
import {
    ComponentCustomProperties,
    ref,
} from 'vue';
import { boot } from 'quasar/wrappers';

import {
    getAntelope,
    useAccountStore,
} from 'src/antelope';
import { MetakeepAuthenticator } from 'src/antelope/wallets/ual/MetakeepUAL';
import { createTraceFunction } from 'src/antelope/config';

const url = new URLSearchParams(window.location.search);
export const redirectParam = url.get('redirect');
export const iframeParam = url.get('iframe');
export const logoutParam = url.get('logout');
export const redirect = ref<{url:string, hostname:string} | null>(null);
export const redirectShow = ref(false);
export const iframeShow = ref(false);

const trace = createTraceFunction('telosCloudJs');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let globalProps = {} as ComponentCustomProperties & Record<string, any>;

export const telosCloudResponse = async () => {
    const ant = getAntelope();
    const accountStore = useAccountStore();

    trace('telosCloudResponse');
    // if the redirect parameter is present, show a confirm notification to the user

    if (redirectShow.value && redirect.value) {
        const hostname = redirect.value.hostname;
        const message = globalProps.$t('home.redirect_notification_message', { hostname });
        globalProps.$notifyWarningWithAction(message, {
            label: ant.config.localizationHandler('home.redirect_me'),
            handler: () => {
                // we redirect the user to the url
                if (redirect.value) {
                    // we need to generate a new url based on redirect.value?.url adding the accountStore.loggedNativeAccount?.account
                    // and the email of the user if it's a metakeep authenticator
                    const url = new URL(redirect.value.url);
                    trace('telosCloudResponse', 'url', url.toString());
                    url.searchParams.set('account', accountStore.loggedNativeAccount?.account || '');
                    trace('telosCloudResponse', 'adding the account...', url.toString());
                    const authenticator = accountStore.loggedNativeAccount.authenticator;
                    trace('telosCloudResponse', 'adding the email...', url.toString());
                    const auth = authenticator as never as MetakeepAuthenticator;
                    url.searchParams.set('email', auth.getEmail());
                    trace('telosCloudResponse', 'redirecting to', url.toString());
                    window.location.href = url.toString();
                }
            },
        });
    } else if (iframeShow.value) {
        // if the iframe parameter is present, we send the credentials to the parent window
        const authenticator = accountStore.loggedNativeAccount.authenticator;
        const auth = authenticator as never as MetakeepAuthenticator;
        const credentials: {account: string, email: string, keys: string[] } = {
            account: accountStore.loggedNativeAccount?.account || '',
            email: auth.getEmail(),
            keys: auth.getKeys() ?? [],
        };
        const str = JSON.stringify(credentials);
        trace('telosCloudResponse', { credentials, str, logoutParam, href: window.location.href });
        if (logoutParam) {
            accountStore.logout();
        }
        window.parent.postMessage(str, '*');
    }
};

export default boot(async ({ app }) => {
    const ant = getAntelope();
    globalProps = app.config.globalProperties;

    if (redirectParam) {
        const isValid = new RegExp('^(http|https)://', 'i').test(redirectParam);
        if (isValid) {
            redirect.value = {
                url: redirectParam,
                hostname: new URL(redirectParam).hostname,
            };
            redirectShow.value = true;
        }
    }

    if (iframeParam) {
        const isValid = new RegExp('^(http|https)://', 'i').test(iframeParam);
        if (isValid) {
            redirect.value = {
                url: iframeParam,
                hostname: new URL(iframeParam).hostname,
            };
            iframeShow.value = true;
        }
    }

    const subscription = ant.events.onLoggedIn.subscribe({
        next: () => {
            telosCloudResponse();
            subscription.unsubscribe();
        },
    });


});

console.log('TelosCloudJs-0.9.19 supported');
