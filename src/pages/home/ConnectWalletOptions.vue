

<script lang="ts">
import { computed, defineComponent, ref } from 'vue';
import { useAccountStore } from 'src/antelope/stores/account';
import { useChainStore } from 'src/antelope/stores/chain';

export default defineComponent({
    name: 'ConnectWalletOptions',
    setup(){
        const connectToMetaMask = () => {
            const accountStore = useAccountStore();
            const chainStore = useChainStore();
            const network = chainStore.currentChain.settings.getNetwork();
            accountStore.loginEVM({ network });
        };

        return {
            connectToMetaMask,
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
        <div class="wallet-options__option">
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
}

.wallet-options__close{
    margin-left: 265px;
}

.wallet-options__header{
    display: inline-block;
    font-size: 16px;
    margin-bottom: 16px;
}

.wallet-options__option{
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
</style>
