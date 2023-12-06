<script lang="ts">
import { CURRENT_CONTEXT, getAntelope, useAccountStore, useChainStore, useEVMStore, useFeedbackStore, usePlatformStore } from 'src/antelope';
import { ComponentInternalInstance, PropType, computed, defineComponent, getCurrentInstance, ref, watch } from 'vue';
import { QSpinnerFacebook } from 'quasar';
import { MetaKeepAuth, OreIdAuth } from 'src/antelope/wallets';
import { Menu } from 'src/pages/home/MenuType';
import InlineSvg from 'vue-inline-svg';
import { isTodayBeforeTelosCloudDown } from 'src/App.vue';
import { AntelopeError } from 'src/antelope/types';

import * as Buffer from 'buffer';

interface GoogleOneTap {
    accounts: {
        id: {
            initialize: (config: { client_id: string, callback: (notification: GoogleNotification) => void }) => void;
            prompt: (callback: (notification: GoogleNotification) => void) => void;
            renderButton: (element: HTMLElement, config: { theme: string, size: string }) => void;
        }
    }
}
interface GoogleNotification {
    getMomentType: () => string;
    isDisplayed: () => boolean;
    isNotDisplayed: () => boolean;
    isSkippedMoment: () => boolean;
    isDismissedMoment: () => boolean;
    getNotDisplayedReason: () => string;
    getSkippedReason: () => string;
    getDismissedReason: () => string;
    credential: string;
}

let google: GoogleOneTap | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _window = (window as any);

