

<script lang="ts">
import { useEVMStore, useAccountStore, useChainStore, getAntelope, useFeedbackStore } from 'src/antelope';
import { ComponentInternalInstance, computed, defineComponent, getCurrentInstance, watch } from 'vue';
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
    },
    setup(props, { emit }){
        const globalProps = (getCurrentInstance() as ComponentInternalInstance).appContext.config.globalProperties;
        const supportsMetamask = computed(() => useEVMStore().isMetamaskSupported);

        const redirectToMetamaskDownload = () => {
            window.open('https://metamask.io/download/', '_blank');
        };

        watch(() => props.showWalletConnect, async (newVal) => {
            if (newVal) {
                await setWalletConnectAuthenticator();
            }
        });
        // new refactor --------------
        const setMetamaskAuthenticator = async () => {
            setAuthenticator('Metamask', 'logged');
        };
        const setWalletConnectAuthenticator = async () => {
            setAuthenticator('WalletConnect', 'logged');
        };

        const setAuthenticator = async(name: string, label: string) => {
            const auth = getAntelope().wallets.getAutenticator(name);
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
        // --------------

        const isLoading = (loginName: string) => useFeedbackStore().isLoading(loginName);

        return {
            isLoading,
            supportsMetamask,
            redirectToMetamaskDownload,
            setMetamaskAuthenticator,
            setWalletConnectAuthenticator,
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
        <div class="wallet-options__option" @click="supportsMetamask ? setMetamaskAuthenticator() : redirectToMetamaskDownload()">
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
    height: 250px;
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
