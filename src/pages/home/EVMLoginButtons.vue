<script lang="ts">
import { useEVMStore, useFeedbackStore, usePlatformStore } from 'src/antelope';
import { computed, defineComponent, ref } from 'vue';
import { QSpinnerFacebook } from 'quasar';

export default defineComponent({
    name: 'EVMLoginButtons',
    components: {
        QSpinnerFacebook,
    },
    setup(props, { emit }) {
        const viewAnyAccount = () => {};
        const injected = ref(useEVMStore().injectedProviderNames.length);
        const isMobile = ref(usePlatformStore().isMobile);

        const toggleWalletOptions = () => {
            if (isMobile.value) {
                if (injected.value === 1) {
                    console.assert(useEVMStore().injectedProviderNames.length === 1, 'only one injected provider is supported for mobile');
                    emit('useInjectedProvider');
                } else {
                    emit('showWalletConnect');
                }
            } else {
                emit('showWalletOptions');
            }
        };

        // loading state for generic connect button is only required for mobile (WalletConnect)
        const loading = computed(() => useFeedbackStore().isLoading('WalletConnect.login'));

        return {
            loading,
            viewAnyAccount,
            toggleWalletOptions,
        };
    },
});
</script>

<template>
<div class="c-evm-login-buttons">
    <q-btn :loading="loading" class="c-evm-login-buttons__metamask-button purpleGradient" @click="toggleWalletOptions">
        {{ $t('home.connect_with_wallet') }}
        <template v-slot:loading>
            <QSpinnerFacebook />
        </template>
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
