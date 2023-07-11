import { shallowMount } from '@vue/test-utils';

const NETWORK = 'test-network';
const WARNING_MESSAGE = 'warning-message';

const storeMock = {
    useAccountStore: () => ({
        loginEVM: () => ({
            then: (cb: () => void) => cb(),
        }),
    }),
    useFeedbackStore: () => ({
        isLoading: () => false,
    }),
    getAntelope: () => ({
        wallets: {
            getAutenticator: () => ({
                newInstance: (label: string) => ({
                    isConnectedTo: () => Promise.resolve(label === 'logged'),
                }),
            }),
        },
    }),
    useChainStore: () => ({
        currentChain: {
            settings: {
                getNetwork: () => NETWORK,
                getChainId: () => '99',
                getDisplay: () => NETWORK,
            },
        },
        getChain: () => ({
            settings: {
                getDisplay: () => NETWORK,
            },
        }),
    }),
    useEVMStore: () => ({
        isMetamaskSupported: true,
    }),
    usePlatformStore: () => ({
        isMobile: true,
    }),
};

jest.mock('vue', () => {
    const originalVue = jest.requireActual('vue');

    const globalProps = {
        $t: jest.fn(() => 'Mocked translation'),
        $warningNotification: jest.fn(),
    };

    return {
        ...originalVue,
        getCurrentInstance: jest.fn(() => ({
            appContext: {
                config: {
                    globalProperties: globalProps,
                },
            },
        })),
        ComponentInternalInstance: originalVue.ComponentInternalInstance,
        computed: originalVue.computed,
        defineComponent: originalVue.defineComponent,
        watch: originalVue.watch,
    };
});

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

        describe('setMetamaskAuthenticator', () => {
            it('should call accountStore loginEVM method', () => {
                const methodSpy = jest.spyOn(storeMock.useAccountStore(), 'loginEVM');
                wrapper.vm.setMetamaskAuthenticator();

                const authenticator = storeMock.getAntelope().wallets.getAutenticator().newInstance('correct');
                const network = NETWORK;
                wrapper.vm.$nextTick(() => {
                    expect(methodSpy).toHaveBeenCalledWith({ authenticator, network });
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

        describe('redirectToMetamaskDownload', () => {
            it('should open a a new tab to metamask download page', () => {
                window.open = () => null;
                const methodSpy = jest.spyOn(window, 'open');

                wrapper.vm.redirectToMetamaskDownload();

                expect(methodSpy).toHaveBeenCalledWith('https://metamask.io/download/', '_blank');
            });
        });

        describe('setWalletConnectAuthenticator', () => {
            it('should call accountStore loginEVM method', () => {
                const methodSpy = jest.spyOn(storeMock.useAccountStore(), 'loginEVM');
                wrapper.vm.setWalletConnectAuthenticator();

                wrapper.vm.$nextTick(() => {
                    expect(methodSpy).toHaveBeenCalledWith(NETWORK);
                });
            });

            it('should call chain store getNetwork method', () => {
                const methodSpy = jest.spyOn(storeMock.useChainStore().currentChain.settings, 'getNetwork');

                wrapper.vm.setWalletConnectAuthenticator();

                wrapper.vm.$nextTick(() => {
                    expect(methodSpy).toHaveBeenCalled();
                });
            });

            it('if app id does not match current walletconnect network id, warning notification is called', async () => {
                jest.mock('@wagmi/core', () => wagmiMockWrongNetwork);
                wrapper = mountComponent();

                await wrapper.vm.setWalletConnectAuthenticator();

                wrapper.vm.$nextTick(() => {
                    expect(wrapper.vm.mocks.$t).toHaveBeenCalledWith('evm_wallet.incorrect_network', { network: NETWORK });
                    expect(wrapper.vm.mocks.$warningMessage).toHaveBeenCalledWith(WARNING_MESSAGE);
                });
            });
        });
    });
});
