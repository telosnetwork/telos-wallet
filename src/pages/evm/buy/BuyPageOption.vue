<script lang="ts" setup>
import { QBtn } from 'quasar';


const props = defineProps<{
    buttonLabel: string;
    poweredBy: string;
    header: string;
    subheader: string;
    subheaderLink: string;
}>();

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
            {{ buttonLabel }}</div>
        <div class="c-buy-page-option__powered">powered by {{ poweredBy }} </div>
    </QBtn>
    <div class="c-buy-page-option__header">{{ header }}</div>
    <div class="c-buy-page-option__subheader">{{ subheader }}
        <a v-if="subheaderLink" :href='subheaderLink' target="_blank">{{ subheaderLink }}</a>
    </div>
</div>
</template>

<style lang="scss">
.c-buy-page-option{
    display: flex;
    width: 320px;
    flex-direction: column;
    justify-content: center;
    align-items: flex-end;
    gap: 16px;

    &__button{
        display: flex;
        padding: 16px 24px;
        flex-direction: column;
        justify-content: center;
        align-items: flex-end;
        gap: 4px;
        align-self: stretch;
        border-radius: 4px;
        border: 1px solid #571AFF;
        background: #FFF;
        box-shadow: 0px 1px 5px 0px rgba(0, 0, 0, 0.20), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 3px 1px -2px rgba(0, 0, 0, 0.12);
        &:hover{
            background: #F6F6FE;
        }
    }

    &__label{
        display: flex;
        align-items: center;
        width: 100%;
        gap: 4px;
        align-self: stretch;
        color:#4D4D4D;
        font-size: 24px;
        font-weight: 600;
        line-height: 130%;
        text-transform: none;
    }

    &__powered{
        margin-left: auto;
        color: #4D4D4D;
        text-align: center;
        font-size: 12px;
        font-weight: 400;
        line-height: 150%;
        text-transform: none;
    }

    &__header{
        align-self: stretch;
        color: #4D4D4D;
        text-align: center;
        font-size: 20px;
        font-weight: 600;
        line-height: 130%;
    }

    &__subheader{
        align-self: stretch;
        color: #4D4D4D;
        text-align: center;
        font-size: 16px;
        font-weight: 400;
        line-height: 150%;
    }


}
</style>
