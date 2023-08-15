import { shallowMount } from '@vue/test-utils';

import * as storeMock from 'test/jest/utils/antelope';

const WARNING_MESSAGE = 'warning-message';

import EVMLoginButtons from 'src/pages/home/EVMLoginButtons.vue';

const mountComponent = () => shallowMount(EVMLoginButtons, {
    mocks: {
        $t :  () => WARNING_MESSAGE,
        $warningNotification: jest.fn(),
    },
});

describe('EVMLoginButtons.vue', () => {

    describe('Component name', () => {
        it('should have the correct name', () => {
            expect(EVMLoginButtons.name).toBe('EVMLoginButtons');
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
                const methodSpy = jest.spyOn(storeMock.useAccountStore(), 'loginEVM');
                wrapper.vm.setMetamaskAuthenticator();
                const label = 'logged';
                const network = storeMock.MockData.Network;
                wrapper.vm.$nextTick(() => {
                    expect(methodSpy).toHaveBeenCalledWith(expect.objectContaining({
                        authenticator: expect.objectContaining({ label }),
                        network,
                    }));
                });
            });


            it('should call chain store getNetwork method', () => {
                const methodSpy = jest.spyOn(storeMock.useChainStore().currentChain.settings, 'getNetwork');

                wrapper.vm.setMetamaskAuthenticator();

                wrapper.vm.$nextTick(() => {
                    expect(methodSpy).toHaveBeenCalled();
                });
            });
        });

    });
});
