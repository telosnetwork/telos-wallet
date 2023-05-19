

<script lang="ts">
import { computed, defineComponent, inject, ref, watch } from 'vue';
import { Web3Modal } from '@web3modal/html';
import { EthereumClient } from '@web3modal/ethereum';
import { useEVMStore, usePlatformStore, useAccountStore, useChainStore } from 'src/antelope';
import { getNetwork } from '@wagmi/core';

export default defineComponent({
    name: 'ConnectWalletOptions',
    props: {
        toggleWalletConnect: {
            required: true,
            type: Boolean,
        },
    },
    setup(props){
        const wagmiClient = inject('$wagmi') as EthereumClient;
        const web3Modal = ref<Web3Modal>();
        const supportsMetamask = computed(() => useEVMStore().isMetamaskSupported);

        watch(() => props.toggleWalletConnect, (newVal) => {
            if (newVal) {
                connectToWalletConnect();
            };
        });

        const loginEvm = () => {
            const accountStore = useAccountStore();
            const chainStore = useChainStore();
            const network = chainStore.currentChain.settings.getNetwork();
            accountStore.loginEVM({ network });
        };

        const connectToWalletConnect = async () => {
            if(web3Modal.value) {
                await web3Modal.value.openModal();
            }
        };

        const redirectToMetamaskDownload = () => {
            window.open('https://metamask.io/download/', '_blank');
        };

        return {
            web3Modal,
            supportsMetamask,
            loginEvm,
            connectToWalletConnect,
            redirectToMetamaskDownload,
            wagmiClient,
        };
    },
    mounted() {
        const projectId = process.env.PROJECT_ID || '';
        const explorerAllowList = [
            // MetaMask
            'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
        ];

        const options = usePlatformStore().isMobile ? { projectId } : { projectId, explorerAllowList };

        this.web3Modal = new Web3Modal(options, this.wagmiClient);

        this.web3Modal.subscribeModal(async (newState) => {
            if (newState.open === false) {
                this.$emit('toggleWalletConnect');
                if (localStorage.getItem('wagmi.connected')){
                    this.loginEvm();

                    const chainSettings = useChainStore().currentChain.settings;
                    const appChainId = chainSettings.getChainId();
                    const networkName = chainSettings.getDisplay();
                    const walletConnectChainId = getNetwork().chain?.id.toString();

                    if (appChainId !== walletConnectChainId){
                        const warningMessage = this.$t('evm_wallet.incorrect_network', { networkName });;
                        (this as any).$warningNotification(warningMessage);
                    }
                }
            }
        });
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
        <div class="wallet-options__option" @click="supportsMetamask ? loginEvm() : redirectToMetamaskDownload()">
            <img
                width="24"
                class="flex q-ml-auto q-mt-auto wallet-logo"
                alt="MetaMask"
                src="~assets/evm/metamask_fox.svg"
            >
            {{ supportsMetamask ? $t('home.metamask') : $t('home.install_metamask') }}
        </div>
        <div class="wallet-options__option" @click="connectToWalletConnect">
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
