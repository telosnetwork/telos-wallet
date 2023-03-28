<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    name: 'AppPage',
    props: {
        centerHeader: {
            type: Boolean,
            default: true,
        },
    },
});
</script>

<template>
<div class="c-app-page">
    <div
        :class="{
            'c-app-page__header': true,
            'c-app-page__header--centered': centerHeader,
        }"
    >
        <slot name="header"></slot>
    </div>

    <div class="c-app-page__body">
        <slot name="body"></slot>
    </div>
</div>
</template>

<style lang="scss">
.c-app-page {
    &__header {
        background: $page-header;

        &--centered {
            display: flex;
            justify-content: center;
        }
    }

    &__header,
    &__body {
        padding: 24px;

        @media only screen and (min-width: $breakpoint-lg-min) {
            padding: 32px;
        }
    }
}
</style>
