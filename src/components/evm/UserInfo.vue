<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    name: 'UserInfo',
});
</script>

<template>
<div class="c-user-info">
    <div class="c-user-info__address">0xA1b2...8c9d</div>
    <q-btn
        flat
        dense
        icon="content_copy"
        color="purple"
        class="q-mr-sm"
        :aria-label="$t('copy_address')"
    />
    <q-btn
        flat
        dense
        icon="more_vert"
        :aria-label="$t('overflow_menu')"
    />
</div>
</template>

<style lang="scss">
.c-user-info {
    display: flex;
    align-items: center;

    &__address {
        font-weight: 500;

        font-size: 20px;
        line-height: 24px;
        margin-right: 16px;

        @media only screen and (min-width: $breakpoint-lg-min) {
            font-weight: 600;
        }

    }
}
</style>

