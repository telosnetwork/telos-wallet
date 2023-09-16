<script lang="ts">
import { CURRENT_CONTEXT, getAntelope, useAccountStore, useChainStore, useEVMStore, useFeedbackStore, usePlatformStore } from 'src/antelope';
import { ComponentInternalInstance, computed, defineComponent, getCurrentInstance, ref, watch } from 'vue';
import { QSpinnerFacebook } from 'quasar';
import { OreIdAuth } from 'src/antelope/wallets';
import InlineSvg from 'vue-inline-svg';

export default defineComponent({
    name: 'EVMLoginButtons',
    components: {
        QSpinnerFacebook,
        InlineSvg,
    },
    setup(props, { emit }) {
        const ant = getAntelope();
        const globalProps = (getCurrentInstance() as ComponentInternalInstance).appContext.config.globalProperties;
        const isMobile = ref(usePlatformStore().isMobile);
        const isBraveBrowser = ref((navigator as any).brave && (navigator as any).brave.isBrave());

        const supportsMetamask = computed(() => {
            const e = window.ethereum as unknown as { [key:string]: boolean };
            return e && e.isMetaMask && !supportsSafePal.value && !unsupportedExtensions.value; //
        });

        const supportsSafePal = computed(() => {
            const e = window.ethereum as unknown as { [key:string]: boolean };
            return e && (isMobile.value ? e.isSafePal : e._isSafePal);
        });

        const showMetamaskButton = computed(() => !isMobile.value || supportsMetamask.value);
        const showSafePalButton = computed(() => !isMobile.value || supportsSafePal.value);
        const injectedProviderDetected = computed(() => !!window.ethereum);
        const showWalletConnectButton = computed(() => !isMobile.value || !injectedProviderDetected.value || (isMobile.value && isBraveBrowser.value)); // temp solution until Brave support is added https://github.com/telosnetwork/telos-wallet/issues/501

        const unsupportedExtensions = computed(() => {
            const e = window.ethereum as unknown as { [key:string]: boolean };
            return e && (e.isBraveWallet || e.isCoinbaseWallet); // replace this with a regex to check for unknown/unsupported extensions see https://github.com/telosnetwork/telos-wallet/issues/500
        });

        const selectedOAuthProvider = ref('');

        const redirectToMetamaskDownload = () => {
            window.open('https://metamask.io/download/', '_blank');
        };

        const redirectToSafepalDownload = () => {
            window.open('https://www.safepal.com/en/download', '_blank');
        };

        const setOreIdAuthenticator = async (provider: string) => {
            const name = 'OreId';
            const auth = ant.wallets.getAuthenticator(name);
            if (auth) {
                (auth as OreIdAuth).setProvider(provider);
                selectedOAuthProvider.value = provider;
            }
            setAuthenticator(name, CURRENT_CONTEXT);
        };
        const setMetamaskAuthenticator = async () => {
            setAuthenticator('Metamask', CURRENT_CONTEXT);
        };
        const setSafepalAuthenticator = async () => {
            setAuthenticator('SafePal', CURRENT_CONTEXT);
        };
        const setWalletConnectAuthenticator = async () => {
            setAuthenticator('WalletConnect', CURRENT_CONTEXT);
        };

        const setAuthenticator = async(name: string, label: string) => {
            const auth = ant.wallets.getAuthenticator(name);
            if (!auth) {
                console.error(`${name} authenticator not found`);
                return;
            }
            const authenticator = auth.newInstance(label);
            const accountStore = useAccountStore();
            const chainStore = useChainStore();
            const network = chainStore.currentChain.settings.getNetwork();
            const correctChainId = useChainStore().currentChain.settings.getChainId();
            accountStore.loginEVM({ authenticator, network }).then(async () => {
                // we verify that the authenticator is connected to the correct network
                if (!await authenticator.isConnectedTo(correctChainId)) {
                    const networkName = useChainStore().getChain(label).settings.getDisplay();
                    const warningMessage = globalProps.$t('evm_wallet.incorrect_network', { networkName });
                    globalProps.$warningNotification(warningMessage);
                }
            });
        };

        const notifyNoProvider = (provider:string) => {
            const message = globalProps.$t('home.multiple_providers_notification_message');
            ant.config.notifyFailureMessage(message);
        };

        const isLoading = (loginName: string) => useFeedbackStore().isLoading(loginName);
        const isLoadingOreId = (provider: string) =>
            selectedOAuthProvider.value === provider &&
            useFeedbackStore().isLoading('OreId.login');

        return {
            isLoading,
            isLoadingOreId,
            supportsMetamask,
            supportsSafePal,
            showMetamaskButton,
            showSafePalButton,
            showWalletConnectButton,
            setOreIdAuthenticator,
            setMetamaskAuthenticator,
            setSafepalAuthenticator,
            setWalletConnectAuthenticator,
            notifyNoProvider,
            redirectToMetamaskDownload,
            redirectToSafepalDownload,
        };
    },
});
</script>

