<script lang="ts" setup>
import { QBtn } from 'quasar';


const props = defineProps<{
    buttonLabel: string;
    poweredBy: string;
    header: string;
    subheader: string;
}>();

</script>

<template>
<div>
    <QBtn>{{ buttonLabel }} powered by{{ poweredBy }}</QBtn>
    <p>{{ header }}</p>
    <p>{{ subheader }}</p>
</div>
</template>

<style lang="scss">
</style>
