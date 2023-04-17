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
    <a
        :href="url"
        target="_blank"
        rel="noopener noreferrer"
        class="c-external-link__link"
    >
        {{ formattedText }}
    </a>

    <q-icon size="xs" name="launch" class="c-external-link__icon"/>
</div>
</template>

<style lang="scss">
.c-external-link {
    display: inline-flex;
    align-items: center;

    &__link {
        text-decoration: none;
        color: $link-blue;
    }

    &__icon {
        color: $link-blue;
        margin-left: 4px;
        transform: scale(0.67);
    }
}
</style>
