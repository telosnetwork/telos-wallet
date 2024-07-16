<script lang="ts">
import {
    CURRENT_CONTEXT,
    getAntelope,
    useAccountStore,
    useChainStore,
    useFeedbackStore,
    usePlatformStore,
} from 'src/antelope';
import {
    ComponentInternalInstance,
    computed,
    defineComponent,
    getCurrentInstance,
    ref,
} from 'vue';
import { QSpinnerFacebook } from 'quasar';
import InlineSvg from 'vue-inline-svg';

export default defineComponent({
    name: 'LoginButtons',
    components: {
        QSpinnerFacebook,
        InlineSvg,
    },
    props: {
        chain: {
            type: String,
        },
    },
    setup(props, { emit }) {
        const ant = getAntelope();
        const accountStore = useAccountStore();
        const chainStore = useChainStore();

        const globalProps = (getCurrentInstance() as ComponentInternalInstance).appContext.config.globalProperties;
        const isMobile = ref(usePlatformStore().isMobile);
        const isBraveBrowser = ref((navigator as any).brave && (navigator as any).brave.isBrave());

        const showEVMButtons = computed(() =>
            props.chain === 'evm');
        const showZeroButtons = computed(() =>
            props.chain === 'zero' &&
            !requestAccountSelection.value &&
            selectedZeroAccount.value === '');

        // EVM Login -----------------------------------------------------------
        const supportsMetamask = computed(() => {
            const e = window.ethereum as unknown as { [key:string]: boolean };
            return e && e.isMetaMask && !supportsSafePal.value && !unsupportedExtensions.value;
        });

        const supportsSafePal = computed(() => {
            const e = window.ethereum as unknown as { [key:string]: boolean };
            return e && (isMobile.value ? e.isSafePal : e._isSafePal);
        });

        const supportsBrave = computed(() => {
            const e = window.ethereum as unknown as { [key:string]: boolean };
            return e && e.isBraveWallet;
        });

        const showMetamaskButton = computed(() => !isMobile.value || supportsMetamask.value);
        const showSafePalButton = computed(() => !isMobile.value || supportsSafePal.value);
        const injectedProviderDetected = computed(() => !!window.ethereum);
        const showWalletConnectButton = computed(() => !isMobile.value || !injectedProviderDetected.value || (isMobile.value && isBraveBrowser.value)); // temp solution until Brave support is added https://github.com/telosnetwork/telos-wallet/issues/501
        const showBraveButton = isBraveBrowser.value && !isMobile.value;

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

        const setMetamaskEVM = async () => {
            setEVMAuthenticator('Metamask', CURRENT_CONTEXT);
        };
        const setBraveEVM = async () => {
            setEVMAuthenticator('Brave', CURRENT_CONTEXT);
        };
        const setSafePalEVM = async () => {
            setEVMAuthenticator('SafePal', CURRENT_CONTEXT);
        };
        const setWalletConnectEVM = async () => {
            setEVMAuthenticator('WalletConnect', CURRENT_CONTEXT);
        };

        const setEVMAuthenticator = async(name: string, label: string) => {
            const auth = ant.wallets.getEVMAuthenticator(name);
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

        const notifyEnableBrave = () => {
            const message = globalProps.$t('home.enable_brave_notification_message');
            ant.config.notifyFailureMessage(message);
        };

        const isLoading = (loginName: string) => useFeedbackStore().isLoading(loginName);

        // Telos Zero Login ----------------------------------------------------
        const ualAuthenticators = computed(() => ant.wallets.getZeroAuthenticators());
        const loginTelosZero = (idx:number, justViewer:boolean = false) => {
            if (justViewer) {
                localStorage.setItem('justViewer', 'true');
            } else {
                localStorage.removeItem('justViewer');
            }
            const network = chainStore.currentChain.settings.getNetwork();
            const authenticator = ualAuthenticators.value[idx];
            accountStore.loginZero({ authenticator, network });
        };
        // Intermediate interactive steps to select or create name account for Telos Zero.
        const selectedZeroAccount = ref('');
        const availableZeroAccounts = ref([] as string[]);
        const setSelectedName = ref<(name: string) => void>((name: string) => {});
        const requestAccountSelection = computed(() =>
            // there are available accounts and no account is selected
            availableZeroAccounts.value.length > 0 &&
            selectedZeroAccount.value === '',
        );
        const setCleosViewerZero = () => {
            const idx = ant.config.authenticatorsGetter().map(a => a.getName()).indexOf('cleos');
            loginTelosZero(idx, true);
        };
        const redirectToNewAccountWebsite = () => {
            window.open('https://app.telos.net/accounts/add');
        };

        return {
            isLoading,
            supportsMetamask,
            supportsBrave,
            supportsSafePal,
            showMetamaskButton,
            showBraveButton,
            showSafePalButton,
            showWalletConnectButton,
            setMetamaskEVM,
            setBraveEVM,
            setSafePalEVM,
            setWalletConnectEVM,
            notifyNoProvider,
            notifyEnableBrave,
            redirectToMetamaskDownload,
            redirectToSafepalDownload,
            showEVMButtons,
            showZeroButtons,
            ualAuthenticators,
            loginTelosZero,
            setCleosViewerZero,
            redirectToNewAccountWebsite,
            availableZeroAccounts,
            selectedZeroAccount,
            setSelectedName,
            requestAccountSelection,
        };
    },
    unmounted() {
    },
});
</script>

<template>
<div class="c-login-buttons">

    <template v-if="showEVMButtons">
        <!-- Brave Authenticator button -->
        <div
            v-if="showBraveButton"
            class="c-login-buttons__option"
            @click="supportsBrave ? setBraveEVM() : notifyEnableBrave()"
        >
            <template v-if="isLoading('Brave.login')">
                <div class="c-login-buttons__loading"><QSpinnerFacebook /></div>
            </template>
            <template v-else>
                <InlineSvg
                    :src="require('src/assets/evm/brave_lion.svg')"
                    class="c-login-buttons__icon c-login-buttons__icon--brave"
                    height="24"
                    width="24"
                    aria-hidden="true"
                />
                {{ supportsBrave ? $t('home.brave') : $t('home.brave') }}
            </template>
        </div>

        <!-- Metamask Authenticator button -->
        <div
            v-if="showMetamaskButton"
            class="c-login-buttons__option"
            @click="supportsMetamask ?  setMetamaskEVM() : supportsSafePal ? notifyNoProvider('Metamask') : redirectToMetamaskDownload()"
        >
            <template v-if="isLoading('Metamask.login')">
                <div class="c-login-buttons__loading"><QSpinnerFacebook /></div>
            </template>
            <template v-else>
                <InlineSvg
                    :src="require('src/assets/evm/metamask_fox.svg')"
                    class="c-login-buttons__icon c-login-buttons__icon--metamask"
                    height="24"
                    width="24"
                    aria-hidden="true"
                />
                {{ supportsMetamask ? $t('home.metamask') : $t('home.install_metamask') }}
            </template>
        </div>

        <!-- WalletConnect Authenticator button -->
        <div
            v-if="showWalletConnectButton"
            class="c-login-buttons__option"
            @click="setWalletConnectEVM()"
        >
            <template v-if="isLoading('WalletConnect.login')">
                <div class="c-login-buttons__loading"><QSpinnerFacebook /></div>
            </template>
            <template v-else>
                <InlineSvg
                    :src="require('src/assets/evm/wallet_connect.svg')"
                    class="c-login-buttons__icon c-login-buttons__icon--wallet-connect"
                    height="24"
                    width="24"
                    aria-hidden="true"
                />
                {{ $t('home.walletconnect') }}
            </template>
        </div>

        <!-- Safepal Authenticator button -->
        <div
            v-if="showSafePalButton"
            class="c-login-buttons__option"
            @click="supportsSafePal ? setSafePalEVM() : redirectToSafepalDownload()"
        >
            <template v-if="isLoading('SafePal.login')">
                <div class="c-login-buttons__loading"><QSpinnerFacebook /></div>
            </template>
            <template v-else>
                <InlineSvg
                    :src="require('src/assets/evm/safepal.svg')"
                    class="c-login-buttons__icon c-login-buttons__icon--safepal"
                    height="24"
                    width="24"
                    aria-hidden="true"
                />
                {{ supportsSafePal ? $t('home.safepal') : $t('home.install_safepal') }}
            </template>
        </div>

    </template>

    <template v-if="showZeroButtons">
        <!-- Authenticator buttons -->
        <template
            v-for="(wallet, idx) in ualAuthenticators"
            :key="idx"
        >
            <div
                v-if="wallet.getName() !== 'metakeep.ual'"
                class="c-login-buttons__option"
                @click="loginTelosZero(idx)"
            >
                <template v-if="isLoading(wallet.getStyle().text)">
                    <div class="c-login-buttons__loading"><QSpinnerFacebook /></div>
                </template>
                <template v-else>
                    <img
                        :src="wallet.getStyle().icon"
                        width="24"
                        class="c-login-buttons__ual-logo"
                    >
                    {{ wallet.getStyle().text }}
                </template>
            </div>
        </template>

        <hr class="c-login-buttons__hr">

        <div
            class="c-login-buttons__option c-login-buttons__option--centered"
            tabindex="0"
            aria-role="button"
            @keyup.enter="setCleosViewerZero"
            @click="setCleosViewerZero"
        >
            {{ $t('home.view_any_account') }}
        </div>

        <div
            class="c-login-buttons__option c-login-buttons__option--centered"
            tabindex="0"
            aria-role="button"
            @keyup.enter="redirectToNewAccountWebsite"
            @click="redirectToNewAccountWebsite"
        >
            {{ $t('home.create_new_account') }}
        </div>
    </template>
</div>
</template>

<style lang="scss">
.c-login-buttons {
    $width: 255px;
    $gap: 15px;
    color: $white;
    $self: &;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: $gap;

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
        &--disabled {
            opacity: 0.5;
        }
    }

    &__cloud-btn-container {
        display: flex;
        width: 100%;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 8px;
    }

    &__cloud-btn-line-icons {
        display: flex;
        width: 100%;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        gap: 8px;
    }

    &__cloud-btn-line-title {
        display: flex;
        width: 100%;
        flex-direction: row;
        justify-content: flex-start;
        align-items: center;
        gap: $gap;
    }

    &__title {
        @include text--header-4;
        text-align: center;
    }

    &__zero-accounts-title {
        padding: 5px;
        @include text--small;
        text-align: center;
    }

    &__zero-account-loading {
        margin-right: 1px;
        margin-top: -3px;
    }

    &__zero-accounts {
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 8px;
    }

    &__option {
        display: flex;
        gap: $gap;

        width: $width;
        height: 54px;
        outline-color: $white;
        outline-width: 1px;
        outline-style: solid;
        border-radius: 4px;
        font-size: 16px;
        font-weight: 500;
        padding: 14px;
        cursor: pointer;

        &:hover:not(&--disabled) {
            outline-color: $white;
            outline-width: 2px;
        }

        &:not(:hover) #{$self}__icon {
            &--metamask, &--safepal, &--wallet-connect {
                opacity: 0.8;

                @include mobile-only {
                    opacity: 1;
                }
            }
        }

        &--telos-cloud {
            height: max-content;
            &:not(:hover) {
                outline-width: 0;
                @include gradient_border();
            }
            &--gradient:hover {
                outline-width: 0px !important;
                @include gradient_border();
            }
        }

        &--disabled {
            color: #9289b1;
            outline-color: #9289b1;
            cursor: not-allowed;
        }

        &--zero-account {
            height: 32px;
            width: calc(100% - 16px);
            display: flex;
            justify-content: center;
            align-items: center;
        }
    }

    &__hr {
        width: $width;
    }

    &__account-name-input-container {
        background-color: rgba(255, 255, 255, 1);
        padding: 10px;
        border-radius: 6px;
    }

    &__account-name-buttons {
        display: flex;
        flex-direction: row;
        justify-content: flex-end;
        align-items: center;
        gap: 8px;
    }

    &__account-name-button {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        padding: 8px;
        border-radius: 4px;
        border: 1px solid #ffffff;
        color: #ffffff;
        background-color: transparent;
        cursor: pointer;
    }
}
</style>
