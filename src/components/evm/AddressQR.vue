<script lang="ts" setup>
import { defineComponent, onMounted, ref } from 'vue';
import QRious from 'qrious';

const props = defineProps({
    address: {
        type: String,
        required: true,
    },
    size: {
        type: Number,
        default: 400,
    },
});

const qrInstance = ref<QRious>();

onMounted(() => {
    qrInstance.value = new QRious({
        background: getComputedStyle(document.body).getPropertyValue('--header-bg-color'),
        level: 'H',
        size: props.size,
        element: document.getElementById('qr-code'),
        value: props.address,
    });
});

</script>

<template>
<canvas id="qr-code"></canvas>
</template>

