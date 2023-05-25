import { Authenticator } from 'universal-authenticator-library';
import { App } from 'vue';
import { getAntelope } from '..';

export class AntelopeConfig {
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
    private __error_to_string_handler: (error: unknown) => string = (error: unknown) => {
        try {

            type EVMError = {code:string};
            const evmErr = error as EVMError;

            switch (evmErr.code) {
            case 'CALL_EXCEPTION':          return 'antelope.evm.error_call_exception';
            case 'INSUFFICIENT_FUNDS':      return 'antelope.evm.error_insufficient_funds';
            case 'MISSING_NEW':             return 'antelope.evm.error_missing_new';
            case 'NONCE_EXPIRED':           return 'antelope.evm.error_nonce_expired';
            case 'NUMERIC_FAULT':           return 'antelope.evm.error_numeric_fault';
            case 'REPLACEMENT_UNDERPRICED': return 'antelope.evm.error_replacement_underpriced';
            case 'TRANSACTION_REPLACED':    return 'antelope.evm.error_transaction_replaced';
            case 'UNPREDICTABLE_GAS_LIMIT': return 'antelope.evm.error_unpredictable_gas_limit';
            case 'USER_REJECTED':           return 'antelope.evm.error_user_rejected';
            case 'ACTION_REJECTED':         return 'antelope.evm.error_transaction_canceled';
            }

            if (typeof error === 'string') {
                return error;
            }
            if (typeof error === 'number') {
                return error.toString();
            }
            if (typeof error === 'boolean') {
                return error.toString();
            }
            if (error instanceof Error) {
                return error.message;
            }
            if (typeof error === 'undefined') {
                return 'undefined';
            }
            if (typeof error === 'object') {
                if (error === null) {
                    return 'null';
                }
                if (Array.isArray(error)) {
                    return error.map(a => this.__error_to_string_handler(a)).join(', ');
                }
                return JSON.stringify(error);
            }
            return 'unknown';
        } catch (er) {
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
