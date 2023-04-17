<script setup lang="ts">
import { computed } from 'vue';
import moment from 'moment';

const props = defineProps({
    timestamp: {
        type: [String, Number],
        required: true,
        validator: (stamp: string | number) => typeof stamp === 'number' || /^\d+$/.test(stamp),
    },
});

// eztodo this is showing as 4 months ago for today's time
const friendlyDate = computed(() => moment.unix(+props.timestamp).fromNow());

</script>

<template>
{{ friendlyDate }}
</template>

<style lang="scss">

</style>
