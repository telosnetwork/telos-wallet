<script lang="ts" setup>
import { useI18n } from 'vue-i18n';

const props = defineProps<{
    buttonLabel: string;
    poweredBy: string;
    header: string;
    subheader: string;
    widget: boolean;
    subheaderLink?: string;
    subheaderLinkText?: string;
}>();

const { t: $t } = useI18n();

</script>

<template>
<div class="c-buy-page-option">
    <q-btn class="c-buy-page-option__button" @click="$emit('fetch-link')" >
        <div class="c-buy-page-option__label">
            <img
                src="https://raw.githubusercontent.com/telosnetwork/images/master/logos_2021/Symbol%202.svg"
                height="24"
                width="24"
                aria-hidden="true"
                alt="Token logo"
            >
            <span class="c-buy-page-option__button-label">{{ buttonLabel }}</span>
            <q-icon v-if="!widget" size="16px" name="launch" />
        </div>
        <div class="c-buy-page-option__powered">{{ $t('evm_buy.powered_by', { provider: poweredBy }) }}</div>
    </q-btn>
    <div class="c-buy-page-option__header">{{ header }}</div>
    <div class="c-buy-page-option__subheader">
        {{ subheader }}
        <a
            v-if="subheaderLink"
            :href="subheaderLink"
            target="_blank"
            class="o-text--link"
        >
            {{ subheaderLinkText }}
        </a>
    </div>
</div>
</template>

<style lang="scss">
.c-buy-page-option {
    display: flex;
    width: 320px;
    flex-direction: column;
    justify-content: center;
    align-items: flex-end;
    gap: 16px;

    &__button {
        display: flex;
        padding: 16px 24px;
        flex-direction: column;
        justify-content: center;
        align-items: flex-end;
        gap: 4px;
        align-self: stretch;
        border-radius: 4px;
        background-color: var(--bg-color);
        border: 1px solid var(--accent-color);
        transition: background-color 0.2s ease;

        &:hover {
            background-color: var(--accent-color-5);
        }
    }

    &__button-label {
        @include text--header-4;

        @include md-and-up {
            @include text--header-2;
        }

        text-transform: none;
    }

    &__label {
        display: flex;
        align-items: center;
        width: 100%;
        gap: 4px;
        align-self: stretch;
        color: var(--text-default-contrast);
    }

    &__powered {
        margin-left: auto;
        color: var(--text-default-contrast);
        text-align: center;
        text-transform: none;

        @include text--small;
    }

    &__header {
        align-self: stretch;
        color: var(--text-default-contrast);
        text-align: center;

        @include text--header-4;
    }

    &__subheader {
        align-self: stretch;
        color: var(--text-default-contrast);
        text-align: center;

        @include text--paragraph;
    }
}
</style>
