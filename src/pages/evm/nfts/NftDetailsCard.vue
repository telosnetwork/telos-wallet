<script setup lang="ts">

const props = defineProps<{
    title: string,
}>();
</script>

<template>
<div class="c-nft-details-card">
    <h5 class="q-mb-sm">{{ title }}</h5>

    <slot></slot>
</div>
</template>

<style lang="scss">

.c-nft-details-card {
    border-radius: 4px;
    border: 1px solid var(--border-over-header-color);
    background-color: var(--card-background-color);
    padding: 16px;
    word-break: break-word;
    white-space: pre-wrap;
}
</style>
