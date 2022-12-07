<template>
  <q-dialog
    v-model="showDlg"
    persistent
    :maximized="true"
    transition-show="slide-left"
    transition-hide="slide-right"
  >
    <qrcode-stream @decode="onDecode"></qrcode-stream>
    <q-card class="full-height main-card absolute transparent" style="max-width: 800px; margin: auto;">
      <q-layout
        view="hHh Lpr fff"
        container
        class="shadow-4 coinview"
      >
        <q-header class="bg-white text-grey-8 q-pa-sm transparent">
          <q-toolbar class="no-padding">
            <q-btn round flat dense v-close-popup class="text-white bg-grey-8" icon="close"/>
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

<script>
import { mapGetters, mapActions } from 'vuex';
import moment from 'moment';
import { QrcodeStream } from 'vue-qrcode-reader'
import { accountName } from '~/store/account/getters';

export default {
  props: ['showQRScannerDlg', 'coins'],
  components: {
    QrcodeStream,
  },
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
  methods: {
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
              this.$q.notify({
                type: 'negative',
                message: $this.$t('components.address_not_exist',{account:accountName}),
              });
              return;
            }
            networkType = 'tevm';
          } else if (coinName === 'pTokens BTC') {
            const data = await fetch(`https://api.smartbit.com.au/v1/blockchain/address/${accountName}`)
              .then(resp => resp.json());
            if (!data.success) {
              this.$q.notify({
                type: 'negative',
                message: $this.$t('components.address_not_exist',{account:accountName}),
              });
              return;
            }
            networkType = 'ptoken';
          } else if (coinName === 'pTokens ETH') {
            if (accountName.length !== 42 || !accountName.startsWith('0x')) {
              this.$q.notify({
                type: 'negative',
                message: $this.$t('components.address_not_exist',{account:accountName}),
              });
              return;
            }
            networkType = 'ptoken';
          }
        } else if (!(await this.accountExists(accountName))) {
          this.$q.notify({
            type: 'negative',
            message: $this.$t('components.account_not_exist',{account:accountName}),
          });
          return;
        }

        this.$emit('update:showQRScannerDlg', false);
        this.$emitter.emit('qrcode_scanned', { accountName, coinName, networkType});
      }
    }
  },
};
</script>

<style scoped>

.main-card {
  background-image: linear-gradient(white, #f0f0f0);
}

</style>
