/* eslint-disable jest/no-disabled-tests */
import { shallowMount } from '@vue/test-utils';

const storeMock = {
    useAccountStore: () => ({
        loginEVM: () => jest.fn(),
    }),
    useChainStore: () => ({
        currentChain: { settings: { getNetwork: () => 'test-network' } },
    }),
    useEVMStore: () => ({
        isMetamaskSupported: true,
    }),
    usePlatformStore: () => ({
        isMobile: true,
    }),
};

const wagmiMock = {
    getAccount: () => 'wagmiAccount',
};

const web3ModalMock = {
    Web3Modal: class {
        openModal() {
            return 'open';
        }
        subscribeModal() {
            return null;
        }
    },
};

import ConnectWalletOptions from 'src/pages/home/ConnectWalletOptions.vue';
import { nextTick } from 'vue';

jest.mock('src/antelope', () => storeMock);
jest.mock('@wagmi/core', () => wagmiMock);
jest.mock('@web3modal/html', () => web3ModalMock);

describe('ConnectWalletOptions.vue', () => {

    describe('Component name', () => {
        it('should have the correct name', () => {
            expect(ConnectWalletOptions.name).toBe('ConnectWalletOptions');
        });
    });

    describe('setup methods', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let wrapper: any;
        beforeEach(() => {
            wrapper = shallowMount(ConnectWalletOptions, {
                props: {
                    toggleWalletConnect: false,
                },
                provide: {
                    '$wagmi': null,
                },
            });
        });

        describe('loginEvm', () => {
            it.skip('should call accountStore loginEVM method', () => {
                const methodSpy = jest.spyOn(storeMock.useAccountStore(), 'loginEVM');

                wrapper.vm.loginEvm();

                expect(methodSpy).toHaveBeenCalled();
            });

            it.skip('should call chain store getNetwork method', () => {
                const methodSpy = jest.spyOn(storeMock.useChainStore().currentChain.settings, 'getNetwork');

                wrapper.vm.loginEvm();

                expect(methodSpy).toHaveBeenCalled();
            });
        });

        describe('redirectToMetamaskDownload', () => {
            it('should open a a new tab to metamask download page', () => {
                window.open = () => null;
                const methodSpy = jest.spyOn(window, 'open');

                wrapper.vm.redirectToMetamaskDownload();

                expect(methodSpy).toHaveBeenCalledWith('https://metamask.io/download/', '_blank');
            });
        });

        describe('connectToWalletConnect', () => {
            it('calls openModal if web3Modal is instantiated', () => {
                const methodSpy = jest.spyOn(wrapper.vm.web3Modal, 'openModal');

                wrapper.vm.connectToWalletConnect();

                expect(methodSpy).toHaveBeenCalled();
            });

            it('returns if web3modal is undefined', () => {
                wrapper.vm.web3Modal = undefined;
                const methodSpy = jest.spyOn(wrapper.vm, 'connectToWalletConnect');

                wrapper.vm.connectToWalletConnect();

                expect(methodSpy).toHaveReturned();
            });
        });
    });
});
