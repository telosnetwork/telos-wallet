import { Authenticator } from 'universal-authenticator-library';
import { App } from 'vue';
import { getAntelope } from '..';

export class AntelopeConfig {
    // indexer health threshold --
    private __indexer_health_threshold = 10;

    // notifucation handlers --
    private __notify_error_handler: (message: string) => void = m => alert(`Error: ${m}`);
    private __notify_success_handler: (message: string) => void = alert;
    private __notify_warning_handler: (message: string) => void = alert;

    // transaction attempts handlers --
    private __notify_successful_trx_handler: (link: string) => void = alert;
    private __notify_failed_trx_handler: (message: string) => void = alert;

    // ual authenticators list getter --
    private __authenticators_getter: () => Authenticator[] = () => [];

    // localization handler --
    private __localization_handler: (key: string) => string = (key: string) => key;

    // error to string handler --
    private __error_to_string_handler: (catched: unknown) => string = (catched: unknown) => {
        try {
            if (typeof catched === 'string') {
                return catched;
            }
            if (typeof catched === 'number') {
                return catched.toString();
            }
            if (typeof catched === 'boolean') {
                return catched.toString();
            }
            if (catched instanceof Error) {
                return catched.message;
            }
            if (typeof catched === 'undefined') {
                return 'undefined';
            }
            if (typeof catched === 'object') {
                if (catched === null) {
                    return 'null';
                }
                if (Array.isArray(catched)) {
                    return catched.map(a => this.__error_to_string_handler(a)).join(', ');
                }
                return JSON.stringify(catched);
            }
            return 'unknown';
        } catch (error) {
            return 'error';
        }
    }

    // Vue.App holder --
    private __app: App | null = null;

    constructor() {
        //
    }

    init(app: App) {
        this.__app = app;
    }

    get app() {
        return this.__app;
    }

    get indexerHealthThreshold() {
        return this.__indexer_health_threshold;
    }

    get notifyErrorHandler() {
        return this.__notify_error_handler;
    }

    get notifySuccessHandler() {
        return this.__notify_success_handler;
    }

    get notifyWarningHandler() {
        return this.__notify_warning_handler;
    }

    get notifySuccessfulTrxHandler() {
        return this.__notify_successful_trx_handler;
    }

    get notifyFailedTrxHandler() {
        return this.__notify_failed_trx_handler;
    }

    get authenticatorsGetter() {
        return this.__authenticators_getter;
    }

    get localizationHandler() {
        return this.__localization_handler;
    }

    get errorToStringHandler() {
        return this.__error_to_string_handler;
    }

    // setting notifucation handlers --
    public setNotifyErrorHandler(handler: (message: string) => void) {
        this.__notify_error_handler = handler;
    }

    public setNotifySuccessHandler(handler: (message: string) => void) {
        this.__notify_success_handler = handler;
    }

    public setNotifyWarningHandler(handler: (message: string) => void) {
        this.__notify_warning_handler = handler;
    }

    public setNotifySuccessfulTrxHandler(handler: (link: string) => void) {
        this.__notify_successful_trx_handler = handler;
    }

    public setNotifyFailedTrxHandler(handler: (message: string) => void) {
        this.__notify_failed_trx_handler = handler;
    }

    // setting authenticators getter --
    public setAuthenticatorsGetter(getter: () => Authenticator[]) {
        this.__authenticators_getter = getter;
    }

    // setting translation handler --
    public setLocalizationHandler(handler: (key: string) => string) {
        this.__localization_handler = handler;
    }

    // setting error to string handler --
    public setErrorToStringHandler(handler: (catched: unknown) => string) {
        this.__error_to_string_handler = handler;
    }

}

export const errorToString = (error: unknown) =>
    getAntelope().config.errorToStringHandler(error);
