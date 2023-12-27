
// -------- Platform Store --------

const isBrowser = false;
const isBraveBrowser = false;
const isIOSMobile = false;
const isMobile = true;

const setIsBrowser = jest.fn();
const setIsBraveBrowser = jest.fn();
const setIsIOSMobile = jest.fn();
const setIsMobile = jest.fn();

const PlatformGetters = {
    isBrowser,
    isBraveBrowser,
    isIOSMobile,
    isMobile,
};

const PlatformActions = {
    setIsBrowser,
    setIsBraveBrowser,
    setIsIOSMobile,
    setIsMobile,
};

const PlatformStore = { ...PlatformGetters, ...PlatformActions };

const usePlatformStore = jest.fn().mockImplementation(() => PlatformStore);

export {
    PlatformStore,
    PlatformGetters,
    PlatformActions,
    usePlatformStore,
};

