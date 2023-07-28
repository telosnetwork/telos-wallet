import { isTracingAll } from 'src/antelope/stores/feedback';
import { useFeedbackStore } from 'src/antelope/stores/feedback';
import { createTraceFunction } from 'src/antelope/stores/feedback';
import { EVMAuthenticator } from 'src/antelope/wallets/authenticators/EVMAuthenticator';

const name = 'AntelopeWallets';

export class AntelopeWallets {

    private trace: (message: string, ...args: unknown[]) => void;
    private authenticators: Map<string, EVMAuthenticator> = new Map();
    constructor() {
        this.trace = createTraceFunction(name);
    }

    init() {
        useFeedbackStore().setDebug(name, isTracingAll());
    }

    addEVMAuthenticator(authenticator: EVMAuthenticator) {
        this.trace('addEVMAuthenticator', authenticator.getName(), authenticator);
        this.authenticators.set(authenticator.getName(), authenticator);
    }

    getAutenticator(name: string) {
        this.trace('getAutenticator', name);
        return this.authenticators.get(name);
    }
}

export * from 'src/antelope/wallets/authenticators/EVMAuthenticator';
export * from 'src/antelope/wallets/authenticators/InjectedProviderAuth';
export * from 'src/antelope/wallets/authenticators/MetamaskAuth';
export * from 'src/antelope/wallets/authenticators/SafePalAuth';
export * from 'src/antelope/wallets/authenticators/WalletConnectAuth';
