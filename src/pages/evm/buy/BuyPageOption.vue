<script lang="ts" setup>

const props = defineProps<{
    buttonLabel: string;
    description: string;
}>();

</script>

<template>
<div>
    <q-button>{{ buttonLabel }}</q-button>
    <p>{{ description }}</p>
</div>
</template>

<style lang="scss">
</style>
