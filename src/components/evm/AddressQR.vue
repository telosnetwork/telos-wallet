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
    data: () => ({
        qrInstance: null as null | QRious,
    }),
    mounted() {
        this.generateQrCode();
    },
    methods: {
        generateQrCode() {
            const background = getComputedStyle(document.body).getPropertyValue('--header-bg-color');
            this.qrInstance = this.address !== '' ?
                new QRious({
                    background,
                    level: 'H',
                    size: this.size,
                    element: document.getElementById('qr-code'),
                    value: this.address,
                }) :
                null;
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

