export type InjectedWalletLike = {
    isRabby?: boolean
    isMetaMask?: boolean
    isBraveWallet?: boolean
    isSafePal?: boolean
    _isSafePal?: boolean
    providers?: InjectedWalletLike[]
    request?: (...args: unknown[]) => Promise<unknown>
    on?: (...args: unknown[]) => unknown
    __initialized?: boolean
}

export const RABBY_RDNS = 'io.rabby';

const eip6963ByRdns = new Map<string, InjectedWalletLike>();
const discoveryListeners = new Set<() => void>();
let discoveryHooked = false;

function notifyDiscoveryListeners(): void {
    discoveryListeners.forEach((fn) => {
        try {
            fn();
        } catch {
            // listener errors must not break discovery
        }
    });
}

function onAnnounceProvider(event: Event): void {
    const detail = (event as CustomEvent).detail as {
        info?: { rdns?: string }
        provider?: InjectedWalletLike
    } | undefined;
    const rdns = detail?.info?.rdns;
    const provider = detail?.provider;
    if (!rdns || !provider) {
        return;
    }
    eip6963ByRdns.set(String(rdns), provider);
    notifyDiscoveryListeners();
}

/** Start (or re-request) EIP-6963 provider announcements. Safe to call more than once. */
export function startInjectedProviderDiscovery(onChange?: () => void): () => void {
    if (onChange) {
        discoveryListeners.add(onChange);
    }
    if (typeof window !== 'undefined') {
        if (!discoveryHooked) {
            discoveryHooked = true;
            window.addEventListener('eip6963:announceProvider', onAnnounceProvider);
        }
        window.dispatchEvent(new Event('eip6963:requestProvider'));
    }
    return () => {
        if (onChange) {
            discoveryListeners.delete(onChange);
        }
    };
}

export function findInjectedProvider(
    pred: (provider: InjectedWalletLike) => boolean,
): InjectedWalletLike | null {
    if (typeof window === 'undefined') {
        return null;
    }

    const seen = new Set<InjectedWalletLike>();
    const queue: InjectedWalletLike[] = [];
    const eth = window.ethereum as InjectedWalletLike | undefined;
    if (eth) {
        queue.push(eth);
    }
    const extraProviders = eth?.providers;
    if (Array.isArray(extraProviders)) {
        queue.push(...extraProviders);
    }
    const rabbyWin = (window as Window & { rabby?: InjectedWalletLike }).rabby;
    if (rabbyWin) {
        queue.push(rabbyWin);
    }
    for (const provider of eip6963ByRdns.values()) {
        queue.push(provider);
    }

    for (const provider of queue) {
        if (!provider || seen.has(provider)) {
            continue;
        }
        seen.add(provider);
        if (pred(provider)) {
            return provider;
        }
    }
    return null;
}

export function findRabbyProvider(): InjectedWalletLike | null {
    return findInjectedProvider(provider => !!provider.isRabby)
        ?? eip6963ByRdns.get(RABBY_RDNS)
        ?? null;
}

/** Test-only: wipe EIP-6963 cache and listeners. */
export function _resetInjectedProviderDiscovery(): void {
    eip6963ByRdns.clear();
    discoveryListeners.clear();
    if (typeof window !== 'undefined' && discoveryHooked) {
        window.removeEventListener('eip6963:announceProvider', onAnnounceProvider);
    }
    discoveryHooked = false;
}
