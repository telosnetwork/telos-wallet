/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Authenticator,
    Chain,
    UALError,
    UALErrorType,
    User,
} from 'universal-authenticator-library';
import { JsonRpc } from 'eosjs';
import { SignTransactionResponse } from 'universal-authenticator-library/dist/interfaces';
import { MetaKeep } from 'metakeep';
import axios from 'axios';
import { APIClient, Serializer } from '@greymass/eosio';

const Logo = 'data:image/svg+xml,%3C%3Fxml version=\'1.0\' %3F%3E%3Csvg height=\'24\' version=\'1.1\' width=\'24\' xmlns=\'http://www.w3.org/2000/svg\' xmlns:cc=\'http://creativecommons.org/ns%23\' xmlns:dc=\'http://purl.org/dc/elements/1.1/\' xmlns:rdf=\'http://www.w3.org/1999/02/22-rdf-syntax-ns%23\'%3E%3Cg transform=\'translate(0 -1028.4)\'%3E%3Cpath d=\'m3 1030.4c-1.1046 0-2 0.9-2 2v7 2 7c0 1.1 0.8954 2 2 2h9 9c1.105 0 2-0.9 2-2v-7-2-7c0-1.1-0.895-2-2-2h-9-9z\' fill=\'%232c3e50\'/%3E%3Cpath d=\'m3 1049.4c-1.1046 0-2-0.9-2-2v-7-2-3h22v3 2 7c0 1.1-0.895 2-2 2h-9-9z\' fill=\'%2334495e\'/%3E%3Cpath d=\'m4 1032.9v1.1l2 2.4-2 2.3v1.1l3-3.4-3-3.5z\' fill=\'%23ecf0f1\'/%3E%3Cpath d=\'m3 2c-1.1046 0-2 0.8954-2 2v7 2 3h22v-3-2-7c0-1.1046-0.895-2-2-2h-9-9z\' fill=\'%2334495e\' transform=\'translate(0 1028.4)\'/%3E%3Cpath d=\'m4 5.125v1.125l3 1.75-3 1.75v1.125l5-2.875-5-2.875zm5 4.875v1h5v-1h-5z\' fill=\'%23ecf0f1\' transform=\'translate(0 1028.4)\'/%3E%3C/g%3E%3C/svg%3E';

export interface MetakeepOptions {
    appId: string;
    appName: string;
    rpc?: JsonRpc;
}
let metakeep: MetaKeep | null = null;
// credentials
interface MetakeepData {
    [email:string]: {
        [chainId:string]: {
            accounts: string[];
            wallet: {
                eosAddress: string;
                solAddress: string;
                ethAddress: string;
            }
        }
    }
}


export class MetakeepAuthenticator extends Authenticator {
    private chainId: string;
    private rpc: JsonRpc;
    private accountEmail: string;
    private cache: MetakeepData = {};
    private appId: string;

    constructor(chains: Chain[], options: MetakeepOptions) {
        super(chains, options);
        this.chainId = chains[0].chainId;
        const [chain] = chains;
        const [rpc] = chain.rpcEndpoints;

        if (options && options.rpc) {
            this.rpc = options.rpc;
        } else {
            this.rpc = new JsonRpc(`${rpc.protocol}://${rpc.host}:${rpc.port}`);
        }
        if (!options?.appId) {
            throw new Error('MetakeepAuthenticator: Missing appId');
        }
        this.appId = options.appId;
        this.chains = chains;
        this.accountEmail = '';
        try {
            this.accountEmail = window.localStorage.getItem('metakeep.logged') ?? '';
        } catch (error) {
            console.error('error', error);
        }

        try {
            this.cache = JSON.parse(window.localStorage.getItem('metakeep.data') || '{}');
        } catch (error) {
            console.error('error', error);
        }
    }

    saveCache() {
        try {
            window.localStorage.setItem('metakeep.data', JSON.stringify(this.cache));
        } catch (error) {
            console.error('error', error);
        }
    }

    async init() {
        //this.users = await this.login();
    }

    setEmail(email: string): void {
        this.accountEmail = email;
        window.localStorage.setItem('metakeep.logged', email);
    }

    /**
     * Resets the authenticator to its initial, default state then calls init method
     */
    reset() {
        this.init();
    }

    /**
     * Returns true if the authenticator has errored while initializing.
     */
    isErrored() {
        return false;
    }

    getName() {
        return 'metakeep_native';
    }

