import * as Sentry from '@sentry/vue';
import { CaptureConsole } from '@sentry/integrations';
import { boot } from 'quasar/wrappers';

export default boot(({ app }) => {
    Sentry.init({
        app,
        dsn: 'https://8d3ad7c694eb3e1682a11051f934ef33@o4506538003005440.ingest.sentry.io/4506538005692416',
        integrations: [
            new Sentry.BrowserTracing({
                // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
                tracePropagationTargets: ['localhost', /^https:\/\/wallet.telos\.net/, /^https:\/\/wallet-staging.netlify\.app/],
            }),
            new CaptureConsole({
                levels: ['error'],
            }),
        ],
        // Performance Monitoring
        tracesSampleRate: 1.0, //  Capture 100% of the transactions
        // Session Replay
        replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
        replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
    });
});
