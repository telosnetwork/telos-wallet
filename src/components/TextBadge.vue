<script setup lang="ts">
const props = defineProps<{
    label: string;
}>();
</script>

<template>
<div class="c-text-badge">
    <q-badge outline :label="label" />
</div>
</template>

<style lang="scss">
.c-text-badge {
    // quasar overrides
    .q-badge {
        padding: 4px 6px;
        border-color: var(--accent-color-3);
        color: var(--text-default-contrast)
    }
}
</style>