    /**
     * Returns a URL where the user can download and install the underlying authenticator
     * if it is not found by the UAL Authenticator.
     */
    getOnboardingLink() {
        return 'https://developers.eos.io/manuals/eos/latest/cleos/index';
    }

    /**
     * Returns error (if available) if the authenticator has errored while initializing.
     */
    getError(): UALError | null {
        return null;
    }

    /**
     * Returns true if the authenticator is loading while initializing its internal state.
     */
    isLoading() {
        return false;
    }

    /**
     * Returns the style of the Button that will be rendered.
     */
    getStyle() {
        return {
            // An icon displayed to app users when selecting their authentication method
            icon: Logo,
            // Name displayed to app users
            text: 'metakeep',
            // Background color displayed to app users who select your authenticator
            background: '#030238',
            // Color of text used on top the `backgound` property above
            textColor: '#FFFFFF',
        };
    }

    /**
     * Returns whether or not the button should render based on the operating environment and other factors.
     * ie. If your Authenticator App does not support mobile, it returns false when running in a mobile browser.
     */
    shouldRender() {
        return false;
    }

    /**
     * Returns whether or not the dapp should attempt to auto login with the Authenticator app.
     * Auto login will only occur when there is only one Authenticator that returns shouldRender() true and
     * shouldAutoLogin() true.
     */
    shouldAutoLogin() {
        return true;
    }

    /**
     * Returns whether or not the button should show an account name input field.
     * This is for Authenticators that do not have a concept of account names.
     */
    async shouldRequestAccountName() {
        return false;
    }


    async createAccount(publicKey: string): Promise<string> {
        return axios.post(`${this.rpc.endpoint}/v1/accounts/random`, {
            ownerKey: publicKey,
            activeKey: publicKey,
        }).then(response => response.data.accountName);
    }

    resolveAccountName() {
        console.log('resolveAccountName() ');
        return new Promise<string>(async (resolve, reject) => {
            let accountName = '';
            if (!metakeep) {
                return reject(new Error('metakeep is not initialized'));
            }
            if (this.accountEmail === '') {
                return reject(new Error('No account email'));
            }
            // we check if we have the account name in the cache
            console.log('resolveAccountName() ', this.cache);
            const data = this.cache[this.accountEmail];
            if (data) {
                accountName = data[this.chainId]?.accounts[0];
                if (accountName) {
                    console.log('resolveAccountName() from cache -->', accountName);
                    resolve(accountName);
                    return;
                }
            }

            // if not, we fetch all the accounts for the email
            console.log('resolveAccountName() getting credentials...');
            const credentials = await metakeep.getWallet();
            const publicKey = credentials.wallet.eosAddress;

            this.cache[this.accountEmail] = {
                [this.chainId]: {
                    accounts: [],
                    wallet: credentials.wallet,
                },
            };

            console.log('resolveAccountName() ', this.cache);

            try {
                // we try to get the account name from the public key
                const response = await axios.post(`${this.rpc.endpoint}/v1/history/get_key_accounts`, {
                    public_key: publicKey,
                });
                console.log('resolveAccountName() get_key_accounts: ', response);
                const accountExists = response?.data?.account_names.length>0;
                if (accountExists) {
                    accountName = response.data.account_names[0];
                } else {
                    accountName = await this.createAccount(publicKey);
                }
                this.cache[this.accountEmail][this.chainId].accounts.push(accountName);
                this.saveCache();
                return resolve(accountName);
            } catch (error) {
                console.error('error', error);
                throw new Error('Error getting account name');
            }
        });
    }

    /**
     * Login using the Authenticator App. This can return one or more users depending on multiple chain support.
     *
     * @param accountName    The account name of the user for Authenticators that do not store accounts (optional)
     */
    login: () => Promise<[User]> = async () => {
        console.error('login');
        if (this.accountEmail === '') {
            console.error('No account email');
            throw new Error('No account email');
        }

        console.log('Tenemos mail: ', this.accountEmail);

        metakeep = new MetaKeep({
            // App id to configure UI
            appId: this.appId,
            // Signed in user's email address
            user: {
                email: this.accountEmail,
            },
        });

        const accountName = await this.resolveAccountName();
        const publicKey = this.cache[this.accountEmail][this.chainId].wallet.eosAddress;

        try {
            const permission = 'active';
            return [
                new MetakeepUser({
                    accountName,
                    permission,
                    publicKey,
                    chainId: this.chainId,
                    rpc: this.rpc,
                }),
            ];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            throw new UALError(err.messsage, UALErrorType.Login, err, 'MetakeepAuthenticator');
        }
    };

