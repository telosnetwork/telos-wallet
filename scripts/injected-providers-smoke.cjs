#!/usr/bin/env node
// Standalone smoke for injected provider discovery (no jsdom/canvas).
const { EventEmitter } = require('events');

class FakeWindow extends EventEmitter {
    constructor() {
        super();
        this.ethereum = undefined;
        this.rabby = undefined;
    }
    addEventListener(type, fn) { this.on(type, fn); }
    removeEventListener(type, fn) { this.off(type, fn); }
    dispatchEvent(event) {
        this.emit(event.type, event);
        return true;
    }
}

function fakeProvider(flags = {}) {
    return { request() {}, on() {}, __initialized: false, ...flags };
}

function loadFresh() {
    delete require.cache[require.resolve('../src/antelope/wallets/utils/injectedProviders.ts')];
}

// ts via experimental strip or just eval by requiring compiled? use node --experimental-strip-types if available
// fallback: duplicate tiny logic check by importing after setting global window

async function main() {
    global.window = new FakeWindow();
    let mod;
    try {
        mod = require('../src/antelope/wallets/utils/injectedProviders.ts');
    } catch (e) {
        // transpile-less: run with ts-node/tsx if present
        try {
            require('tsx/cjs');
            mod = require('../src/antelope/wallets/utils/injectedProviders.ts');
        } catch (e2) {
            console.error('Cannot load TS helper', e.message, e2.message);
            process.exit(1);
        }
    }

    const {
        findRabbyProvider,
        startInjectedProviderDiscovery,
        _resetInjectedProviderDiscovery,
        RABBY_RDNS,
    } = mod;

    const assert = (cond, msg) => {
        if (!cond) {
            console.error('FAIL', msg);
            process.exit(1);
        }
        console.log('ok', msg);
    };

    _resetInjectedProviderDiscovery();
    assert(findRabbyProvider() === null, 'empty window → null');

    const rabby = fakeProvider({ isRabby: true });
    global.window.ethereum = rabby;
    assert(findRabbyProvider() === rabby, 'window.ethereum.isRabby');

    const brave = fakeProvider({ isBraveWallet: true, isMetaMask: true });
    const hiddenRabby = fakeProvider({ isRabby: true });
    global.window.ethereum = Object.assign(brave, { providers: [brave, hiddenRabby] });
    assert(findRabbyProvider() === hiddenRabby, 'providers[] when Brave owns ethereum');

    global.window.ethereum = fakeProvider({ isMetaMask: true });
    global.window.rabby = hiddenRabby;
    assert(findRabbyProvider() === hiddenRabby, 'window.rabby fallback');

    delete global.window.rabby;
    global.window.ethereum = fakeProvider({ isBraveWallet: true, isMetaMask: true });
    startInjectedProviderDiscovery();
    global.window.dispatchEvent({
        type: 'eip6963:announceProvider',
        detail: { info: { rdns: RABBY_RDNS, name: 'Rabby Wallet' }, provider: rabby },
    });
    assert(findRabbyProvider() === rabby, 'EIP-6963 announce');

    console.log('ALL PASSED');
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
