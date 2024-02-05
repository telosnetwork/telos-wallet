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
import { APIClient, NameType, PackedTransaction, Serializer, Transaction } from '@greymass/eosio';
import { metakeepCache } from 'src/antelope/wallets/ual/utils/metakeep-cache';

export interface UserCredentials {
    email: string;
    jwt: string;
}

export interface MetakeepUALOptions {
    appId: string;
    appName: string;
    rpc?: JsonRpc;
    accountCreateAPI: string;
    reasonCallback?: (transaction: any) => string;
}
let metakeep: MetaKeep | null = null;
const metakeep_name = 'metakeep.ual';

// This interface is used to store the data in the local cache
export interface MetakeepData {
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

const metakeepDefaultAccountSelector: MetakeepAccountSelector = {
    selectAccount: (accounts: string[]) => Promise.resolve(accounts[0]),
};

const metakeepDefaultAccountNameSelector: MetakeepNameAccountSelector = {
    selectAccountName: () => Promise.resolve(''),
};

export interface MetakeepAccountSelector {
    selectAccount: (accounts: string[]) => Promise<string>;
}

export interface MetakeepNameAccountSelector {
    selectAccountName: () => Promise<string>;
}

export class MetakeepAuthenticator extends Authenticator {
    private chainId: string;
    private rpc: JsonRpc;
    private accountCreateAPI: string;
    private appId: string;
    private loading = false;
    private userCredentials: UserCredentials = { email: '', jwt: '' };

    private accountSelector: MetakeepAccountSelector = metakeepDefaultAccountSelector;
    private accountNameSelector: MetakeepNameAccountSelector = metakeepDefaultAccountNameSelector;

    constructor(chains: Chain[], options: MetakeepUALOptions) {
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
        this.accountCreateAPI = options.accountCreateAPI;
        this.chains = chains;
        this.userCredentials = {
            email: metakeepCache.getLogged() ?? '',
            jwt: '',
        };
    }

    resetAccountSelector() {
        this.accountSelector = metakeepDefaultAccountSelector;
    }

    setAccountSelector(accountSelector: MetakeepAccountSelector) {
        this.accountSelector = accountSelector;
    }

    setAccountNameSelector(accountNameSelector: MetakeepNameAccountSelector) {
        this.accountNameSelector = accountNameSelector;
    }

    saveCache() {
        metakeepCache.saveCache();
    }

    async init() {
        //
    }

    setUserCredentials(credentials: UserCredentials): void {
        this.userCredentials = credentials;
        metakeepCache.setLogged(credentials.email);
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
        return metakeep_name;
    }

    /**
     * Returns a URL where the user can download and install the underlying authenticator
     * if it is not found by the UAL Authenticator.
     */
    getOnboardingLink() {
        return '';
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
        return this.loading;
    }

