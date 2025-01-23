import { boot } from 'quasar/wrappers';
import { UAL } from 'universal-authenticator-library';
import { Anchor } from 'ual-anchor';
import { Wombat } from 'ual-wombat';
import { CleosAuthenticator } from '@telosnetwork/ual-cleos';
import { WebPopup } from 'oreid-webpopup';
import { OreIdAuthenticator, AuthProvider } from 'ual-oreid';
import { Dialog, Notify, copyToClipboard } from 'quasar';
import { useChainStore } from 'src/antelope';


export default boot(async ({ app, store }) => {

    async function loginHandler() {
        let accountName = 'eosio';
        let permission = 'active';
        if (localStorage.getItem('autoLogin') === 'cleos') {
            accountName = localStorage.getItem('account');
        } else {
            await new Promise((resolve, reject) => {
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
                        reject('cancelled');
                    })
                    .onDismiss(() => {
                        resolve(true);
                    });
            }).catch((e) => {
                throw e;
            });
            if (store.state.account.justViewer || localStorage.getItem('justViewer')) {
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
                            throw 'cancelled';
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
            const network_host = useChainStore().currentChain.settings.getRPCEndpoint().host;
            Dialog.create({
                class: 'cleos-auth-dialog',
                color: 'primary',
                message: `<pre>cleos -u https://${network_host} push transaction '${trxJSON}'</pre>`,
                html: true,
                cancel: true,
                fullWidth: true,
                ok: {
                    label: 'Copy',
                },
            })
                .onOk(() => {
                    copyToClipboard(
                        `cleos -u https://${network_host} push transaction '${trxJSON}'`,
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
                    throw 'cancelled';
                })
                .onDismiss(() => {
                    resolve(true);
                });
        });
    }


    app.config.globalProperties.recreateAuthenticator = function() {

        if (useChainStore().currentChain.settings.isNative()) {
            const settings = useChainStore().currentNativeChain.settings;

            const ual_chain = {
                chainId: settings.getChainId(),
                rpcEndpoints: [settings.getRPCEndpoint()],
            };

            const authenticators = [
                new Anchor([ual_chain], { appName: process.env.APP_NAME }),
                new Wombat([ual_chain], { appName: process.env.APP_NAME }),
                new CleosAuthenticator([ual_chain], {
                    appName: process.env.APP_NAME,
                    loginHandler,
                    signHandler,
                }),
            ];

            const ual = new UAL([ual_chain], 'ual', authenticators);
            store['$ual'] = ual;
            app.config.globalProperties.$ual = ual;

            return authenticators;
        } else {
            return [];
        }
    };


});
