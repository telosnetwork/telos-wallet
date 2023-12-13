import { AntelopeError } from 'src/antelope/types';

import * as Buffer from 'buffer';
import { BehaviorSubject, Subject } from 'rxjs';

interface GoogleOneTap {
    accounts: {
        id: {
            initialize: (config: { client_id: string, callback: (notification: GoogleNotification) => void }) => void;
            prompt: (callback: (notification: GoogleNotification) => void) => void;
            renderButton: (element: HTMLElement, config: { theme: string, size: string }) => void;
            disableAutoSelect: () => void;
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

interface SuccessResponse {
    header: {
        alg: string;
        kid: string;
        typ: string;
    };
    payload: {
        iss: string;
        azp: string;
        aud: string;
        sub: string;
        email: string;
        email_verified: boolean;
        at_hash: string;
        nonce: string;
        exp: number;
        iat: number;
    };
}

let google: GoogleOneTap | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _window = (window as any);

class GoogleOneTapController {

    onSuccessfulLogin = new BehaviorSubject<string | null>(null);
    onError = new BehaviorSubject<string | null>(null);
    onMoment = new Subject<{type: string, status:string, reason:string}>();

    buttonConfig = { theme: 'outline', size: 'large' }; // default config

    constructor() {
        this.installGoogleOneTapScript();
    }

    installGoogleOneTapScript() {
        if (google) {
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
        _window.onGoogleLibraryLoad = () => {
            this.onGoogleLibraryLoad();
        };
    }

    onGoogleLibraryLoad() {
        if(!google){
            if (_window.google) {
                google = _window.google;
            } else {
                // FIXME: use i18n
                throw new AntelopeError('Google One Tap library not loaded');
            }
        }
        if (google) {
            google.accounts.id.initialize({
                client_id: '639241197544-kcubenhmti6u7ef3uj360n2lcl5cmn8c.apps.googleusercontent.com',
                callback: (response: GoogleNotification | null) => {
                    if (response) {
                        const credential = response.credential;
                        const decoded = this.decodeJWT(credential);
                        this.handleOneTapSuccess(decoded);
                    } else {
                        this.handleOneTapError(JSON.stringify(response));
                    }
                },
            });/*
            console.log(' --------- notification ----------', 'esto se ve una sola vez?');
            google.accounts.id.prompt((notification) => {
                console.log('notification', notification);
                const momentType = notification.getMomentType();
                if(notification.isDisplayed()) {
                    setTimeout(()=>{
                        this.handleOneTapMoment(momentType, 'displayed', 'displayed');
                    }, 500);
                } else if(notification.isNotDisplayed()){
                    this.handleOneTapMoment(momentType, 'notdisplayed', notification.getNotDisplayedReason());
                } else if(notification.isSkippedMoment()) {
                    this.handleOneTapMoment(momentType, 'skipped', notification.getSkippedReason());
                } else if(notification.isDismissedMoment()) {
                    this.handleOneTapMoment(momentType, 'dismissed', notification.getDismissedReason());
                }
            });*/
        }
    }

    decodeJWT(token: string) {
        const parts = token.split('.');
        const header = parts[0];
        const payload = parts[1];

        const decodedHeader = Buffer.Buffer.from(header, 'base64').toString('utf8');
        const decodedPayload = Buffer.Buffer.from(payload, 'base64').toString('utf8');

        return {
            header: JSON.parse(decodedHeader),
            payload: JSON.parse(decodedPayload),
        };
    }

    setButtonConfig(config: { theme: string, size: string }) {
        this.buttonConfig = config;
    }

    timer = setTimeout(() => { /**/ }, 0);
    renderButton(tag_id = 'google_btn') {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            const btn = document.getElementById(tag_id);
            if (!btn) {
                console.error('google button not found using tag_id: ', tag_id);
            }
            if (google && btn) {
                google.accounts.id.renderButton(
                    btn, this.buttonConfig,
                );
            }
        }, 1000);
    }

    handleOneTapMoment(type: string, status: string, reason: string) {
        console.log('handleOneTapMoment', type, status, reason);
        this.onMoment.next({ type, status, reason });
    }

    handleOneTapSuccess(response: SuccessResponse) {
        console.log('handleOneTapSuccess this.onSuccessfulLogin.next(response.payload.email);', response);
        this.onSuccessfulLogin.next(response.payload.email);
    }

    handleOneTapError (error: string) {
        console.error('handleOneTapError', error);
        this.onError.next(error);
    }

    logout() {
        if (google) {
            google.accounts.id.disableAutoSelect();
            console.log('logout this.onSuccessfulLogin.next(null);');
            this.onSuccessfulLogin.next(null);
        }
    }

}


export const googleCtrl = new GoogleOneTapController();

// renderGoogleOneTap();