    /**
     * Logs the user out of the dapp. This will be strongly dependent on each
     * Authenticator app's patterns.
     */
    logout = async (): Promise<void> => {
        window.localStorage.removeItem('accountEmail');
        window.localStorage.removeItem('accountName');
        window.localStorage.removeItem('permission');
        window.localStorage.removeItem('publicKey');
        window.localStorage.removeItem('metakeep.logged');
        return;
    };

    /**
     * Returns true if user confirmation is required for `getKeys`
     */
    requiresGetKeyConfirmation() {
        return false;
    }
}

// ------------------------------------------------------


class MetakeepUser extends User {
    private keys: string[];
    private accountName: string;
    private permission: string;
    private chainId: string;
    rpc: JsonRpc;
    constructor({
        accountName,
        permission,
        publicKey,
        chainId,
        rpc,
    }: {
            accountName: string,
            permission: string,
            publicKey: string,
            chainId: string,
            rpc: JsonRpc,
    }) {
        super();
        this.keys = [publicKey];
        this.accountName = accountName;
        this.permission = permission;
        this.chainId = chainId;
        this.rpc = rpc;
    }

    protected eosioCore: APIClient = new APIClient({ url: 'https://testnet.telos.net' });


    async serializeActionData(account: string, name: string, data: unknown): Promise<string> {
        const { abi } = await this.eosioCore.v1.chain.get_abi(account);
        if (!abi) {
            throw new Error(`No ABI for ${account}`);
        }

        const { hexString } = Serializer.encode({ object: data, abi, type: name });
        return hexString;
    }


    /**
    * @param transaction    The transaction to be signed (a object that matches the RpcAPI structure).
    */
    signTransaction = async (transaction: any): Promise<SignTransactionResponse> => {
        console.log('transaction', transaction);
        if (!metakeep) {
            throw new Error('metakeep is not initialized');
        }

        const info = await this.eosioCore.v1.chain.get_info();
        const ref_block_num = info.last_irreversible_block_num.toNumber();
        const block = await this.eosioCore.v1.chain.get_block(info.last_irreversible_block_num);
        const ref_block_prefix = block.ref_block_prefix.toNumber();
        const action = transaction.actions[0];

        const serializedData = await this.serializeActionData(action.account, action.name, action.data);
        action.data = serializedData;

        const expiration = new Date(Date.now() + 120000).toISOString().split('.')[0];

        const complete_transaction = {
            'transactionObject': {
                'rawTransaction': {
                    'expiration': expiration,
                    'ref_block_num': ref_block_num,
                    'ref_block_prefix': ref_block_prefix,
                    'max_net_usage_words': 0,
                    'max_cpu_usage_ms': 0,
                    'delay_sec': 0,
                    'context_free_actions': [],
                    'actions': [action],
                    'transaction_extensions': [],
                },
                'extraSigningData': {
                    // If chainId is part of the signature generation,
                    // send it inside extraSigningData field.
                    'chainId': '1eaa0824707c8c16bd25145493bf062aecddfeb56c736f6ba6397f3195f33c9f', // TESTNET
                },
            },
            'reason': 'test',
        };

        console.log('await metakeep.signTransactio()...', complete_transaction);
        const response = await metakeep.signTransaction(complete_transaction, 'TESTING_REASONS');


        console.log('response', response);

        return this.returnEosjsTransaction(false, {});
    };

    /**
     * @param publicKey     The public key to use for signing.
     * @param data                The data to be signed.
     * @param helpText        Help text to explain the need for arbitrary data to be signed.
     *
     * @returns                     The signature
     */
    signArbitrary = async (): Promise<string> => {
        throw new Error('cleos does not support signing arbitrary data');
    };

    /**
     * @param challenge     Challenge text sent to the authenticator.
     *
     * @returns                     Whether the user owns the private keys corresponding with provided public keys.
     */
    async verifyKeyOwnership() {
        return true;
    }

    getAccountName = async (): Promise<string> => this.accountName;

    getAccountPermission = async (): Promise<string> => this.permission;

    getChainId = async (): Promise<string> => this.chainId;

    getKeys = async (): Promise<string[]> => this.keys;
}


