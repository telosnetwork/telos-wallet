import { EthereumProvider } from 'src/antelope/types';
import { EVMAuthenticator, InjectedProviderAuth } from 'src/antelope/wallets';
import { findRabbyProvider } from 'src/antelope/wallets/utils/injectedProviders';

const name = 'Rabby';
export const RabbyAuthName = name;
export class RabbyAuth extends InjectedProviderAuth {

    // this is just a dummy label to identify the authenticator base class
    constructor(label = name) {
        super(label);
    }

    // InjectedProviderAuth API ------------------------------------------------------

    getProvider(): EthereumProvider | null {
        // Do not read only window.ethereum — Brave/MetaMask often occupy that
        // slot while Rabby sits on ethereum.providers, window.rabby, or EIP-6963.
        return findRabbyProvider() as EthereumProvider | null;
    }

    // EVMAuthenticator API ----------------------------------------------------------

    getName(): string {
        return name;
    }

    // this is the important instance creation where we define a label to assign to this instance of the authenticator
    newInstance(label: string): EVMAuthenticator {
        this.trace('newInstance', label);
        return new RabbyAuth(label);
    }

}
