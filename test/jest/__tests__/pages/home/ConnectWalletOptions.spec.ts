/* eslint-disable jest/no-disabled-tests */
import { shallowMount } from '@vue/test-utils';

const storeMock = {
    useAccountStore: () => ({
        loginEVM: () => jest.fn(),
    }),
    useChainStore: () => ({
        currentChain: {
            settings: {
                getNetwork: () => 'test-network',
                getChainId: () => '99',
                getDisplay: () => 'TEST-ID',
            },
        },
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
    getNetwork: () =>  ({ chain: { id: 99 } }),
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

        describe('toggleWalletConnectModal', () => {
            it('calls openModal if not currently connected', async () => {
                const methodSpy = jest.spyOn(wrapper.vm.web3Modal, 'openModal');

                wrapper.vm.toggleWalletConnectModal();

                expect(methodSpy).toHaveBeenCalled();
            });

            it('calls login if already connected', async () => {
                localStorage.setItem('wagmi.connected', 'true');

                const methodSpy = jest.spyOn(wrapper.vm, 'login');

                await wrapper.vm.toggleWalletConnectModal();

                wrapper.vm.$nextTick(() => {
                    expect(methodSpy).toHaveBeenCalled();
                });
            });
        });
    });
});
