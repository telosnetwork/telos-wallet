

<script lang="ts">
import { ComponentInternalInstance, computed, defineComponent, getCurrentInstance, watch } from 'vue';
import { useAccountStore, useChainStore, getAntelope, useFeedbackStore } from 'src/antelope';
import { QSpinnerFacebook } from 'quasar';

import { AuthProvider, ChainNetwork, OreId, OreIdOptions, JSONObject } from 'oreid-js';
import { WebPopup } from 'oreid-webpopup';
import { erc20Abi } from 'src/antelope/types';

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
        const ant = getAntelope();
        const globalProps = (getCurrentInstance() as ComponentInternalInstance).appContext.config.globalProperties;

        const supportsMetamask = computed(() => {
            const e = window.ethereum as unknown as { [key:string]: boolean };
            return e && e.isMetaMask && !e.isSafePal;
        });

        const supportsSafePal = computed(() => {
            const e = window.ethereum as unknown as { [key:string]: boolean };
            return e && e.isSafePal;
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
        // new refactor --------------
        const setOreIdkAuthenticator = async () => {
            // ---------------------------------------------------------------------------------
            // ---------------------------------------------------------------------------------
            const ABI = erc20Abi;
            const REACT_APP_OREID_APP_ID = 't_23991cde82994c88bb582c019a9c45e1';
            // const REACT_APP_OREID_APP_ID = 't_75a4d9233ec441d18c4221e92b379197';
            const oreIdOptions: OreIdOptions = {
                appName: 'Telos Wallet App',
                appId: REACT_APP_OREID_APP_ID,
                plugins: { popup: WebPopup() },
            };

            const oreId = new OreId(oreIdOptions);
            await oreId.init();

            // launch the login flow
            await oreId.popup.auth({ provider: 'google' as AuthProvider });
            const userData = await oreId.auth.user.getData();
            console.log('-----------------------------------------');
            console.log(`Hello ${userData.name}`);
            console.log(`Your blockchain accounts are: ${userData.chainAccounts}`);
            console.log(userData);

            const chain = userData.chainAccounts.find((account: any) => account.chainNetwork !== ChainNetwork.OreTest);

            if (chain) {

                const contractAddress = '0xa9991E4daA44922D00a78B6D986cDf628d46C4DD';
                const targetAddress = '0xa30b5e3c8Fee56C135Aecb733cd708cC31A5657a';

                const systemTransfer = {
                    'from':chain.chainAccount,
                    'to': targetAddress,
                    'value':'0x01',
                };

                const erc20Transfer = {
                    'from':chain.chainAccount,
                    'to':contractAddress,
                    'contract': {
                        'abi': ABI,
                        'parameters': [targetAddress, '0x02'],
                        'method': 'transfer',
                    },
                } as unknown as JSONObject;

                // sign a blockchain transaction
                console.log('createTransaction()...');
                const transaction = await oreId.createTransaction({
                    transaction: erc20Transfer,
                    chainAccount: chain.chainAccount,
                    chainNetwork: ChainNetwork.TelosEvmTest,
                    signOptions: {
                        broadcast: true,
                        returnSignedTransaction: true,
                    },
                });

                // have the user approve signature
                console.log('Signing a transaction...', transaction);
                const { transactionId } = await oreId.popup.sign({ transaction });
                console.log('transactionId: ', transactionId);

            }


            // ---------------------------------------------------------------------------------
            // ---------------------------------------------------------------------------------
        };
        const setMetamaskAuthenticator = async () => {
            setAuthenticator('Metamask', 'logged');
        };
        // const setSafepalAuthenticator = async () => {
        //     setAuthenticator('SafePal', 'logged');
        // };
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
            const message = globalProps.$t('home.no_provider_notification_message');
            ant.config.notifyFailureWithAction(message, {
                label: ant.config.localizationHandler('home.no_provider_action_label', { provider }),
                handler: () => {
                    redirectToInstall(provider);
                },
            });
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
            setOreIdkAuthenticator,
            setMetamaskAuthenticator,
            // setSafepalAuthenticator,
            setWalletConnectAuthenticator,
            notifyNoProvider,
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


        <!-- ORE-ID Authenticator button -->
        <div class="wallet-options__option" @click="setOreIdkAuthenticator()">
            <template v-if="isLoading('OreId.login')">
                <div class="wallet-options__loading"><QSpinnerFacebook /></div>
            </template>
            <template v-else>
                <img
                    width="24"
                    class="flex q-ml-auto q-mt-auto wallet-logo"
                    alt="Metamask"
                    src="~assets/evm/ore-id.svg"
                >
                ORE-ID
            </template>
        </div>

        <!-- Metamask Authenticator button -->
        <div class="wallet-options__option" @click="supportsMetamask ? setMetamaskAuthenticator() : notifyNoProvider('Metamask')">
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
        <!--div class="wallet-options__option" @click="supportsSafePal ? setSafepalAuthenticator() : notifyNoProvider('SafePal')">
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
        </div-->

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
    height: 370px;
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
