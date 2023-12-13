
import { EthereumProvider } from 'src/antelope/types/Providers';
import { EVMAuthenticator } from 'src/antelope/wallets/authenticators/EVMAuthenticator';
import { InjectedProviderAuth } from 'src/antelope/wallets/authenticators/InjectedProviderAuth';
import { MetaKeep } from 'metakeep';
import { AntelopeError, addressString } from 'src/antelope/types';

import { ethers } from 'ethers';
import { RpcEndpoint } from 'universal-authenticator-library';
import { useFeedbackStore } from 'src/antelope/stores/feedback';

let metakeep: MetaKeep | null = null;

const name = 'MetaKeep';
export const MetaKeepAuthName = name;
export class MetaKeepAuth extends InjectedProviderAuth {

    accountAddress = '';
    accountEmail = '';

    // this is just a dummy label to identify the authenticator base class
    constructor(label = name) {
        super(label);
    }


    // InjectedProviderAuth API ------------------------------------------------------

    getProvider(): EthereumProvider | null {
        return window.ethereum as unknown as EthereumProvider ?? null;
    }

    // EVMAuthenticator API ----------------------------------------------------------

    getName(): string {
        return name;
    }

    setEmail(email: string): void {
        this.accountEmail = email;
    }

    // this is the important instance creation where we define a label to assign to this instance of the authenticator
    newInstance(label: string): EVMAuthenticator {
        this.trace('newInstance', label);
        const auth = new MetaKeepAuth(label);
        auth.setEmail(this.accountEmail);
        return auth;
    }

    async login(network: string): Promise<addressString | null> {
        this.trace('login', network);
        useFeedbackStore().setLoading(`${this.getName()}.login`);

        // const rpcNodeUrls = new Map<number, string>();
        // rpcNodeUrls.set(41, 'https://testnet.telos.net/evm');
        const rpcNodeUrls = {
            41: 'https://testnet.telos.net/evm',
        } as unknown as Map<number, string>;

        metakeep = new MetaKeep({
            // App id to configure UI
            appId: 'd190c88f-1bb5-4e16-bc48-96dbf33b77e0',
            // Default chain to use
            chainId: 41,
            // RPC node urls map
            rpcNodeUrls,
            // Signed in user's email address
            user: {
                email: this.accountEmail,
            },
        });
        console.log('metakeep', metakeep);

        await metakeep.ethereum;

        const provider = await this.web3Provider();
        this.accountAddress = await provider.getSigner().getAddress();

        useFeedbackStore().unsetLoading(`${this.getName()}.login`);

        localStorage.setItem('metakeep', JSON.stringify({
            email: this.accountEmail,
            account: this.accountAddress,
        }));

        return this.accountAddress as addressString;
    }

    async logout(): Promise<void> {
        this.trace('logout');
        localStorage.removeItem('metakeep');
        return Promise.resolve();
    }

    async isConnectedTo(chainId: string): Promise<boolean> {
        this.trace('isConnectedTo', chainId);
        return true;
    }

    async web3Provider(): Promise<ethers.providers.Web3Provider> {
        this.trace('web3Provider');
        try {
            if (metakeep) {
                const provider = await metakeep.ethereum;
                await provider.enable();
                const web3Provider = new ethers.providers.Web3Provider(provider);
                this.trace('web3Provider', '->', web3Provider);
                return web3Provider;
            } else {
                const p:RpcEndpoint = this.getChainSettings().getRPCEndpoint();
                const url = `${p.protocol}://${p.host}:${p.port}${p.path ?? ''}`;
                const jsonRpcProvider = new ethers.providers.JsonRpcProvider(url);
                await jsonRpcProvider.ready;
                const web3Provider = jsonRpcProvider as ethers.providers.Web3Provider;
                this.trace('web3Provider', '->', web3Provider);
                return web3Provider;
            }
        } catch (e) {
            console.error('web3Provider', e);
            throw e;
        }
    }

    // returns the associated account address acording to the label
    getAccountAddress(): addressString {
        // return this.userChainAccount?.chainAccount as addressString;
        return this.accountAddress as addressString;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleCatchError(error: Error): AntelopeError {
        this.trace('handleCatchError', error.message);
        if (
            (error as unknown as {status:string}).status === 'USER_REQUEST_DENIED'
        ) {
            return new AntelopeError('antelope.evm.error_transaction_canceled');
        } else {
            return new AntelopeError('antelope.evm.error_send_transaction', { error });
        }
    }
}
