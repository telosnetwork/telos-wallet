import { boot } from 'quasar/wrappers';
import { UAL } from 'universal-authenticator-library';
import { Anchor } from 'ual-anchor';
import { Wombat } from 'ual-wombat';
import { CleosAuthenticator } from '@telosnetwork/ual-cleos';
import { WebPopup } from 'oreid-webpopup';
import { OreIdAuthenticator, AuthProvider } from 'ual-oreid';
import { Dialog, Notify, copyToClipboard } from 'quasar';


export default boot(async ({ app, store }) => {
    const chain = {
        chainId: process.env.NETWORK_CHAIN_ID,
        rpcEndpoints: [
            {
                protocol: process.env.NETWORK_PROTOCOL,
                host: process.env.NETWORK_HOST,
                port: process.env.NETWORK_PORT,
            },
        ],
    };

    async function loginHandler() {
        let accountName = 'eosio';
        let permission = 'active';
        if (localStorage.getItem('autoLogin') === 'cleos') {
            accountName = localStorage.getItem('account');
        } else {
            await new Promise((resolve) => {
                Dialog.create({
                    class: 'cleos-auth-dialog',
                    color: 'primary',
                    title: store.state.account.justViewer ? 'Navigate as viewer' : 'Connect to cleos',
                    message: 'Account name',
                    prompt: {
                        model: '',
                        type: 'text',
                    },
                    cancel: true,
                    persistent: true,
                })
                    .onOk((data) => {
                        accountName = data !== '' ? data : 'eosio';
                    })
                    .onCancel(() => {
                        throw 'Cancelled!';
                    })
                    .onDismiss(() => {
                        resolve(true);
                    });
            });
            if (store.state.account.justViewer) {
                permission = 'active';
            } else {
                await new Promise((resolve) => {
                    Dialog.create({
                        class: 'cleos-auth-dialog',
                        color: 'primary',
                        title: 'Connect to cleos',
                        message: 'Account permission',
                        options: {
                            type: 'radio',
                            model: [],
                            items: [
                                { label: 'Active', value: 'active' },
                                { label: 'Owner', value: 'owner' },
                            ],
                        },
                        cancel: true,
                        persistent: true,
                    })
                        .onOk((data) => {
                            permission = data;
                        })
                        .onCancel(() => {
                            throw 'Cancelled!';
                        })
                        .onDismiss(() => {
                            resolve(true);
                        });
                });
            }
        }
        return {
            accountName,
            permission,
        };
    }

    async function signHandler(trx) {
        const trxJSON = JSON.stringify(
            Object.assign(
                {
                    delay_sec: 0,
                    max_cpu_usage_ms: 0,
                },
                trx,
            ),
            null,
            4,
        );
        await new Promise((resolve) => {
            Dialog.create({
                class: 'cleos-auth-dialog',
                color: 'primary',
                message: `<pre>cleos -u https://${process.env.NETWORK_HOST} push transaction '${trxJSON}'</pre>`,
                html: true,
                cancel: true,
                fullWidth: true,
                ok: {
                    label: 'Copy',
                },
            })
                .onOk(() => {
                    copyToClipboard(
                        `cleos -u https://${process.env.NETWORK_HOST} push transaction '${trxJSON}'`,
                    )
                        .then(() => {
                            Notify.create({
                                color: 'green-4',
                                textColor: 'white',
                                message: 'Copied to clipboard',
                                timeout: 1000,
                            });
                        })
                        .catch(() => {
                            Notify.create({
                                color: 'red-8',
                                textColor: 'white',
                                message: 'Could not copy',
                                timeout: 1000,
                            });
                        });
                })
                .onCancel(() => {
                    throw 'Cancelled!';
                })
                .onDismiss(() => {
                    resolve(true);
                });
        });
    }

    const authenticators = [
        new Wombat([chain], { appName: process.env.APP_NAME }),
        new Anchor([chain], { appName: process.env.APP_NAME }),
        new CleosAuthenticator([chain], {
            appName: process.env.APP_NAME,
            loginHandler,
            signHandler,
        }),
        // TODO: What should we do with this Authenticator?
        // new OreIdAuthenticator([chain], {
        //     appId: process.env.OREID_APP_ID_NATIVE,
        //     plugins: { popup: WebPopup() },
        // },
        // AuthProvider.Google),
    ];

    const ual = new UAL([chain], 'ual', authenticators);
    store['$ual'] = ual;
    app.config.globalProperties.$ual = ual;
});
