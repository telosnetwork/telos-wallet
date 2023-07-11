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
    border: 1px solid var(--header-item-outline-color);
    background-color: var(--bg-color);
    padding: 16px;
    word-break: break-word;
}
</style>