<template>
<div class="c-evm-login-buttons">

    <!-- Google OAuth Provider -->
    <div class="c-evm-login-buttons__option" @click="setOreIdAuthenticator('google')">
        <template v-if="isLoadingOreId('google')">
            <div class="c-evm-login-buttons__loading"><QSpinnerFacebook /></div>
        </template>
        <template v-else>
            <img
                width="24"
                class="c-evm-login-buttons__icon c-evm-login-buttons__icon--oreid"
                src="~assets/logo--tlos.svg"
            >
            {{ $t('home.login_with_social_media') }}
        </template>
    </div>

    <!-- Metamask Authenticator button -->
    <div
        v-if="showMetamaskButton"
        class="c-evm-login-buttons__option"
        @click="supportsMetamask ?  setMetamaskAuthenticator() : supportsSafePal ? notifyNoProvider('Metamask') : redirectToMetamaskDownload()"
    >
        <template v-if="isLoading('Metamask.login')">
            <div class="c-evm-login-buttons__loading"><QSpinnerFacebook /></div>
        </template>
        <template v-else>
            <InlineSvg
                :src="require('src/assets/evm/metamask_fox.svg')"
                class="c-evm-login-buttons__icon c-evm-login-buttons__icon--metamask"
                height="24"
                width="24"
                aria-hidden="true"
            />
            {{ supportsMetamask ? $t('home.metamask') : $t('home.install_metamask') }}
        </template>
    </div>

    <!-- Safepal Authenticator button -->
    <div
        v-if="showSafePalButton"
        class="c-evm-login-buttons__option"
        @click="supportsSafePal ? setSafepalAuthenticator() : redirectToSafepalDownload()"
    >
        <template v-if="isLoading('SafePal.login')">
            <div class="c-evm-login-buttons__loading"><QSpinnerFacebook /></div>
        </template>
        <template v-else>
            <InlineSvg
                :src="require('src/assets/evm/safepal.svg')"
                class="c-evm-login-buttons__icon c-evm-login-buttons__icon--safepal"
                height="24"
                width="24"
                aria-hidden="true"
            />
            {{ supportsSafePal ? $t('home.safepal') : $t('home.install_safepal') }}
        </template>
    </div>

    <!-- WalletConnect Authenticator button -->
    <div
        v-if="showWalletConnectButton"
        class="c-evm-login-buttons__option"
        @click="setWalletConnectAuthenticator()"
    >
        <template v-if="isLoading('WalletConnect.login')">
            <div class="c-evm-login-buttons__loading"><QSpinnerFacebook /></div>
        </template>
        <template v-else>
            <InlineSvg
                :src="require('src/assets/evm/wallet_connect.svg')"
                class="c-evm-login-buttons__icon c-evm-login-buttons__icon--wallet-connect"
                height="24"
                width="24"
                aria-hidden="true"
            />
            {{ $t('home.walletconnect') }}
        </template>
    </div>

</div>
</template>

<style lang="scss">
.c-evm-login-buttons {
    $self: &;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 14px;

    &__loading{
        width: 100%;
        text-align: center;
    }

    &__header{
        display: inline-block;
        font-size: 16px;
        margin-bottom: 16px;
    }

    &__icon {
        margin-top: -1px;
        transition: all 0.3s;
    }

    &__option {
        display: flex;
        gap: 8px;

        width: 224px;
        height: 54px;
        color: $white;
        outline-color: $white;
        outline-width: 1px;
        outline-style: solid;
        border-radius: 4px;
        font-size: 16px;
        font-weight: 500;
        padding: 14px;
        cursor: pointer;

        &:hover {
            color: $white;
            outline-color: $white;
            outline-width: 2px;
        }

        &:not(:hover) #{$self}__icon {
            &--oreid, &--metamask, &--safepal, &--wallet-connect {
                opacity: 0.8;

                @include mobile-only {
                    opacity: 1;
                }
            }
        }
    }
}
</style>
