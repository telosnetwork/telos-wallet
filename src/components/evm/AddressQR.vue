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
            const background = getComputedStyle(document.body).getPropertyValue('--header-bg-color');

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
<canvas id="qr-code"></canvas>
</template>

