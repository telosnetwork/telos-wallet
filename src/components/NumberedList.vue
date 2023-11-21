<script setup lang="ts">
import { useSlots } from 'vue';
const slots = useSlots();
const slotCount = Object.keys(slots).length;

</script>

<template>
<!--
To use this component, slots must be named as the index in the list, starting at 1:

<NumberedList>
    <template v-slot:1>
        Item one content here
    </template>

    <template v-slot:2>
        Item two content here
    </template>
</NumberedList>

-->
<ol class="c-numbered-list">
    <li
        v-for="index in slotCount"
        :key="`numbered-list-item-${index}`"
        class="c-numbered-list__li"
    >
        <div class="c-numbered-list__number">
            {{ index }}
        </div>
        <div>
            <slot :name="`${index}`"></slot>
        </div>
    </li>
</ol>
</template>

<style lang="scss">
.c-numbered-list {
    list-style: none;
    padding: 0;

    &__li {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
    }

    &__number {
        @include accent-text;

        flex-shrink: 0;
        display: inline-flex;
        border-radius: 50%;
        height: 24px;
        width: 24px;
        border: 1px solid var(--accent-color-3);
        justify-content: center;
        align-items: center;
    }
}
</style>
