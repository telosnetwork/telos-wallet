/* eslint-disable indent */
/**
 * Feedback: This store is meant to be used as a utility store to give feedback
 * to the user about the internal state of the app and that includes:
 *
 * Loadings: by default, all async action-functions would call setLoading and
 * unsetLoading to keep track of the time from the call to the end of the function.
 * This is meant to show a loading icon to the user and can be used with custom
 * names instead of action names.
 *
 * Errors: all other stores can call setError and unsetError to keep track of errors
 * that happened inside the store. Each error will be identified by a name and
 * a message (in the current language). There will be special names which will
 * trigger a special behavior, like "notify.success" poping up a notification to the user
 * or "console.error" which will trigger console error log. This is ment to show
 * a error messages or any notification to the user and can be used with custom
 * names for custom handlers. The app can set custom handlers for each error name
 *
 * Progress: this is meant to show a progress bar to the user. It will be used to
 * show the progress of a long-running task, like a steps transaction (like a bridge
 * between blockchains) or a file upload, etc.
 *
*/

import { defineStore } from 'pinia';
import { getAntelope } from 'src/antelope';
import { toRaw } from 'vue';


// auxiliary tracing functions
export const createTraceFunction = (store_name: string) => function(action: string, ...args: unknown[]) {
    if (useFeedbackStore().isDebugging(store_name)) {
        const titlecase = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
        const eventName = `${titlecase(store_name)}.${action}()`;
        console.debug(eventName, [...args]);
    }
};


// only if we are NOT in production mode search in the url for the trace flag
// to turn on the Antelope trace mode
let trace = false;
if (process.env.NODE_ENV !== 'production') {
    const urlParams = new URLSearchParams(window.location.search);
    trace = urlParams.get('trace') === 'true';
}
export const isTracingAll = () => trace;
export const createInitFunction = (store_name: string, debug?: boolean) => function() {
    useFeedbackStore().setDebug(store_name, debug ?? isTracingAll());
};

// -------------------------------------------


export interface FeedbackProggress {
    percent: number;
    message: string;
}

export interface FeedbackState {
    // a list of loading names used inside async functions
    __loading: string[];
    // error messages is a map of error name and error message
    __errors: Map<string, string>;
    // progress is a map of processes name and progress value
    __processes: Map<string, FeedbackProggress>;
    // debug flags for each store
    __debug: Map<string, boolean>;
}

const store_name = 'feedback';

export const useFeedbackStore = defineStore(store_name, {
    state: (): FeedbackState => (feedbackiInitialState),
    getters: {
        getLoadings: state => state.__loading,
        isLoading: state => (name: string) => state.__loading.includes(name),
        getErrors: state => state.__errors,
        getErrorMessage: state => (name: string) => state.__errors.get(name),
        getProcesses: state => state.__processes,
        getProgress: state => (name: string) => state.__processes.get(name),
    },
    actions: {
        trace: createTraceFunction(store_name),
        init: createInitFunction(store_name),
        // Loading ----
        setLoading(name: string) {
            if (!this.__loading.includes(name)) {
                this.__loading.push(name);
            }
            this.trace('setLoading', name, 'list:', [...toRaw(this.__loading)]);
        },
        unsetLoading(name: string) {
            const index = this.__loading.indexOf(name);
            if (index > -1) {
                this.__loading.splice(index, 1);
            }
            this.trace('unsetLoading', name, 'list:', [...toRaw(this.__loading)]);
        },
        // Error ----
        setError(name: string, message: string) {
            this.__errors.set(name, message);
            getAntelope().events.onErrorMessage.next({ name, message });
        },
        unsetError(name: string) {
            this.__errors.delete(name);
        },
        // Progress ----
        setProgress(name: string, percent: number, message: string) {
            this.__processes.set(name, { percent, message });
        },
        unsetProgress(name: string) {
            this.__processes.delete(name);
        },
        // Debug mode ----
        setDebug(store_name: string, value: boolean) {
            this.__debug.set(store_name, value);
        },
        isDebugging(store_name: string) {
            return this.__debug.get(store_name) || false;
        },
    },
});

const feedbackiInitialState: FeedbackState = {
    __loading: [],
    __errors: new Map(),
    __processes: new Map(),
    __debug: new Map(),
};


