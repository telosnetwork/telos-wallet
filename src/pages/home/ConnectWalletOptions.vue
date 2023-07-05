

<script lang="ts">
import { ComponentInternalInstance, computed, defineComponent, getCurrentInstance, inject, ref } from 'vue';
import { Web3Modal } from '@web3modal/html';
import { EthereumClient } from '@web3modal/ethereum';
import { useEVMStore, useAccountStore, useChainStore, getAntelope } from 'src/antelope';

export default defineComponent({
    name: 'ConnectWalletOptions',
    props: {
        toggleWalletConnect: {
            required: true,
            type: Boolean,
        },
    },
    setup(props, { emit }){
        const globalProps = (getCurrentInstance() as ComponentInternalInstance).appContext.config.globalProperties;
        const wagmiClient = inject('$wagmi') as EthereumClient;
        // console.log('ConnectWalletOptions -> wagmiClient:', wagmiClient);
        const web3Modal = ref<Web3Modal>();
        const supportsMetamask = computed(() => useEVMStore().isMetamaskSupported);

        const redirectToMetamaskDownload = () => {
            window.open('https://metamask.io/download/', '_blank');
        };

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
                    const warningMessage = globalProps.$t('evm_wallet.incorrect_network', { networkName });;
                    globalProps.$warningNotification(warningMessage);
                }
            });
        };
        // --------------

        return {
            web3Modal,
            supportsMetamask,
            redirectToMetamaskDownload,
            wagmiClient,
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
        <!--div class="wallet-options__option" @click="supportsMetamask ? loginEvm() : redirectToMetamaskDownload()"-->
        <div class="wallet-options__option" @click="supportsMetamask ? setMetamaskAuthenticator() : redirectToMetamaskDownload()">
            <img
                width="24"
                class="flex q-ml-auto q-mt-auto wallet-logo"
                alt="MetaMask"
                src="~assets/evm/metamask_fox.svg"
            >
            {{ supportsMetamask ? $t('home.metamask') : $t('home.install_metamask') }}
        </div>
        <div class="wallet-options__option" @click="setWalletConnectAuthenticator()">
            <img
                width="24"
                class="flex q-ml-auto q-mt-auto wallet-logo"
                alt="WalletConnect"
                src="~assets/evm/wallet_connect.svg"
            >
            {{ $t('home.walletconnect') }}
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
        cursor: pointer;

        img {
            display: inline-block;
            vertical-align:top;
            margin-right: 8px;
        }
    }
}

</style>
