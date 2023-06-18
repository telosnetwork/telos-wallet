<script setup lang="ts">
import { computed } from 'vue';
import { getShortenedHash } from 'src/antelope/stores/utils';

const props = defineProps<{
    text: string,
    url: string,
    purpose?: string,
}>();

const formattedText = computed(() => {
    const textIsAddress = /^0x[0-9a-fA-F]+$/.test(props.text);

    if (textIsAddress) {
        return getShortenedHash(props.text);
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
    <q-icon size="xs" name="o_launch" class="c-external-link__icon"/>
</a>
</template>

<style lang="scss">
.c-external-link {
    &__link {
        line-height: 24px;
        text-decoration: none;
        color: var(--link-color);
        display: inline-flex;
        align-items: center;
    }

    &__icon {
        color: var(--link-color);
        margin-left: 4px;
        transform: scale(0.67);
    }
}
</style>
