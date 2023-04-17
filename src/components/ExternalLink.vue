<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
    text: string,
    url: string,
}>();

const formattedText = computed(() => {
    const textIsAddress = /^0x\d{40}$/.test(props.text);

    if (textIsAddress) {
        const address = props.text;
        return address.slice(0, 6) + '...' + address.slice(-4);
    }

    return props.text;
});

</script>

<template>
<div class="c-external-link">
    <a :href="url" target="_blank" rel="noopener noreferrer">{{ formattedText }}</a>
</div>
</template>

<style lang="scss">
.c-external-link {
    display: inline;
    color: $link-blue;
}
</style>
