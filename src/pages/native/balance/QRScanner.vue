<script>
import { mapGetters, mapActions } from 'vuex';
import { QrcodeStream } from 'vue3-qrcode-reader';

export default {
    props: ['showQRScannerDlg', 'coins'],
    components: {
        QrcodeStream,
    },
    data: () => ({
        camera: 'auto',
        activateQR: false,
        loading: false,
    }),
    computed: {
        ...mapGetters('account', ['isAuthenticated', 'accountName']),
        ...mapGetters('global', ['pTokens']),
        showDlg: {
            get() {
                return this.showQRScannerDlg;
            },
            set(value) {
                this.$emit('update:showQRScannerDlg', value);
            },
        },
        cardHeight() {
            return window.innerHeight - 100;
        },
    },
    watch: {
        showDlg() {
            if (this.showDlg) {
                setTimeout(() => {
                    this.activateQR = true;
                }, 250);
            } else {
                this.activateQR = false;
            }
        },
    },
    methods: {
        async onInit (promise) {
            this.loading = true;

            try {
                const { capabilities } = await promise;
                // successfully initialized
            } catch (error) {
                if (error.name === 'NotAllowedError') {
                    // user denied camera access permisson
                    this.$errorNotification(this.$t('components.cammera_access_error_1'));
                } else if (error.name === 'NotFoundError') {
                    // no suitable camera device installed
                    this.$errorNotification(this.$t('components.cammera_access_error_2'));
                } else if (error.name === 'NotSupportedError') {
                    // page is not served over HTTPS (or localhost)
                    this.$errorNotification(this.$t('components.cammera_access_error_3'));
                } else if (error.name === 'NotReadableError') {
                    // maybe camera is already in use
                    this.$errorNotification(this.$t('components.cammera_access_error_4'));
                } else if (error.name === 'OverconstrainedError') {
                    // did you requested the front camera although there is none?
                    this.$errorNotification(this.$t('components.cammera_access_error_5'));
                } else if (error.name === 'StreamApiNotSupportedError') {
                    // browser seems to be lacking features
                    this.$errorNotification(this.$t('components.cammera_access_error_6'));
                }
                this.showDlg = false;
            } finally {
                this.loading = false;
            }
        },
        ...mapActions('account', ['accountExists']),
        async onDecode (qrcode) {
            if (qrcode) {
                const accountName = qrcode.substring(0, qrcode.lastIndexOf('('));
                const coinName = qrcode.slice(qrcode.lastIndexOf('(') + 1, -1);
                const coin = this.coins.find(coin => coin.name === coinName);
                let networkType = 'telos';

                if (coin && this.pTokens.includes(coin.symbol.toLowerCase()) && accountName.length > 12) {
                    if (coinName === 'Telos') {
                        if (accountName.length !== 42 || !accountName.startsWith('0x')) {
                            this.$errorNotification(this.$t('components.address_not_exist', { account:accountName }));
                            return;
                        }
                        networkType = 'tevm';
                    } else if (coinName === 'pTokens BTC') {
                        const data = await fetch(`https://api.smartbit.com.au/v1/blockchain/address/${accountName}`)
                            .then(resp => resp.json());
                        if (!data.success) {
                            this.$errorNotification(this.$t('components.address_not_exist', { account:accountName }));
                            return;
                        }
                        networkType = 'ptoken';
                    } else if (coinName === 'pTokens ETH') {
                        if (accountName.length !== 42 || !accountName.startsWith('0x')) {
                            this.$errorNotification(this.$t('components.address_not_exist', { account:accountName }));
                            return;
                        }
                        networkType = 'ptoken';
                    }
                } else if (!(await this.accountExists(accountName))) {
                    this.$errorNotification(this.$t('components.account_not_exist', { account:accountName }));
                    return;
                }

                this.$emit('update:showQRScannerDlg', false);
                this.$emitter.emit('qrcode_scanned', { accountName, coinName, networkType });
            }
        },
    },
};
</script>

<template>
<q-dialog
    v-model="showDlg"
    persistent
    :maximized="true"
    transition-show="slide-left"
    transition-hide="slide-right"
>
    <div v-if="loading" class="q-qr-spinner-container ">
        <q-spinner size="64px" color="secondary" />
    </div>
    <QrcodeStream
        v-if="activateQR"
        :camera="camera"
        @init="onInit"
        @decode="onDecode"
    />
    <q-card class="full-height main-card absolute transparent">
        <q-layout
            view="hHh Lpr fff"
            container
            class="shadow-4 coinview"
        >
            <q-header class="bg-white text-grey-8 q-pa-sm transparent">
                <q-toolbar class="no-padding">
                    <q-btn
                        v-close-popup
                        round
                        flat
                        dense
                        class="text-white bg-grey-8"
                        icon="close"
                    />
                </q-toolbar>
            </q-header>
            <q-page-container>
                <div class="column" :style="`height: ${cardHeight}px;`">
                    <q-space/>
                    <q-space/>
                    <div class="text-center text-white text-h5">{{$t('components.scan_qr')}}</div>
                    <div class="text-center text-white text-subtitle1">{{$t('components.send_or_connect')}}</div>
                    <div class="text-center text-white text-subtitle1">{{$t('components.to_a_desktop_website')}}</div>
                    <q-space/>
                </div>
            </q-page-container>
        </q-layout>
    </q-card>

</q-dialog>
</template>

<style scoped>

.main-card {
    background-image: linear-gradient(white, #f0f0f0);
    max-width: 800px;
    margin: auto;
}

.q-qr-spinner-container {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    justify-content: center;
    align-items: center;
}

</style>
