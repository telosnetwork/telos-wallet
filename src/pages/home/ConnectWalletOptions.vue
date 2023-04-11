

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';
import { useAccountStore } from 'src/antelope/stores/account';
import { useChainStore } from 'src/antelope/stores/chain';
import { Web3Modal } from '@web3modal/html';
import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum';
import { telos, telosTestnet } from '@wagmi/core/chains';
import { configureChains, createClient, getAccount,  prepareSendTransaction, sendTransaction } from '@wagmi/core';

export default defineComponent({
    name: 'ConnectWalletOptions',
    props: {
        toggleWalletConnect: {
            required: true,
            type: Boolean,
        },
    },
    setup(props){
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
            const projectId = process.env.PROJECT_ID || '';
            const chains = [telos, telosTestnet];
            const { provider } = configureChains(chains, [w3mProvider({ projectId })]);

            const wagmi = createClient({
                autoConnect: true,
                connectors: w3mConnectors({ projectId, version: 1, chains }),
                provider,
            });

            const wagmiClient = new EthereumClient(wagmi, chains);
            const web3modal = new Web3Modal({ projectId }, wagmiClient);

            await web3modal.openModal();

            web3modal.subscribeModal(async (newState) => {
                if (newState.open === false) {
                    await setWalletConnectAccount();
                }
            });
        };
        const setWalletConnectAccount = async () => {
            const { address } = getAccount(); // wagmi
            if (address){
                // temp login handling
                const accountStore = useAccountStore();
                const chainStore = useChainStore();
                const network = chainStore.currentChain.settings.getNetwork();
                accountStore.loginEVM({ network });

            }
        };

        return {
            connectToMetaMask,
            connectToWalletConnect,
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
            Connect your wallet
        </div>
        <div class="wallet-options__option" @click="connectToMetaMask">
            <img
                width="24"
                class="flex q-ml-auto q-mt-auto wallet-logo"
                alt="MetaMask"
                src="~assets/evm/metamask_fox.svg"
            >
            MetaMask
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
