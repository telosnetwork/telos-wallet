<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    name: 'EVMLoginButtons',
});
</script>

<template>
<div class="c-evm-login-buttons">
    <q-btn class="c-evm-login-buttons__metamask-button purpleGradient">
        <img
            src="~assets/logo--metamask.svg"
            class="q-mr-md"
            height="24"
            width="24"
            :alt="$t('home.metamask_logo_alt')"
        >
        {{ $t('home.connect_with_metamask') }}
    </q-btn>

    <q-btn
        text-color="white"
        outline
        :label="$t('home.view_any_account')"
    />
</div>
</template>

<style lang="scss">
.c-evm-login-buttons {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 24px;

    &__metamask-button {
        padding: 0 16px;
        height: 42px;
    }
}
</style>
