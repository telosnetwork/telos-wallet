

<script lang="ts">
import { computed, defineComponent, ref, watch } from 'vue';
import { useAccountStore } from 'src/antelope/stores/account';
import { useChainStore } from 'src/antelope/stores/chain';
import { Web3Modal } from '@web3modal/html';
import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum';
import { telos, telosTestnet } from '@wagmi/core/chains';
import { configureChains, createClient, getAccount } from '@wagmi/core';
import { useEVMStore, usePlatformStore } from 'src/antelope';

export default defineComponent({
    name: 'ConnectWalletOptions',
    props: {
        toggleWalletConnect: {
            required: true,
            type: Boolean,
        },
    },
    setup(props, { emit }){
        const web3Modal = ref<Web3Modal>();
        const supportsMetamask = computed(() => useEVMStore().isMetamaskSupported);

        watch(() => props.toggleWalletConnect, (newVal) => {
            if (newVal) {
                connectToWalletConnect();
            };
        });

        const connectToMetaMask = () => {
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

        const setWalletConnectAccount = async () => {
            const { address } = getAccount(); // wagmi
            if (address){
                const accountStore = useAccountStore();
                const chainStore = useChainStore();
                const network = chainStore.currentChain.settings.getNetwork();
                accountStore.loginEVM({ network });

            }
        };

        const redirectToMetamaskDownload = () => {
            window.open('https://metamask.io/download/', '_blank');
        };

        return {
            web3Modal,
            supportsMetamask,
            connectToMetaMask,
            connectToWalletConnect,
            setWalletConnectAccount,
            redirectToMetamaskDownload,
        };
    },
    mounted() {
        // create wagmi client and web3modal instance
        const projectId = process.env.PROJECT_ID || '';
        const chains = [telos, telosTestnet];

        const { provider } = configureChains(chains, [w3mProvider({ projectId })]);

        const wagmi = createClient({
            autoConnect: true,
            connectors: w3mConnectors({ projectId, version: 1, chains }),
            provider,
        });

        const explorerDenyList = [
            // MetaMask
            'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
        ];

        const options = usePlatformStore().isMobile ? { projectId } : { projectId, explorerDenyList };
        const wagmiClient = new EthereumClient(wagmi, chains);
        this.web3Modal = new Web3Modal(options, wagmiClient);

        this.web3Modal.subscribeModal(async (newState) => {
            if (newState.open === false) {
                this.$emit('toggleWalletConnect');
                //disable injected login for mobile
                if (!usePlatformStore().isMobile){
                    await this.setWalletConnectAccount();
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
            Connect your wallet
        </div>
        <div class="wallet-options__option" @click="supportsMetamask ? connectToMetaMask() : redirectToMetamaskDownload()">
            <img
                width="24"
                class="flex q-ml-auto q-mt-auto wallet-logo"
                alt="MetaMask"
                src="~assets/evm/metamask_fox.svg"
            >
            {{ supportsMetamask ? 'MetaMask' : 'Install MetaMask' }}
        </div>
        <div class="wallet-options__option" @click="connectToWalletConnect">
            <img
                width="24"
                class="flex q-ml-auto q-mt-auto wallet-logo"
                alt="WalletConnect"
                src="~assets/evm/wallet_connect.svg"
            >
            WalletConnect
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
