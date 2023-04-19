<script setup lang="ts">
import { computed } from 'vue';
import moment from 'moment';

const props = defineProps({
    timestamp: {
        type: Number,
        required: true,
        validator: (stamp: number) => stamp % 1 === 0,
    },
    muted: {
        type: Boolean,
        default: false,
    },
});

// eztodo this is showing as 4 months ago for today's time
const friendlyDate = computed(() => moment.unix(props.timestamp).fromNow());

</script>

<template>
<span
    :class="{
        'c-timestamp': true,
        'c-timestamp--muted': muted,
    }"
>
    {{ friendlyDate }}
</span>
</template>

<style lang="scss">
.c-timestamp {
    white-space: nowrap;
    width: max-content;
    font-weight: 400;
    font-size: 14px;
    line-height: 16px;

    &--muted {
        color: var(--text-color-muted);
    }
}
</style>
