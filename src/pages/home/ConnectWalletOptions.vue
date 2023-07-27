

<script lang="ts">
import { ComponentInternalInstance, computed, defineComponent, getCurrentInstance, watch } from 'vue';
import { useAccountStore, useChainStore, getAntelope, useFeedbackStore } from 'src/antelope';
import { QSpinnerFacebook } from 'quasar';

export default defineComponent({
    name: 'ConnectWalletOptions',
    components: {
        QSpinnerFacebook,
    },
    props: {
        showWalletConnect: {
            required: true,
            type: Boolean,
        },
        useInjectedProvider: {
            required: true,
            type: String,
        },
    },
    setup(props, { emit }){
        const ant = getAntelope();
        const globalProps = (getCurrentInstance() as ComponentInternalInstance).appContext.config.globalProperties;

        const supportsMetamask = computed(() => {
            const e = window.ethereum as unknown as { [key:string]: boolean };
            return e && e.isMetaMask && !supportsSafePal.value && !unsupportedExtensions.value; //
        });

        const supportsSafePal = computed(() => {
            const e = window.ethereum as unknown as { [key:string]: boolean };
            return e && e.isSafePal;
        });

        const unsupportedExtensions = computed(() => {
            const e = window.ethereum as unknown as { [key:string]: boolean };
            return e && (e.isBraveWallet || e.isCoinbaseWallet); // replace this with a regex to check for unknown/unsupported extensions see https://github.com/telosnetwork/telos-wallet/issues/500
        });

        const redirectToMetamaskDownload = () => {
            window.open('https://metamask.io/download/', '_blank');
        };

        const redirectToSafepalDownload = () => {
            window.open('https://www.safepal.com/en/download', '_blank');
        };

        watch(() => props.showWalletConnect, async (newVal) => {
            if (newVal) {
                await setWalletConnectAuthenticator();
            }
        });

        watch(() => props.useInjectedProvider, async (providerName) => {
            if (providerName) {
                setAuthenticator(providerName, 'logged');
            }
        });

        const setMetamaskAuthenticator = async () => {
            setAuthenticator('Metamask', 'logged');
        };
        const setSafepalAuthenticator = async () => {
            setAuthenticator('SafePal', 'logged');
        };
        const setWalletConnectAuthenticator = async () => {
            setAuthenticator('WalletConnect', 'logged');
        };

        const setAuthenticator = async(name: string, label: string) => {
            const auth = ant.wallets.getAutenticator(name);
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

        const redirectToInstall = (name:string) => {
            if (name === 'Metamask') {
                redirectToMetamaskDownload();
            } else if (name === 'SafePal') {
                redirectToSafepalDownload();
            }
        };

        const isLoading = (loginName: string) => useFeedbackStore().isLoading(loginName);

        return {
            isLoading,
            supportsMetamask,
            supportsSafePal,
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
<div class="wallet-options-container">
    <q-btn
        class="wallet-options__close"
        icon="close"
        flat
        round
        dense
        @click="$emit('closeWalletOptions')"
    />
    <div class="wallet-options">
        <div class="wallet-options__header">
            {{ $t('home.connect_your_wallet') }}
        </div>

        <!-- Metamask Authenticator button -->
        <div class="wallet-options__option" @click="supportsMetamask ?  setMetamaskAuthenticator() : supportsSafePal ? notifyNoProvider('Metamask') : redirectToMetamaskDownload()">
            <template v-if="isLoading('Metamask.login')">
                <div class="wallet-options__loading"><QSpinnerFacebook /></div>
            </template>
            <template v-else>
                <img
                    width="24"
                    class="flex q-ml-auto q-mt-auto wallet-logo"
                    alt="Metamask"
                    src="~assets/evm/metamask_fox.svg"
                >
                {{ supportsMetamask ? $t('home.metamask') : $t('home.install_metamask') }}
            </template>
        </div>

        <!-- Safepal Authenticator button -->
        <div class="wallet-options__option" @click="supportsSafePal ? setSafepalAuthenticator() : redirectToSafepalDownload()">
            <template v-if="isLoading('SafePal.login')">
                <div class="wallet-options__loading"><QSpinnerFacebook /></div>
            </template>
            <template v-else>
                <img
                    width="24"
                    class="flex q-ml-auto q-mt-auto wallet-logo"
                    alt="SafePal"
                    src="~assets/evm/safepal.svg"
                >
                {{ supportsSafePal ? $t('home.safepal') : $t('home.install_safepal') }}
            </template>
        </div>

        <!-- WalletConnect Authenticator button -->
        <div class="wallet-options__option" @click="setWalletConnectAuthenticator()">
            <template v-if="isLoading('WalletConnect.login')">
                <div class="wallet-options__loading"><QSpinnerFacebook /></div>
            </template>
            <template v-else>
                <img
                    width="24"
                    class="flex q-ml-auto q-mt-auto wallet-logo"
                    alt="WalletConnect"
                    src="~assets/evm/wallet_connect.svg"
                >
                {{ $t('home.walletconnect') }}
            </template>
        </div>
    </div>

</div>

</template>

<style lang="scss">
.wallet-options-container{
    background: $dark;
    width: 300px;
    height: 300px;
    margin:auto;
    color: $white;
}

.wallet-options{
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding-left: 42px;

    &__loading{
        width: 100%;
        text-align: center;
    }

    &__close{
        margin-left: 265px;
    }

    &__header{
        display: inline-block;
        font-size: 16px;
        margin-bottom: 16px;
    }

    &__option{
        width: 224px;
        height: 54px;
        border: solid $white;
        border-width: 1px;
        border-radius: 4px;
        margin-top: 12px;
        font-size: 16px;
        font-weight: 600;
        padding-top: 14px;
        padding-left: 14px;
        padding-right: 14px;
        cursor: pointer;

        img {
            display: inline-block;
            vertical-align:top;
            margin-right: 8px;
        }
    }
}

</style>
