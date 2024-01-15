/**
 * Platform: This store is responsible for checking the platform on which the application
 * is running and maintaining this information for use by other stores.
 *
 * The Platform store provides a set of methods for checking various platform-specific
 * attributes, such as whether the application is running in a browser, if the user is
 * using the Brave browser, if the application is running on a mobile device, and so on.
 *
 * By maintaining this information in a centralized location, other stores can easily
 * access it without having to duplicate platform-specific checks or logic. This makes
 * it easier to develop cross-platform applications that work consistently across
 * different devices and platforms.
 *
 */


import { defineStore } from 'pinia';
import { createTraceFunction, errorToString } from 'src/antelope/config';

export interface PlatformState {
    __is_browser: boolean;
    __is_brave_browser: boolean;
    __is_ios_mobile: boolean;
    __is_mobile: boolean;
    __evm_nav_is_collapsed: boolean;
}

const store_name = 'platform';

export const usePlatformStore = defineStore(store_name, {
    state: (): PlatformState => (platformInitialState),
    getters: {
        isBrowser: state => state.__is_browser,
        isBraveBrowser: state => state.__is_brave_browser,
        isIOSMobile: state => state.__is_ios_mobile,
        isMobile: state => state.__is_mobile,
    },
    actions: {
        trace: createTraceFunction(store_name),
        init: () => {
            const platform = usePlatformStore();

            // detect brave browser
            const type_navegator = navigator as unknown as { brave?:{isBrave:()=>Promise<boolean>} };
            if (type_navegator.brave) {
                type_navegator.brave.isBrave().then((isBrave) => {
                    platform.setIsBraveBrowser(isBrave);
                });
            }

            // detect mobile
            const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i;
            platform.setIsMobile(mobileRegex.test(navigator.userAgent));

            //  used for temp exclusion from Brave Browser wallet.
            //  See https://github.com/telosnetwork/teloscan/issues/335
            platform.setIsIOSMobile((/iPhone|iPad|iPod/i).test(navigator.userAgent));

        },
        // Commits ----
        setIsBrowser(value: boolean) {
            this.trace('setIsBrowser', value);
            try {
                this.__is_browser = value;
            } catch (error) {
                console.error('Error: ', errorToString(error));
            }
        },
        setIsBraveBrowser(value: boolean) {
            this.trace('setIsBraveBrowser', value);
            try {
                this.__is_brave_browser = value;
            } catch (error) {
                console.error('Error: ', errorToString(error));
            }
        },
        setIsIOSMobile(value: boolean) {
            this.trace('setIsIOSMobile', value);
            try {
                this.__is_ios_mobile = value;
            } catch (error) {
                console.error('Error: ', errorToString(error));
            }
        },
        setIsMobile(value: boolean) {
            this.trace('setIsMobile', value);
            try {
                this.__is_mobile = value;
            } catch (error) {
                console.error('Error: ', errorToString(error));
            }
        },
        setEvmMenuIsCollapsed(value: boolean) {
            this.trace('setEvmMenuIsLeft', value);

            this.__evm_nav_is_collapsed = value;
        },
    },
});

const platformInitialState: PlatformState = {
    __is_browser: false,
    __is_brave_browser: false,
    __is_ios_mobile: false,
    __is_mobile: false,
    __evm_nav_is_collapsed: false,
};