export default defineComponent({
    name: 'EVMLoginButtons',
    components: {
        QSpinnerFacebook,
        InlineSvg,
    },
    emits: [
        'update:modelValue',
    ],
    props: {
        modelValue: {
            type: String as PropType<Menu>,
            default: Menu.MAIN,
        },
    },
    setup(props, { emit }) {
        const ant = getAntelope();
        const globalProps = (getCurrentInstance() as ComponentInternalInstance).appContext.config.globalProperties;
        const isMobile = ref(usePlatformStore().isMobile);
        const isBraveBrowser = ref((navigator as any).brave && (navigator as any).brave.isBrave());

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

        const setOreIdAuthenticator = async (provider: string) => {
            const name = 'OreId';
            const auth = ant.wallets.getAuthenticator(name);
            if (auth) {
                (auth as OreIdAuth).setProvider(provider);
                selectedOAuthProvider.value = provider;
            }
            setAuthenticator(name, CURRENT_CONTEXT);
        };
        const setMetamaskAuthenticator = async () => {
            setAuthenticator('Metamask', CURRENT_CONTEXT);
        };
        const setMetaKeepAuthenticator = async (email:string) => {
            const name = 'MetaKeep';
            const auth = ant.wallets.getAuthenticator(name);
            if (auth) {
                (auth as MetaKeepAuth).setEmail(email);
                console.log('ANTES: ', auth);
            }
            setAuthenticator(name, CURRENT_CONTEXT);
        };
        const setBraveAuthenticator = async () => {
            setAuthenticator('Brave', CURRENT_CONTEXT);
        };
        const setSafePalAuthenticator = async () => {
            setAuthenticator('SafePal', CURRENT_CONTEXT);
        };
        const setWalletConnectAuthenticator = async () => {
            setAuthenticator('WalletConnect', CURRENT_CONTEXT);
        };

        const setAuthenticator = async(name: string, label: string) => {
            const auth = ant.wallets.getAuthenticator(name);
            console.log('POSTA: ', auth);
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
        const isLoadingOreId = (provider: string) =>
            selectedOAuthProvider.value === provider &&
            useFeedbackStore().isLoading('OreId.login');

        // menu navitgaion
        const showMainMenu = computed(() => props.modelValue === Menu.MAIN);
        const showTelosCloudMenu = computed(() => props.modelValue === Menu.CLOUD);

        const setCloudMenu = () => {
            emit('update:modelValue', Menu.CLOUD);
        };

        // --- Google One Tap (ini) -------------------------------
        const onGoogleOneTap = () => {
            setAuthenticator('Metakeep', CURRENT_CONTEXT);
        };

        const onGoogleOneTapSuccess = (response: any) => {
            console.log('response: ', response);
            console.log('response.payload: ', response.payload);
            console.log('response.payload.email: ', response.payload.email);
            setMetaKeepAuthenticator(response.payload.email);
        };

        const onGoogleOneTapError = (error: any) => {
            console.error('-------------------------------');
            console.error('google one tap error', error);
            console.error('-------------------------------');
        };

        const installGoogleOneTapScript = () => {
            if (google) {
                return;
            }
            console.log('installGoogleOneTapScript()');
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            document.body.appendChild(script);
            _window.onGoogleLibraryLoad = () => {
                oneTapInit();
            };
        };

        const oneTapInit = () => {
            console.log('oneTapInit()');
            if(!google){
                if (_window.google) {
                    google = _window.google;
                } else {
                    // FIXME: use i18n
                    throw new AntelopeError('Google One Tap library not loaded');
                }
            }
            if (google) {
                console.log('----------------- google -->', google);
                google.accounts.id.initialize({
                    client_id: '639241197544-kcubenhmti6u7ef3uj360n2lcl5cmn8c.apps.googleusercontent.com',
                    callback: oneTapCallback,
                });
                google.accounts.id.prompt((notification) => {
                    const momentType = notification.getMomentType();
                    if(notification.isDisplayed()) {
                        setTimeout(()=>{
                            handleOneTapMoment(momentType, 'displayed', 'displayed');
                        }, 500);
                    } else if(notification.isNotDisplayed()){
                        handleOneTapMoment(momentType, 'notdisplayed', notification.getNotDisplayedReason());
                    } else if(notification.isSkippedMoment()) {
                        handleOneTapMoment(momentType, 'skipped', notification.getSkippedReason());
                    } else if(notification.isDismissedMoment()) {
                        handleOneTapMoment(momentType, 'dismissed', notification.getDismissedReason());
                    }
                });
            }
        };

        const decodificarJWT = (token: string) => {
            const parts = token.split('.');
            const header = parts[0];
            const payload = parts[1];

            const dedodedHeader = Buffer.Buffer.from(header, 'base64').toString('utf8');
            const decodedPayload = Buffer.Buffer.from(payload, 'base64').toString('utf8');

            return {
                header: JSON.parse(dedodedHeader),
                payload: JSON.parse(decodedPayload),
            };
        };

        const oneTapCallback = (response: GoogleNotification | null) => {
            console.log('---------- oneTapCallback -------------->', response);
            if (response) {
                const credential = response.credential;
                const decoded = decodificarJWT(credential);
                onGoogleOneTapSuccess(decoded);
            } else {
                onGoogleOneTapError(response);
            }
        };

        const handleOneTapMoment = (momentType: string, status: string, reason: string) => {
            console.log('-- handleOneTapMoment -> ', momentType, status, reason);
        };

        watch(showTelosCloudMenu, (newValue) => {
            console.log('showTelosCloudMenu changed', newValue);
            if (newValue) {
                setTimeout(() => {
                    showGoogleOneTap();
                }, 100);
            }
        });


        const showGoogleOneTap = () => {
            const btn = document.getElementById('google_btn');
            if (google && btn) {
                console.log('--- google.accounts.id.renderButton() ---');
                google.accounts.id.renderButton(
                    btn, { theme: 'outline', size: 'large' },
                );
            }
        };

        installGoogleOneTapScript();
        showGoogleOneTap();
        // --- Google One Tap (end) -------------------------------

        console.log('EVMLoginButtons setup()');

        return {
            isLoading,
            isLoadingOreId,
            supportsMetamask,
            supportsBrave,
            supportsSafePal,
            showMetamaskButton,
            showBraveButton,
            showSafePalButton,
            showWalletConnectButton,
            setOreIdAuthenticator,
            setMetamaskAuthenticator,
            setMetaKeepAuthenticator,
            setBraveAuthenticator,
            setSafePalAuthenticator,
            setWalletConnectAuthenticator,
            notifyNoProvider,
            notifyEnableBrave,
            redirectToMetamaskDownload,
            redirectToSafepalDownload,
            isTodayBeforeTelosCloudDown,
            // menu navigation
            showMainMenu,
            showTelosCloudMenu,
            setCloudMenu,
            onGoogleOneTapSuccess,
            onGoogleOneTapError,
            onGoogleOneTap,
        };
    },
});
</script>

<template>
<div class="c-evm-login-buttons">

    <!-- main menu -->
    <template v-if="showMainMenu">

        <!-- Google OAuth Provider -->
        <div v-if="isTodayBeforeTelosCloudDown" class="c-evm-login-buttons__option c-evm-login-buttons__option--telos-cloud" @click="setCloudMenu()">
            <div class="c-evm-login-buttons__cloud-btn-container">
                <div class="c-evm-login-buttons__cloud-btn-line-title">
                    <img
                        width="24"
                        class="c-evm-login-buttons__icon c-evm-login-buttons__icon--cloud"
                        src="~assets/icon--telos-cloud.svg"
                    >
                    <span>{{ $t('home.login_with_social_media') }}</span>
                </div>
                <div class="c-evm-login-buttons__cloud-btn-line-icons">
                    <img
                        width="12"
                        class="c-evm-login-buttons__icon c-evm-login-buttons__icon--social"
                        src="~assets/icon--google.svg"
                    >
                    <img
                        width="12"
                        class="c-evm-login-buttons__icon c-evm-login-buttons__icon--social"
                        src="~assets/icon--facebook.svg"
                    >
                    <img
                        width="12"
                        class="c-evm-login-buttons__icon c-evm-login-buttons__icon--social"
                        src="~assets/icon--twitter.svg"
                    >
                </div>
            </div>
        </div>

        <!-- Brave Authenticator button -->
        <div
            v-if="showBraveButton"
            class="c-evm-login-buttons__option"
            @click="supportsBrave ? setBraveAuthenticator() : notifyEnableBrave()"
        >
            <template v-if="isLoading('Brave.login')">
                <div class="c-evm-login-buttons__loading"><QSpinnerFacebook /></div>
            </template>
            <template v-else>
                <InlineSvg
                    :src="require('src/assets/evm/brave_lion.svg')"
                    class="c-evm-login-buttons__icon c-evm-login-buttons__icon--brave"
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
            class="c-evm-login-buttons__option"
            @click="supportsMetamask ?  setMetamaskAuthenticator() : supportsSafePal ? notifyNoProvider('Metamask') : redirectToMetamaskDownload()"
        >
            <template v-if="isLoading('Metamask.login')">
                <div class="c-evm-login-buttons__loading"><QSpinnerFacebook /></div>
            </template>
            <template v-else>
                <InlineSvg
                    :src="require('src/assets/evm/metamask_fox.svg')"
                    class="c-evm-login-buttons__icon c-evm-login-buttons__icon--metamask"
                    height="24"
                    width="24"
                    aria-hidden="true"
                />
                {{ supportsMetamask ? $t('home.metamask') : $t('home.install_metamask') }}
            </template>
        </div>

        <!-- Safepal Authenticator button -->
        <div
            v-if="showSafePalButton"
            class="c-evm-login-buttons__option"
            @click="supportsSafePal ? setSafePalAuthenticator() : redirectToSafepalDownload()"
        >
            <template v-if="isLoading('SafePal.login')">
                <div class="c-evm-login-buttons__loading"><QSpinnerFacebook /></div>
            </template>
            <template v-else>
                <InlineSvg
                    :src="require('src/assets/evm/safepal.svg')"
                    class="c-evm-login-buttons__icon c-evm-login-buttons__icon--safepal"
                    height="24"
                    width="24"
                    aria-hidden="true"
                />
                {{ supportsSafePal ? $t('home.safepal') : $t('home.install_safepal') }}
            </template>
        </div>

        <!-- WalletConnect Authenticator button -->
        <div
            v-if="showWalletConnectButton"
            class="c-evm-login-buttons__option"
            @click="setWalletConnectAuthenticator()"
        >
            <template v-if="isLoading('WalletConnect.login')">
                <div class="c-evm-login-buttons__loading"><QSpinnerFacebook /></div>
            </template>
            <template v-else>
                <InlineSvg
                    :src="require('src/assets/evm/wallet_connect.svg')"
                    class="c-evm-login-buttons__icon c-evm-login-buttons__icon--wallet-connect"
                    height="24"
                    width="24"
                    aria-hidden="true"
                />
                {{ $t('home.walletconnect') }}
            </template>
        </div>

    </template>

    <!-- telos cloud menu -->
    <template v-if="showTelosCloudMenu">

        <div
            id="google_btn"
            data-client_id="639241197544-kcubenhmti6u7ef3uj360n2lcl5cmn8c.apps.googleusercontent.com"
        >
        </div>

        <!-- Google OAuth Provider -->
        <div class="c-evm-login-buttons__option c-evm-login-buttons__option--web2" @click="setOreIdAuthenticator('google')">
            <template v-if="isLoadingOreId('google')">
                <div class="c-evm-login-buttons__loading"><QSpinnerFacebook /></div>
            </template>
            <template v-else>
                <img
                    width="24"
                    class="c-evm-login-buttons__icon"
                    src="~assets/icon--google.svg"
                >
                {{ $t('home.sign_with_google') }}
            </template>
        </div>

        <div class="c-evm-login-buttons__sub-title">{{ $t('home.coming_soon') }}</div>

        <!-- Facebook OAuth Provider -->
        <div class="c-evm-login-buttons__option c-evm-login-buttons__option--web2 c-evm-login-buttons__option--disabled">
            <template v-if="isLoadingOreId('facebook')">
                <div class="c-evm-login-buttons__loading"><QSpinnerFacebook /></div>
            </template>
            <template v-else>
                <img
                    width="24"
                    class="c-evm-login-buttons__icon c-evm-login-buttons__icon--disabled"
                    src="~assets/icon--facebook.svg"
                >
                {{ $t('home.sign_with_facebook') }}
            </template>
        </div>

        <!-- X OAuth Provider -->
        <div class="c-evm-login-buttons__option c-evm-login-buttons__option--web2 c-evm-login-buttons__option--disabled">
            <template v-if="isLoadingOreId('facebook')">
                <div class="c-evm-login-buttons__loading"><QSpinnerFacebook /></div>
            </template>
            <template v-else>
                <img
                    width="24"
                    class="c-evm-login-buttons__icon c-evm-login-buttons__icon--disabled"
                    src="~assets/icon--twitter.svg"
                >
                {{ $t('home.sign_with_x') }}
            </template>
        </div>

    </template>


</div>
</template>

<style lang="scss">
.c-evm-login-buttons {
    $self: &;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 14px;

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
        gap: 8px;
    }

    &__sub-title {
        color: $white;
    }

    &__option {
        display: flex;
        gap: 8px;

        width: 224px;
        height: 54px;
        color: $white;
        outline-color: $white;
        outline-width: 1px;
        outline-style: solid;
        border-radius: 4px;
        font-size: 16px;
        font-weight: 500;
        padding: 14px;
        cursor: pointer;

        &:hover:not(&--disabled) {
            color: $white;
            outline-color: $white;
            outline-width: 2px;
        }

        &:not(:hover) #{$self}__icon {
            &--oreid, &--metamask, &--safepal, &--wallet-connect {
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
        }

        &--disabled {
            color: #9289b1;
            outline-color: #9289b1;
            cursor: not-allowed;
        }
    }
}
</style>
