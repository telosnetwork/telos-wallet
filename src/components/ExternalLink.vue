<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
    text: string,
    url: string,
    purpose?: string,
}>();

const formattedText = computed(() => {
    const textIsAddress = /^0x[0-9a-fA-F]+$/.test(props.text);

    if (textIsAddress) {
        const address = props.text;
        return address.slice(0, 6) + '...' + address.slice(-4);
    }

    return props.text;
});

</script>

<template>
<a
    :href="url"
    :aria-label="purpose"
    target="_blank"
    rel="noopener noreferrer"
    class="c-external-link__link"
>
    {{ formattedText }}
    <q-icon size="xs" name="launch" class="c-external-link__icon"/>
</a>
</template>

<style lang="scss">
.c-external-link {
    &__link {
        line-height: 24px;
        text-decoration: none;
        color: $link-blue;
        display: inline-flex;
        align-items: center;
    }

    &__icon {
        color: $link-blue;
        margin-left: 4px;
        transform: scale(0.67);
    }
}
</style>
