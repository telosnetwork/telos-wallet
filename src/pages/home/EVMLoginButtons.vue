<script lang="ts">
import { usePlatformStore } from 'src/antelope';
import { useChainStore } from 'src/antelope/stores/chain';
import { defineComponent } from 'vue';

export default defineComponent({
    name: 'EVMLoginButtons',
    setup(props, { emit }) {
        const viewAnyAccount = () => {};

        const toggleWalletOptions = () => {
            usePlatformStore().isMobile ? emit('toggleWalletConnect') : emit('showWalletOptions');
        };

        return {
            viewAnyAccount,
            toggleWalletOptions,
        };
    },
});
</script>

<template>
<div class="c-evm-login-buttons">
    <q-btn class="c-evm-login-buttons__metamask-button purpleGradient" @click="toggleWalletOptions">
        {{ $t('home.connect_with_wallet') }}
    </q-btn>

    <!-- <q-btn
        text-color="white"
        outline
        :label="$t('home.view_any_account')"
        @click="viewAnyAccount"
    /> -->
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
