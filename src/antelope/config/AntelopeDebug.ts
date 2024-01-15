import { ethers } from 'ethers';
import { getAntelope } from 'src/antelope';

export const localStorageKey = 'antelope.debug';
export const localStorageKeyTurnedOff = 'antelope.debug.turnedOff';

export class AntelopeDebug {
    private __debugModeAllowed = false; // this is set to false only on production and sensitive environments
    private __debugMode = false; // this represents the current state of the debug mode, can be set to true only if __debugModeAllowed is true
    private __filteringMode = false; // filtering mode is  atemporal state where all call to trace get printed but filtered
    private __filtered = new Map<string, boolean>(); // this is a map of stores, functions of both that have been turned off for debugging purposes
    constructor() {
        //
    }
    init() {
        // if we are in localhost, we can allow debug mode
        if (document.location.hostname === 'localhost') {
            this.allowDebugMode(true);
        }
        // try to recover the last state of debugMode from the localStorage
        this.recoverDebugMode();

        // if we find the trace flag in the url, we set the debug mode to true
        if (document.location.search.includes('trace=true')) {
            this.setDebugMode(true);
        }
        // but if we find the flag trace=false, we set the debug mode to false
        if (document.location.search.includes('trace=false')) {
            this.setDebugMode(false);
        }
    }
    allowDebugMode(allow: boolean) {
        this.__debugModeAllowed = allow;
        if (this.__debugMode) {
            this.setDebugMode(true);
        }
    }
    isDebugging() {
        return this.__debugMode && this.__debugModeAllowed;
    }
    setDebugMode(debug: boolean) {
        this.__debugMode = debug;
        if (!this.__debugModeAllowed) {
            return 'debug mode not allowed';
        }
        this.saveDebugConfig();
        if (this.isDebugging()) {
            this.publishAntelopeAPItoWindow();
            return 'debug mode enabled';
        } else {
            this.removeAntelopeAPIfromWindow();
            return 'debug mode disabled';
        }
    }
    turnOn() {
        return this.setDebugMode(true);
    }
    turnOff() {
        return this.setDebugMode(false);
    }

    /**
     * this function publishes the antelope API to the window object
     */
    publishAntelopeAPItoWindow() {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const _window = window as any;
        const ant = getAntelope();
        _window.ant = ant;
        _window.antelope = ant;
    }

    /**
     * this function removes the antelope API from the window object
     */
    removeAntelopeAPIfromWindow() {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const _window = window as any;
        delete _window.ant;
        delete _window.antelope;
    }

    /**
     * In case of debugging, this function allows to turn off a specific store, action or both
     * @param key the key to turn off, can be a store name, an action name or both separated by a dot
     * @param value the value to set, true to turn off, false to turn on
     */
    filterKey(key: string, value: boolean) {
        if (value) {
            this.__filtered.set(key.toLowerCase(), value);
        } else {
            this.__filtered.delete(key.toLowerCase());
        }
        this.saveDebugConfig();
        return `key "${key}" turned ${value ? 'off' : 'on'}`;
    }

    /**
     * This function put the debugger in a mode where every call to the trace function will be printed in the console
     * but also put as a turned off key in the localStorage. This helps to auto filter all update processes functions
     */
    filterStart() {
        this.__filteringMode = true;
        return 'filtering mode started';
    }

    filterEnd() {
        this.__filteringMode = false;
        this.saveDebugConfig();
        return 'filtering mode finished';
    }

    /**
     * this function checks if a specific store, action or both are allowed to be traced
     * @param store the store name
     * @param action the action name
     * @returns true if the store, action or both are allowed to be traced
     */
    isAllowedToTrace(store: string, action: string) {
        if (!this.isDebugging()) {
            return false;
        }
        const keyAction = `${action.toLowerCase()}`;
        const keyStore = `${store.toLowerCase()}`;
        const keyBoth = `${keyStore}.${keyAction}`;
        if (this.__filtered.has(keyBoth)) {
            return false;
        }
        if (this.__filtered.has(keyAction)) {
            return false;
        }
        if (this.__filtered.has(keyStore)) {
            return false;
        }
        return true;
    }

    /**
     * this functions saves the current state of debugMode and the turned off keys in the localStorage
     */
    saveDebugConfig() {
        localStorage.setItem(localStorageKey, this.__debugMode.toString());
        if (this.__filtered.size === 0) {
            localStorage.removeItem(localStorageKeyTurnedOff);
            return;
        } else {
            localStorage.setItem(localStorageKeyTurnedOff, JSON.stringify(Array.from(this.__filtered.entries())));
        }
    }
    /**
     * this function recovers the last state of debugMode and the turned off keys from the localStorage
     */
    recoverDebugMode() {
        const turnedOff = localStorage.getItem(localStorageKeyTurnedOff);
        if (turnedOff) {
            const turnedOffMap = new Map(JSON.parse(turnedOff));
            this.__filtered = turnedOffMap as Map<string, boolean>;
        }
        const debugMode = localStorage.getItem(localStorageKey);
        if (debugMode) {
            this.setDebugMode(debugMode === 'true');
        }
    }

    // auxiliar useful functions for debugging
    getBigNumberFrom(value: string | number) {
        return ethers.BigNumber.from(value);
    }

    trace(store_name:string, action: string, args: unknown[]) {
        if (this.isAllowedToTrace(store_name, action)) {
            const titlecase = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
            const eventName = `${titlecase(store_name)}.${action}()`;
            console.debug(eventName, [...args]);
        }
        if (this.__filteringMode) {
            this.filterKey(`${store_name}.${action}`, true);
        }
    }
}



export type AntelopeDebugTraceType = (message: string, ...args: unknown[]) => void;

// auxiliary tracing functions
export const createTraceFunction = (store_name: string) => function(action: string, ...args: unknown[]) {
    getAntelope().config.debug.trace(store_name, action, args);
} as AntelopeDebugTraceType;

