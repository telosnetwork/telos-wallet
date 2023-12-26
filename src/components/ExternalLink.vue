<script setup lang="ts">
import { computed } from 'vue';
import { getShortenedHash } from 'src/antelope/stores/utils';

const props = defineProps<{
    text: string,
    url: string,
    purpose?: string,
    expandAddress?: boolean,
}>();

const formattedText = computed(() => {
    const textIsAddress = /^0x[0-9a-fA-F]+$/.test(props.text);

    if (textIsAddress && !props.expandAddress) {
        return getShortenedHash(props.text);
    }

    return props.text;
});

</script>

<template>
<a
    :href="url"
    :aria-label="purpose"
    :title="purpose"
    target="_blank"
    rel="noopener noreferrer"
    class="c-external-link__link"
>
    <div class="c-external-link__text">{{ formattedText }}</div>
    <q-icon size="xs" name="o_launch" class="c-external-link__icon"/>
</a>
</template>

<style lang="scss">
.c-external-link {
    &__link {
        @include text--paragraph;

        text-decoration: none;
        color: var(--link-color);
        display: inline-flex;
        align-items: center;
        gap: 4px;
        max-width: 100%;
    }

    &__text {
        display: inline-block;
        min-width: 0;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    &__icon {
        color: var(--link-color);
        transform: scale(0.67);
    }
}
</style>
