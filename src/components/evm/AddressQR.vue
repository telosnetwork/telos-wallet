<script lang="ts">
import { defineComponent } from 'vue';
import QRious from 'qrious';

export default defineComponent({
    name: 'AddressQR',
    props: {
        address: {
            type: String,
            required: true,
        },
    },
    mounted() {
        this.generateQrCode();
    },
    methods: {
        generateQrCode() {
            console.log('generateQrCode()');
            const background = getComputedStyle(document.body).getPropertyValue('--header-bg-color');
            console.log('background', background);

            if (this.address !== '') {
                const qr = new QRious({
                    background,
                    level: 'H',
                    size: 400,
                    element: document.getElementById('qr-code'),
                    value: this.address,
                });
                console.log('new QRious() ', qr);
            }
        },
    },
    watch: {
        address: {
            handler() {
                this.generateQrCode();
            },
            deep: true,
        },
    },
});
</script>

<template>
<canvas id="qr-code" class="c-address-qr"></canvas>
</template>

<style lang="scss">
.c-address-qr {
}
</style>
