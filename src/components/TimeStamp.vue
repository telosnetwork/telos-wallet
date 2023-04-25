<script setup lang="ts">
import { computed } from 'vue';
import { formatDistance, fromUnixTime } from 'date-fns';

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

const friendlyDate = computed(() => formatDistance(fromUnixTime(props.timestamp), new Date(), { addSuffix: true }));
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
