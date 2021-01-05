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
            <div class="text-center text-white text-h5">Scan QR code</div>
            <div class="text-center text-white text-subtitle1">Send money or connect</div>
            <div class="text-center text-white text-subtitle1">to a desktop website</div>
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

export default {
  props: ['showQRScannerDlg'],
  components: {
    QrcodeStream,
  },
  computed: {
    ...mapGetters('account', ['isAuthenticated', 'accountName']),
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
        if (!(await this.accountExists(qrcode))) {
          this.$q.notify({
            type: 'negative',
            message: `Account does not exist`,
          });
          return;
        }
        this.$emit('update:showQRScannerDlg', false);
        this.$root.$emit('qrcode_scanned', qrcode);
      }
    }
  },
};
</script>

<style scoped>
.toolbar-title {
  position: absolute;
  text-align: center;
}
.display-grid {
  display: grid;
}
.h-20 {
  height: 20px;
}
.main-card {
  background-image: linear-gradient(white, #f0f0f0);
}
.qr-card {
  width: 85%;
  border-radius: 20px;
}
</style>