<script setup lang="ts">
import ExternalLink from 'components/ExternalLink.vue';

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
    border: 1px solid darken($page-header, 5%);
    background-color: var(--bg-color);
    padding: 16px;
}
</style>
