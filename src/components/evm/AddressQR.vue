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
        size: {
            type: Number,
            default: 400,
        },
    },
    mounted() {
        this.generateQrCode();
    },
    methods: {
        generateQrCode() {
            const background = getComputedStyle(document.body).getPropertyValue('--header-bg-color');

            if (this.address !== '') {
                new QRious({
                    background,
                    level: 'H',
                    size: this.size,
                    element: document.getElementById('qr-code'),
                    value: this.address,
                });
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

