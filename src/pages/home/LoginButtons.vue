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
import { words } from 'src/pages/home/words';
import { Subscription } from 'rxjs';


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

        // Redirect -----------------------------------------------------------
        // If we receive a redirect parameter in the URL, we redirect to the corresponding page after the user has completed the login process
        // The first thing we do is to check if the URL has a redirect parameter to set a local variable
        const redirectParam = new URLSearchParams(window.location.search).get('redirect');
        const redirect = ref<{url:string, hostname:string} | null>(null);
        const redirectShow = ref(false);
        if (redirectParam) {
            const isValid = new RegExp('^(http|https)://', 'i').test(redirectParam);
            if (isValid) {
                redirect.value = {
                    url: redirectParam,
                    hostname: new URL(redirectParam).hostname,
                };
                redirectShow.value = true;
            }
        }

        const subscription = ant.events.onLoggedIn.subscribe({
            next: () => {
                subscription.unsubscribe();
                // if the redirect parameter is present, show a confirm notification to the user
                if (redirect.value) {
                    const hostname = redirect.value.hostname;
                    const message = globalProps.$t('home.redirect_notification_message', { hostname });
                    globalProps.$notifyWarningWithAction(message, {
                        label: ant.config.localizationHandler('home.redirect_me'),
                        handler: () => {
                            // we redirect the user to the url
                            if (redirect.value) {
                                // we need to generate a new url based on redirect.value?.url adding the accountStore.loggedNativeAccount?.account
                                // and the email of the user if it's a metakeep authenticator
                                const url = new URL(redirect.value.url);
                                url.searchParams.set('account', accountStore.loggedNativeAccount?.account || '');
                                const authenticator = accountStore.loggedNativeAccount.authenticator;
                                // if (authenticator && authenticator.getName() === 'metakeep.ual') {
                                console.log('adding the email...');
                                const auth = authenticator as never as MetakeepAuthenticator;
                                url.searchParams.set('email', auth.getEmail());
                                //}
                                console.log('redirecting to', url.toString());
                                window.location.href = url.toString();
                            }
                        },
                    });
                }
            },
        });


        const showEVMButtons = computed(() =>
            props.chain === 'evm');
        const showZeroButtons = computed(() =>
            redirect.value === null && // then we hide everything else
            props.chain === 'zero' &&
            !requestNameSelection.value  &&
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

        const loginTelosZero = (idx:number, justViewer:boolean = false) => {
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

        function randomizeAccountName() {
            const validNumbers = ['1', '2', '3', '4', '5'];
            accountNameModel.value = '';

            let accountName = '';
            let word1 = '';
            let word2 = '';
            let number = '';
            let totalLength = 0;
            while(accountNameModel.value === '') {
                word1 = words[Math.floor(Math.random() * words.length)];
                word2 = words[Math.floor(Math.random() * words.length)];
                totalLength = word1.length + word2.length;
                if (totalLength > 12) {
                    continue;
                }
                if (totalLength === 12) {
                    accountName = word1 + word2;
                    accountNameModel.value = accountName;
                    break;
                }
                if (totalLength < 12) {
                    number = '';
                    while (totalLength + number.length < 12) {
                        number += validNumbers[Math.floor(Math.random() * validNumbers.length)];
                    }
                    accountName = word1 + number + word2;
                    accountNameModel.value = accountName;
                    break;
                }
            }
        }

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

        const googleSubscription = ref<Subscription | null>(null);
        if (!googleCtrl.logged) {
            googleSubscription.value = googleCtrl.onSuccessfulLogin.subscribe({
                next: (data) => {
                    if (data) {
                        showGoogleLoading.value = true;
                        ant.config.notifyNeutralMessageHandler(globalProps.$t('antelope.account.logging_in_as', { account: data.email }));
                        performTelosCloudLogin(data);
                    }
                },
            });
        }

        // we check the div is present before trying to render the google button
        const googleBtnLoop = setInterval(() => {
            // loop until div#google_btn is rendered
            const googleBtn = document.getElementById('google_btn');
            if (googleBtn !== null) {
                // we found it, so we stop the first loop
                clearInterval(googleBtnLoop);

                // Now we call the button render function
                googleCtrl.renderButton('google_btn');

                // Now we start a second loop waiting for the div#google_btn_content to be replaced by the actual google btn
                const googleBtnRenderSecondLoop = setInterval(() => {
                    const googleBtnContent = document.getElementById('google_btn_content');
                    if (googleBtnContent === null) {
                        clearInterval(googleBtnRenderSecondLoop);
                    } else {
                        // if after a whole second it didn't render we call it again
                        googleCtrl.renderButton('google_btn');
                    }
                }, 1000);
            }
        }, 100);

        const accountNameModel = ref('');
        const accountNameIsLoading = ref(false);
        const accountNameHasError = ref(false);
        const accountNameHasWarning = ref(false);
        const accountNameIsSuccessful = ref(false);
        const accountNameWarningText = ref('');
        const accountNameErrorMessage = ref('');

        const accountTriesCount = ref(0);
        watch(accountNameModel, async (newVal) => {
            accountTriesCount.value += 1;
            const currentCount = accountTriesCount.value;
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
                    accountNameErrorMessage.value = globalProps.$t('login.account_name_feedback_no_dots');
                    return;
                }
                if (!validChars.includes(char)) {
                    accountNameHasError.value = true;
                    accountNameErrorMessage.value = globalProps.$t('login.account_name_feedback_invalid_character', { char });
                    return;
                }
            }

            // let's check if the name has 12 characters
            if (newVal.length !== 12) {
                accountNameHasError.value = true;
                accountNameErrorMessage.value = globalProps.$t('login.account_name_feedback_invalid_length', { length: newVal.length });
                return;
            }

            accountNameIsLoading.value = true;
            const isAvailable = await nativeSettings.isAccountNameAvailable(newVal);
            if (currentCount < accountTriesCount.value) {
                return;
            }

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
                accountNameErrorMessage.value = globalProps.$t('login.account_name_feedback_taken');
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
            randomizeAccountName,
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
            redirectShow,
            redirect,
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

            <!-- there's a selected name. Show it-->
            <div v-if="selectedZeroAccount !== ''" class="c-login-buttons__zero-accounts-title">
                <!-- we show a spinner also -->
                <QSpinnerFacebook class="c-login-buttons__zero-account-loading" />
                {{ selectedZeroAccount }}
            </div>

            <!-- Allow the user to enter the name of the account to be created -->
            <div v-if="requestNameSelection" class="c-login-buttons__zero-accounts-title">
                {{ $t('home.create_new_account') }}
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
                        color="secondary"
                        :label="$t('home.random')"
                        @click="randomizeAccountName()"
                    />
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
                    <div id="google_btn_content" class="c-login-buttons__loading"><QSpinnerFacebook /></div>
                </div>
            </template>

        </div>
    </div>

    <template v-if="requestNameSelection || requestAccountSelection || redirectShow">
        <div v-if="requestNameSelection" class="c-login-buttons__zero-accounts-title"> {{ $t('home.name_selection_text') }}</div>
        <div v-if="requestAccountSelection" class="c-login-buttons__zero-accounts-title"> {{ $t('home.account_selection_text') }}</div>
        <div v-if="redirectShow" class="c-login-buttons__zero-accounts-title"> {{ $t('home.redirect_warning') }}</div>
        <div v-if="redirectShow" class="c-login-buttons__zero-accounts-title"><b> {{ redirect?.hostname }}</b></div>
    </template>

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
