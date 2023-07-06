import { shallowMount } from '@vue/test-utils';

const NETWORK = 'test-network';
const WARNING_MESSAGE = 'warning-message';

const storeMock = {
    useAccountStore: () => ({
        loginEVM: () => jest.fn(),
    }),
    useChainStore: () => ({
        currentChain: {
            settings: {
                getNetwork: () => NETWORK,
                getChainId: () => '99',
                getDisplay: () => NETWORK,
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

const wagmiMockWrongNetwork = {
    getAccount: () => 'wagmiAccount',
    getNetwork: () =>  ({ chain: { id: 11 } }),
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

const mountComponent = () => shallowMount(ConnectWalletOptions, {
    props: {
        showWalletConnect: false,
    },
    mocks: {
        $t :  () => WARNING_MESSAGE,
        $warningNotification: jest.fn(),
    },
});

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
            wrapper = mountComponent();
        });

        describe('loginEvm', () => {
            it('should call accountStore loginEVM method', () => {
                const methodSpy = jest.spyOn(storeMock.useAccountStore(), 'loginEVM');

                wrapper.vm.loginEvm();

                wrapper.vm.$nextTick(() => {
                    expect(methodSpy).toHaveBeenCalledWith(NETWORK);
                });
            });

            it('should call chain store getNetwork method', () => {
                const methodSpy = jest.spyOn(storeMock.useChainStore().currentChain.settings, 'getNetwork');

                wrapper.vm.loginEvm();

                wrapper.vm.$nextTick(() => {
                    expect(methodSpy).toHaveBeenCalled();
                });
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

        describe('showWalletConnectModal', () => {
            it('calls openModal if not currently connected', async () => {
                const methodSpy = jest.spyOn(wrapper.vm.web3Modal, 'openModal');

                wrapper.vm.showWalletConnectModal();

                expect(methodSpy).toHaveBeenCalled();
            });

            it('calls login if already connected', async () => {
                localStorage.setItem('wagmi.connected', 'true');

                const methodSpy = jest.spyOn(wrapper.vm, 'login');

                await wrapper.vm.showWalletConnectModal();

                wrapper.vm.$nextTick(() => {
                    expect(methodSpy).toHaveBeenCalled();
                });
            });
        });

        describe('login', () => {
            it('emits "showWalletConnect"', async () => {
                await wrapper.vm.login();

                wrapper.vm.$nextTick(() => {
                    expect(wrapper.vm.emitted).toBe('showWalletConnect');
                });
            });

            it('calls loginEVM', async () => {
                const methodSpy = jest.spyOn(wrapper.vm, 'loginEvm');

                await wrapper.vm.login();

                wrapper.vm.$nextTick(() => {
                    expect(methodSpy).toHaveBeenCalled();
                });
            });

            it('if app id does not match current walletconnect network id, warning notification is called', async () => {
                jest.mock('@wagmi/core', () => wagmiMockWrongNetwork);
                wrapper = mountComponent();

                await wrapper.vm.login();

                wrapper.vm.$nextTick(() => {
                    expect(wrapper.vm.mocks.$t).toHaveBeenCalledWith('evm_wallet.incorrect_network', { network: NETWORK });
                    expect(wrapper.vm.mocks.$warningMessage).toHaveBeenCalledWith(WARNING_MESSAGE);
                });
            });
        });
    });
});
