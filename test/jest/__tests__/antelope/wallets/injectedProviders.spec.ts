import { jest } from '@jest/globals';
import {
    findInjectedProvider,
    findRabbyProvider,
    startInjectedProviderDiscovery,
    _resetInjectedProviderDiscovery,
    RABBY_RDNS,
} from 'src/antelope/wallets/utils/injectedProviders';

function fakeProvider(flags: Record<string, unknown> = {}) {
    return {
        request: jest.fn(),
        on: jest.fn(),
        __initialized: false,
        ...flags,
    };
}

describe('injectedProviders', () => {
    const originalEthereum = (window as { ethereum?: unknown }).ethereum;

    beforeEach(() => {
        _resetInjectedProviderDiscovery();
        delete (window as { ethereum?: unknown }).ethereum;
        delete (window as { rabby?: unknown }).rabby;
    });

    afterAll(() => {
        (window as { ethereum?: unknown }).ethereum = originalEthereum;
        _resetInjectedProviderDiscovery();
    });

    it('returns null when nothing is injected', () => {
        expect(findRabbyProvider()).toBeNull();
    });

    it('finds Rabby on window.ethereum.isRabby', () => {
        const rabby = fakeProvider({ isRabby: true });
        (window as { ethereum?: unknown }).ethereum = rabby;
        expect(findRabbyProvider()).toBe(rabby);
    });

    it('finds Rabby in window.ethereum.providers when Brave owns window.ethereum', () => {
        const brave = fakeProvider({ isBraveWallet: true, isMetaMask: true });
        const rabby = fakeProvider({ isRabby: true });
        (window as { ethereum?: unknown }).ethereum = {
            ...brave,
            providers: [brave, rabby],
        };
        expect(findRabbyProvider()).toBe(rabby);
        expect(findInjectedProvider(p => !!p.isBraveWallet)).toBeTruthy();
    });

    it('finds window.rabby when ethereum is another wallet', () => {
        const metamask = fakeProvider({ isMetaMask: true });
        const rabby = fakeProvider({ isRabby: true });
        (window as { ethereum?: unknown }).ethereum = metamask;
        (window as { rabby?: unknown }).rabby = rabby;
        expect(findRabbyProvider()).toBe(rabby);
    });

    it('finds Rabby from EIP-6963 announce', () => {
        const rabby = fakeProvider({ isRabby: true });
        startInjectedProviderDiscovery();
        window.dispatchEvent(new CustomEvent('eip6963:announceProvider', {
            detail: {
                info: { rdns: RABBY_RDNS, name: 'Rabby Wallet' },
                provider: rabby,
            },
        }));
        expect(findRabbyProvider()).toBe(rabby);
    });

    it('does not treat Brave/MetaMask as Rabby', () => {
        (window as { ethereum?: unknown }).ethereum = fakeProvider({
            isBraveWallet: true,
            isMetaMask: true,
        });
        expect(findRabbyProvider()).toBeNull();
    });
});