    /**
     * Returns the style of the Button that will be rendered.
     */
    getStyle() {
        return {
            // An icon displayed to app users when selecting their authentication method
            icon: 'no-icon',
            // Name displayed to app users
            text: metakeep_name,
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
        return true;
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
        const suggestedName = await this.accountNameSelector.selectAccountName();
        // console.log('publicKey', publicKey);
        // return suggestedName;
        return axios.post(this.accountCreateAPI, {
            ownerKey: publicKey,
            activeKey: publicKey,
            jwt: this.userCredentials.jwt,
            suggestedName: suggestedName,
        }).then(response => response.data.accountName);
    }

    resolveAccountName() {
        return new Promise<string>(async (resolve, reject) => {
            let accountName = '';
            if (!metakeep) {
                return reject(new Error('metakeep is not initialized'));
            }
            if (this.userCredentials.email === '') {
                return reject(new Error('No account email'));
            }

            // we check if we have the account name in the cache
            const accountNames = metakeepCache.getAccountNames(this.userCredentials.email, this.chainId);
            if (accountNames.length > 0) {
                if (accountNames.length > 1) {
                    // if we have more than one account, we ask the user to select one using this callback
                    const selectedAccount = await this.accountSelector.selectAccount(accountNames);
                    this.resetAccountSelector();
                    metakeepCache.setSelectedAccountName(this.userCredentials.email, this.chainId, selectedAccount);
                    return resolve(selectedAccount);
                } else {
                    return resolve(accountNames[0]);
                }
            }

            // if not, we fetch all the accounts for the email
            const credentials = await metakeep.getWallet();
            const publicKey = credentials.wallet.eosAddress;
            console.log('publicKey', publicKey);

            metakeepCache.addCredentials(this.userCredentials.email, credentials.wallet);

            try {
                // we try to get the account name from the public key
                const response = await axios.post(`${this.rpc.endpoint}/v1/history/get_key_accounts`, {
                    public_key: publicKey,
                });
                const accountExists = response?.data?.account_names.length>0;
                let names:string[] = [];

                if (accountExists) {
                    names = response.data.account_names;
                    names.forEach(name => metakeepCache.addAccountName(this.userCredentials.email, this.chainId, name));
                    if (names.length > 1) {
                        // if we have more than one account, we ask the user to select one using this callback
                        accountName = await this.accountSelector.selectAccount(names);
                        this.resetAccountSelector();
                    } else {
                        accountName = names[0];
                    }
                    metakeepCache.setSelectedAccountName(this.userCredentials.email, this.chainId, accountName);
                } else {
                    accountName = await this.createAccount(publicKey);
                    metakeepCache.addAccountName(this.userCredentials.email, this.chainId, accountName);
                    names = [accountName];
                }

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
        if (this.userCredentials.email === '') {
            throw new Error('No account email');
        }

        this.loading = true;

        metakeep = new MetaKeep({
            // App id to configure UI
            appId: this.appId,
            // Signed in user's email address
            user: {
                email: this.userCredentials.email,
            },
        });

        const accountName = await this.resolveAccountName();
        const publicKey = metakeepCache.getEosAddress(this.userCredentials.email);

        try {
            const permission = 'active';
            this.loading = false;
            const userInstance = new MetakeepUser({
                accountName,
                permission,
                publicKey,
                chainId: this.chainId,
                rpc: this.rpc,
                accountCreateAPI: this.accountCreateAPI,
            });

            return [userInstance];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            this.loading = false;
            throw new UALError(err.messsage, UALErrorType.Login, err, 'MetakeepAuthenticator');
        }
    };

    /**
     * Logs the user out of the dapp. This will be strongly dependent on each
     * Authenticator app's patterns.
     */
    logout = async (): Promise<void> => {
        metakeepCache.setLogged(null);
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
    private reasonCallback?: (transaction: any) => string;

    rpc: JsonRpc;
    protected eosioCore: APIClient;
    protected accountCreateAPI: string;
    constructor({
        accountName,
        permission,
        publicKey,
        chainId,
        rpc,
        accountCreateAPI,
    }: {
            accountName: string,
            permission: string,
            publicKey: string,
            chainId: string,
            rpc: JsonRpc,
            accountCreateAPI: string,
    }) {
        super();
        this.keys = [publicKey];
        this.accountName = accountName;
        this.permission = permission;
        this.chainId = chainId;
        this.rpc = rpc;
        this.accountCreateAPI = accountCreateAPI;
        this.eosioCore = new APIClient({ url: rpc.endpoint });
    }

    setReasonCallback(callback: (transaction: any) => string) {
        this.reasonCallback = callback;
    }

    handleCatchError(error: any): Error {
        if (
            (error as unknown as {status:string}).status === 'USER_REQUEST_DENIED'
        ) {
            return new Error('antelope.evm.error_transaction_canceled');
        } else {
            return new Error('antelope.evm.error_send_transaction');
        }
    }

    /**
    * @param transaction    The transaction to be signed (a object that matches the RpcAPI structure).
    */
    signTransaction = async (originalTransaction: any, options: any = {}): Promise<SignTransactionResponse> => {
        if (!metakeep) {
            throw new Error('metakeep is not initialized');
        }

        try {
            // expire time in seconds
            const expireSeconds = 120;

            // Retrieve transaction headers
            const info = await this.eosioCore.v1.chain.get_info();
            const header = info.getTransactionHeader(expireSeconds);

            // collect all contract abis
            const abi_promises = originalTransaction.actions.map((a: { account: NameType; }) =>
                this.eosioCore.v1.chain.get_abi(a.account),
            );
            const responses = await Promise.all(abi_promises);
            const abis = responses.map(x => x.abi);
            const abis_and_names = originalTransaction.actions.map((x: { account: any; }, i: number) => ({
                contract: x.account,
                abi: abis[i],
            }));

            // create complete well formed transaction
            const transaction = Transaction.from(
                {
                    ...header,
                    actions: originalTransaction.actions,
                },
                abis_and_names,
            );

            const transaction_extensions = originalTransaction.transaction_extensions ?? [] as string[];
            const context_free_actions = originalTransaction.context_free_actions ?? [] as string[];
            const delay_sec = originalTransaction.delay_sec ?? 0;
            const max_cpu_usage_ms = originalTransaction.max_cpu_usage_ms ?? 0;
            const max_net_usage_words = originalTransaction.max_net_usage_words ?? 0;
            const expiration = originalTransaction.expiration ?? transaction.expiration.toString();
            const ref_block_num = originalTransaction.ref_block_num ?? transaction.ref_block_num.toNumber();
            const ref_block_prefix = originalTransaction.ref_block_prefix ?? transaction.ref_block_prefix.toNumber();

            // convert actions to JSON
            const actions = transaction.actions.map(a => ({
                account: a.account.toJSON(),
                name: a.name.toJSON(),
                authorization: a.authorization.map((x: { actor: any; permission: any; }) => ({
                    actor: x.actor.toJSON(),
                    permission: x.permission.toJSON(),
                })),
                data: a.data.toJSON(),
            }));

            // compose the complete transaction
            const complete_transaction = {
                rawTransaction: {
                    expiration,
                    ref_block_num,
                    ref_block_prefix,
                    max_net_usage_words,
                    max_cpu_usage_ms,
                    delay_sec,
                    context_free_actions,
                    actions,
                    transaction_extensions,
                },
                extraSigningData: {
                    chainId: this.chainId,
                },
            };

            console.log('MetakeepUAL -- originalTransaction:', originalTransaction);
            console.log('MetakeepUAL -- complete_transaction:', complete_transaction);

            // sign the transaction with metakeep
            const reason = this.reasonCallback ? this.reasonCallback(originalTransaction) : 'sign this transaction';
            console.log('MetakeepUAL -- metakeep.signTransaction()...');
            const response = await metakeep.signTransaction(complete_transaction, reason);
            const signature = response.signature;

            console.log('MetakeepUAL -- reason:', reason);
            console.log('MetakeepUAL -- signature:', signature);

            // Pack the transaction for transport
            const packedTransaction = PackedTransaction.from({
                signatures: [signature],
                packed_context_free_data: '',
                packed_trx: Serializer.encode({ object: transaction }),
            });

            if (options.broadcast === false) {
                console.log('MetakeepUAL -- NO BROADCAST');
                return Promise.resolve({
                    wasBroadcast: false,
                    transactionId: '',
                    status: '',
                    transaction: packedTransaction,
                });
            }
            console.log('MetakeepUAL -- BROADCAST????', options);
            // Broadcast the signed transaction to the blockchain
            const pushResponse = await this.eosioCore.v1.chain.push_transaction(
                packedTransaction,
            );

            // we compose the final response
            const finalResponse/*: SignTransactionResponse*/ = {
                wasBroadcast: true,
                transactionId: pushResponse.transaction_id,
                status: pushResponse.processed.receipt.status,
                transaction: packedTransaction,
            };

            return Promise.resolve(finalResponse);

        } catch (e: any) {
            throw this.handleCatchError(e);
        }
    }

    /**
     * Note: this method is not implemented yet
     *
     * @param publicKey     The public key to use for signing.
     * @param data                The data to be signed.
     * @param helpText        Help text to explain the need for arbitrary data to be signed.
     *
     * @returns                     The signature
     */
    signArbitrary = async (): Promise<string> => {
        throw new Error('MetakeepUAL: signArbitrary not supported (yet)');
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


