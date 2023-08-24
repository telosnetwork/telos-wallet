<script lang="ts" setup>
import { QBtn } from 'quasar';
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
    <QBtn class="c-buy-page-option__button" @click="$emit('fetch-link')" >
        <div class="c-buy-page-option__label">
            <img
                src="https://raw.githubusercontent.com/telosnetwork/images/master/logos_2021/Symbol%202.svg"
                class="c-wallet-balance-row__logo"
                height="22"
                width="22"
                aria-hidden="true"
                alt="Token logo"
            >
            {{ buttonLabel }}
            <q-icon v-if="!widget" size="16px" name="launch" />
        </div>
        <div class="c-buy-page-option__powered">{{ $t('evm_buy.powered_by', { provider: poweredBy }) }}</div>
    </QBtn>
    <div class="c-buy-page-option__header">{{ header }}</div>
    <div class="c-buy-page-option__subheader">{{ subheader }}
        <a v-if="subheaderLink" :href='subheaderLink' target="_blank">{{ subheaderLinkText }}</a>
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
        border: 1px solid $primary;
        background: $white; // TODO use existing css vars over sass vars
        box-shadow: 0px 1px 5px 0px rgba(0, 0, 0, 0.20), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 3px 1px -2px rgba(0, 0, 0, 0.12);
        &:hover {
            background: $off-white; // TODO do we really need a new color for this?
        }
    }

    // TODO use typography classes for text styling

    &__label {
        display: flex;
        align-items: center;
        width: 100%;
        gap: 4px;
        align-self: stretch;
        color: var(--text-default-contrast);
        font-size: 24px;
        font-weight: 600;
        line-height: 130%;
        text-transform: none;
    }

    &__powered {
        margin-left: auto;
        color: var(--text-default-contrast);
        text-align: center;
        font-size: 12px;
        font-weight: 400;
        line-height: 150%;
        text-transform: none;
    }

    &__header {
        align-self: stretch;
        color: var(--text-default-contrast);
        text-align: center;
        font-size: 20px;
        font-weight: 600;
        line-height: 130%;
    }

    &__subheader {
        align-self: stretch;
        color: var(--text-default-contrast);
        text-align: center;
        font-size: 16px;
        font-weight: 400;
        line-height: 150%;
    }
}
</style>
