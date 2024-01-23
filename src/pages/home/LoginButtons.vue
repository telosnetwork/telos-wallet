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
    watch,
} from 'vue';
import { QSpinnerFacebook } from 'quasar';
import { MetaKeepAuth } from 'src/antelope/wallets';
import InlineSvg from 'vue-inline-svg';
import { GoogleCredentials, googleCtrl } from 'src/pages/home/GoogleOneTap';
import { MetakeepAuthenticator } from 'src/antelope/wallets/ual/MetakeepUAL';
import BaseTextInput from 'components/evm/inputs/BaseTextInput.vue';
import NativeChainSettings from 'src/antelope/chains/NativeChainSettings';

export default defineComponent({
    name: 'LoginButtons',
    components: {
        QSpinnerFacebook,
        InlineSvg,
        BaseTextInput,
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

        const showEVMButtons = computed(() => props.chain === 'evm');
        const showZeroButtons = computed(() => props.chain === 'zero');

        // EVM Login -----------------------------------------------------------
        const supportsMetamask = computed(() => {
            const e = window.ethereum as unknown as { [key:string]: boolean };
            return e && e.isMetaMask && !supportsSafePal.value && !unsupportedExtensions.value; //
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

        const selectedOAuthProvider = ref('');

        const redirectToMetamaskDownload = () => {
            window.open('https://metamask.io/download/', '_blank');
        };

        const redirectToSafepalDownload = () => {
            window.open('https://www.safepal.com/en/download', '_blank');
        };

        const setMetamaskEVM = async () => {
            setEVMAuthenticator('Metamask', CURRENT_CONTEXT);
        };
        const setMetaKeepEVM = async (data:GoogleCredentials) => {
            const name = 'MetaKeep';
            const auth = ant.wallets.getAuthenticator(name);
            if (auth) {
                (auth as MetaKeepAuth).setEmail(data.email);
            }
            setEVMAuthenticator(name, CURRENT_CONTEXT);
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

        const notifyEnableBrave = () => {
            const message = globalProps.$t('home.enable_brave_notification_message');
            ant.config.notifyFailureMessage(message);
        };

        const isLoading = (loginName: string) => useFeedbackStore().isLoading(loginName);

        // Telos Zero Login ----------------------------------------------------
        const ualAuthenticators = ant.config.authenticatorsGetter();
        const loginTelosZero = (idx:number, justViewer:Boolean = false) => {
            if (justViewer) {
                localStorage.setItem('justViewer', 'true');
            } else {
                localStorage.removeItem('justViewer');
            }
            const network = chainStore.currentChain.settings.getNetwork();
            const authenticator = ualAuthenticators[idx];
            accountStore.loginZero({ authenticator, network });
        };
        const getZeroAuthenticator = (name: string) => {
            const idx = ualAuthenticators.map(a => a.getName()).indexOf(name);
            return ualAuthenticators[idx];
        };
        // Intermediate interactive steps to select or create name account for Telos Zero.
        const selectedZeroAccount = ref('');
        const availableZeroAccounts = ref([] as string[]);
        // This promise is used to block the flow until the user selects an account
        let whenAccountSelected = Promise.resolve(selectedZeroAccount.value);
        const setSelectedName = ref<(name: string) => void>((name: string) => {});
        const requestAccountSelection = computed(() =>
            // there are available accounts and no account is selected
            availableZeroAccounts.value.length > 0 &&
            selectedZeroAccount.value === '',
        );
        const selectAccount = (accounts: string[]) => new Promise<string>(async (resolveAccountSelected) => {
            if (accounts.length === 1) {
                resolveAccountSelected(accounts[0]);
            } else {
                // we create a new Promise and save its resolve in a variable
                whenAccountSelected = new Promise((resolve) => {
                    setSelectedName.value = resolve;
                });
                // enable account selection
                availableZeroAccounts.value = [...accounts];
                // wait for the promise to resolve
                selectedZeroAccount.value = await whenAccountSelected;
                // take the name of the selected account and pass it to the resolve of the original promise
                resolveAccountSelected(selectedZeroAccount.value);
            }
        });
        const requestNameSelection = ref(false);
        const selectAccountName = () => new Promise<string>(async (resolveAccountNameSelected) => {
            // we create a new Promise and save its resolve in a variable
            whenAccountSelected = new Promise((resolve) => {
                setSelectedName.value = resolve;
            });
            // enable account selection
            requestNameSelection.value = true;
            // wait for the promise to resolve
            selectedZeroAccount.value = await whenAccountSelected;
            // disable account selection
            requestNameSelection.value = false;
            // take the name of the selected account and pass it to the resolve of the original promise
            resolveAccountNameSelected(selectedZeroAccount.value);
        });
        const setMetakeepZero = (credentials:GoogleCredentials) => {
            const name = 'metakeep.ual';
            const auth = getZeroAuthenticator(name) as MetakeepAuthenticator;
            auth.setAccountSelector({ selectAccount });
            auth.setAccountNameSelector({ selectAccountName });
            auth.setUserCredentials(credentials);
            const idx = ualAuthenticators.map(a => a.getName()).indexOf(name);
            loginTelosZero(idx);
        };
        const setCleosViewerZero = () => {
            const idx = ant.config.authenticatorsGetter().map(a => a.getName()).indexOf('cleos');
            loginTelosZero(idx, true);
        };
        const redirectToNewAccountWebsite = () => {
            window.open('https://app.telos.net/accounts/add');
        };

        // Telos Cloud login ----------------------------------------------------
        const performTelosCloudLogin = (data: GoogleCredentials) => {
            if (!data) {
                console.error('performTelosCloudLogin() data is null');
                return;
            }
            if (props.chain === 'zero') {
                setMetakeepZero(data);
            } else {
                setMetaKeepEVM(data);
            }
        };

        const showGoogleLoading = ref(false);
        const showGoogleBtn = computed(() =>
            !requestAccountSelection.value &&
            !requestNameSelection.value &&
            selectedZeroAccount.value === '',
        );
        const googleSubscription = googleCtrl.onSuccessfulLogin.subscribe({
            next: (data) => {
                if (data) {
                    showGoogleLoading.value = true;
                    ant.config.notifyNeutralMessageHandler(globalProps.$t('antelope.account.logging_in_as', { account: data.email }));
                    performTelosCloudLogin(data);
                }
            },
        });

        // we check the div is present before trying to render the google button
        const googleBtnLoop = setInterval(() => {
            const googleBtn = document.getElementById('google_btn');
            if (googleBtn !== null) {
                googleCtrl.renderButton('google_btn');
                clearInterval(googleBtnLoop);
            }
        }, 100);

        const accountNameModel = ref('');
        const accountNameIsLoading = ref(false);
        const accountNameHasError = ref(false);
        const accountNameHasWarning = ref(false);
        const accountNameIsSuccessful = ref(false);
        const accountNameWarningText = ref('');
        const accountNameErrorMessage = ref('');

        watch(accountNameModel, async (newVal) => {
            const settings = chainStore.currentChain.settings;
            accountNameIsLoading.value = false;
            accountNameHasError.value = false;
            accountNameHasWarning.value = false;
            accountNameIsSuccessful.value = false;
            accountNameWarningText.value = '';
            accountNameErrorMessage.value = '';

            if (!settings.isNative()) {
                return;
            }
            const nativeSettings = settings as NativeChainSettings;
            if (newVal.length === 0) {
                return;
            }

            // let's check if the name has only valid characters
            const validChars = 'abcdefghijklmnopqrstuvwxyz12345';
            for (let i = 0; i < newVal.length; i++) {
                const char = newVal[i];
                if (char === '.') {
                    accountNameHasError.value = true;
                    accountNameErrorMessage.value = 'Name cannot contain dots';
                    return;
                }
                if (!validChars.includes(char)) {
                    accountNameHasError.value = true;
                    accountNameErrorMessage.value = `ivalid character '${char}'`;
                    return;
                }
            }

            // let's check if the name has 12 characters
            if (newVal.length !== 12) {
                accountNameHasError.value = true;
                accountNameErrorMessage.value = `${newVal.length} of 12 characters`;
                return;
            }

            accountNameIsLoading.value = true;
            const isAvailable = await nativeSettings.isAccountNameAvailable(newVal);
            accountNameIsLoading.value = false;
            if (isAvailable) {
                accountNameHasError.value = false;
                accountNameHasWarning.value = false;
                accountNameIsSuccessful.value = true;
                accountNameWarningText.value = '';
                accountNameErrorMessage.value = '';
            } else {
                accountNameHasError.value = true;
                accountNameHasWarning.value = false;
                accountNameIsSuccessful.value = false;
                accountNameWarningText.value = '';
                accountNameErrorMessage.value = 'Name is taken';
            }
        });


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
            setMetaKeepEVM,
            setBraveEVM,
            setSafePalEVM,
            setWalletConnectEVM,
            notifyNoProvider,
            notifyEnableBrave,
            redirectToMetamaskDownload,
            redirectToSafepalDownload,
            googleSubscription,
            showGoogleLoading,
            showGoogleBtn,
            googleCtrl,
            showEVMButtons,
            showZeroButtons,
            ualAuthenticators,
            loginTelosZero,
            setCleosViewerZero,
            redirectToNewAccountWebsite,
            availableZeroAccounts,
            selectedZeroAccount,
            setSelectedName,
            accountNameModel,
            accountNameIsLoading,
            accountNameHasError,
            accountNameHasWarning,
            accountNameIsSuccessful,
            accountNameWarningText,
            accountNameErrorMessage,
            requestAccountSelection,
            requestNameSelection,
        };
    },
    unmounted() {
        this.googleSubscription?.unsubscribe();
    },
});
</script>

<template>
<div class="c-login-buttons">

    <!-- Telos Cloud Button -->
    <div
        class="c-login-buttons__option c-login-buttons__option--telos-cloud"
        :class="{
            'c-login-buttons__option': true,
            'c-login-buttons__option--telos-cloud': true,
            'c-login-buttons__option--telos-cloud--gradient': availableZeroAccounts.length > 0
        }"
    >
        <div class="c-login-buttons__cloud-btn-container">
            <div class="c-login-buttons__cloud-btn-line-title">
                <img
                    width="24"
                    class="c-login-buttons__icon c-login-buttons__icon--cloud"
                    src="~assets/icon--telos-cloud.svg"
                >
                <span>{{ $t('home.telos_cloud_login') }}</span>
            </div>

            <!-- there'sa selected name. Show it-->
            <div v-if="selectedZeroAccount !== ''" class="c-login-buttons__zero-accounts-title">
                <!-- we show a spinner also -->
                <QSpinnerFacebook class="c-login-buttons__zero-account-loading" />
                {{ selectedZeroAccount }}
            </div>

            <!-- Allow the user to enter the name of the account to be created -->
            <div v-if="requestNameSelection" class="c-login-buttons__zero-accounts-title">
                {{ $t('home.enter_account_name') }}
            </div>
            <div v-if="requestNameSelection" class="c-login-buttons__account-name-input-container">
                <BaseTextInput
                    v-model="accountNameModel"
                    :loading="accountNameIsLoading"
                    :error="accountNameHasError"
                    :warning="accountNameHasWarning"
                    :success="accountNameIsSuccessful"
                    :warning-text="accountNameWarningText"
                    :error-message="accountNameErrorMessage"
                    required="true"
                    :label="$t('home.account_name')"
                    class="c-login-buttons__account-name-input"
                />

                <div class="c-login-buttons__account-name-buttons">
                    <q-btn
                        color="primary"
                        :label="$t('home.continue')"
                        :disable="!accountNameIsSuccessful"
                        @click="accountNameIsSuccessful ? setSelectedName(accountNameModel) : null"
                    />
                </div>
            </div>

            <!-- Allow the user to select one of many available accounts -->
            <div v-if="requestAccountSelection" class="c-login-buttons__zero-accounts-title">
                {{ $t('home.available_accounts') }}
            </div>
            <div v-if="requestAccountSelection" class="c-login-buttons__zero-accounts">
                <div
                    v-for="account in availableZeroAccounts"
                    :key="account"
                    class="c-login-buttons__option c-login-buttons__option--zero-account"
                    @click="setSelectedName(account)"
                > {{ account }} </div>
            </div>

            <!-- Google One Tap render button -->
            <template v-if="showGoogleBtn">
                <div v-if="showGoogleLoading" class="c-login-buttons__google-loading">
                    <div class="c-login-buttons__loading"><QSpinnerFacebook /></div>
                </div>
                <div
                    v-else
                    id="google_btn"
                    :data-client_id="googleCtrl.clientId"
                    class="c-login-buttons__google-btn"
                >
                    <div class="c-login-buttons__loading"><QSpinnerFacebook /></div>
                </div>
            </template>

        </div>
    </div>

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
                    {{ wallet.getStyle().text }} {{  wallet.getName()  }}
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
