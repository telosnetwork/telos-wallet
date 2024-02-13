import { shallowMount } from '@vue/test-utils';

import LoginButtons from 'src/pages/home/LoginButtons.vue';
import {
    MockData,
    useChainStore,
    useAccountStore,
    CURRENT_CONTEXT,
} from 'test/jest/utils/antelope';

const WARNING_MESSAGE = 'warning-message';
const mountComponent = () => shallowMount(LoginButtons, {
    mocks: {
        $t :  () => WARNING_MESSAGE,
        $warningNotification: jest.fn(),
    },
});

jest.mock('src/antelope/chains/EVMChainSettings', () => ({}));
jest.mock('src/antelope/chains/NativeChainSettings', () => ({}));
jest.mock('src/api/price', () => ({}));
jest.mock('src/App.vue', () => ({
    isTodayBeforeTelosCloudDown: () => true,
}));
jest.mock('src/antelope', () => {
    const {
        getAntelope,
        useAccountStore,
        useChainStore,
        useFeedbackStore,
        usePlatformStore,
        CURRENT_CONTEXT,
    } = jest.requireActual('test/jest/utils/antelope');

    return {
        getAntelope,
        useAccountStore,
        useChainStore,
        useFeedbackStore,
        usePlatformStore,
        CURRENT_CONTEXT,
    };
});

describe('LoginButtons.vue', () => {
    describe('Component name', () => {
        it('should have the correct name', () => {
            expect(LoginButtons.name).toBe('LoginButtons');
        });
    });

    describe('setup methods', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let wrapper: any;
        beforeEach(() => {
            wrapper = mountComponent();
        });

        describe('setMetamaskAuthenticator', () => {
            it('should call accountStore loginEVM method 2', () => {
                const methodSpy = jest.spyOn(useAccountStore(), 'loginEVM');
                wrapper.vm.setMetamaskAuthenticator();
                const label = CURRENT_CONTEXT;
                const network = MockData.Network;
                wrapper.vm.$nextTick(() => {
                    expect(methodSpy).toHaveBeenCalledWith(expect.objectContaining({
                        authenticator: expect.objectContaining({ label }),
                        network,
                    }));
                });
            });


            it('should call chain store getNetwork method', () => {
                const methodSpy = jest.spyOn(useChainStore().currentChain.settings, 'getNetwork');

                wrapper.vm.setMetamaskAuthenticator();

                wrapper.vm.$nextTick(() => {
                    expect(methodSpy).toHaveBeenCalled();
                });
            });
        });
    });
});
