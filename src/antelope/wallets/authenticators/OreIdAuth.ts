import { AuthProvider, ChainNetwork, OreId, OreIdOptions, JSONObject, UserChainAccount } from 'oreid-js';
import { BigNumber, ethers } from 'ethers';
import { WebPopup } from 'oreid-webpopup';
import {
    EvmABI,
    EvmFunctionParam,
} from 'src/antelope/types';
import { EVMAuthenticator } from 'src/antelope/wallets';
import {
    AntelopeError,
    addressString,
    EvmTransactionResponse,
} from 'src/antelope/types';
import { useFeedbackStore } from 'src/antelope/stores/feedback';
import { useChainStore } from 'src/antelope/stores/chain';
import { RpcEndpoint } from 'universal-authenticator-library';
import { TELOS_ANALYTICS_EVENT_NAMES } from 'src/antelope/chains/chain-constants';

const name = 'OreId';
export const OreIdAuthName = name;

// This instance needs to be placed outside to avoid watch function to crash
let oreId: OreId | null = null;

export interface AuthOreIdOptions extends OreIdOptions {
    provider?: string;
}

export class OreIdAuth extends EVMAuthenticator {

    options: AuthOreIdOptions;
    userChainAccount: UserChainAccount | null = null;
    // this is just a dummy label to identify the authenticator base class
    constructor(options: OreIdOptions, label = name) {
        super(label);
        this.options = options;
    }

    getNetworkNameFromChainNet(chainNetwork: ChainNetwork): string {
        this.trace('getNetworkNameFromChainNet', chainNetwork);
        switch (chainNetwork) {
        case ChainNetwork.TelosEvmTest:
            return 'telos-evm-testnet';
        case ChainNetwork.TelosEvmMain:
            return 'telos-evm';
        default:
            throw new AntelopeError('antelope.evm.error_invalid_chain_network');
        }
    }

    getChainNetwork(network: string): ChainNetwork {
        this.trace('getChainNetwork', network);
        switch (network) {
        case 'telos-evm-testnet':
            return ChainNetwork.TelosEvmTest;
        case 'telos-evm':
            return ChainNetwork.TelosEvmMain;
        default:
            throw new AntelopeError('antelope.evm.error_invalid_chain_network');
        }
    }

    async login(network: string): Promise<addressString | null> {
        this.trace('login', network);
        const chainSettings = this.getChainSettings();
        const trackSuccessfulLogin = () => {
            this.trace('login', 'trackAnalyticsEvent -> generic login succeeded', TELOS_ANALYTICS_EVENT_NAMES.loginSuccessful);
            chainSettings.trackAnalyticsEvent(TELOS_ANALYTICS_EVENT_NAMES.loginSuccessful);
            this.trace('login', 'trackAnalyticsEvent -> login succeeded', this.getName(), TELOS_ANALYTICS_EVENT_NAMES.loginSuccessfulOreId);
            chainSettings.trackAnalyticsEvent(TELOS_ANALYTICS_EVENT_NAMES.loginSuccessfulOreId);
        };

        useFeedbackStore().setLoading(`${this.getName()}.login`);
        const oreIdOptions: OreIdOptions = {
            plugins: { popup: WebPopup() },
            ... this.options,
        };

        oreId = new OreId(oreIdOptions);
        await oreId.init();

        if (
            localStorage.getItem('autoLogin') === this.getName() &&
            typeof localStorage.getItem('rawAddress') === 'string'
        ) {
            // auto login without the popup
            const chainAccount = localStorage.getItem('rawAddress') as addressString;
            this.userChainAccount = { chainAccount } as UserChainAccount;
            this.trace('login', 'userChainAccount', this.userChainAccount);
            // track the login start for auto-login procceess
            this.trace('login', 'trackAnalyticsEvent -> login started');
            chainSettings.trackAnalyticsEvent(TELOS_ANALYTICS_EVENT_NAMES.loginStarted);
            // then track the successful login
            trackSuccessfulLogin();
            return chainAccount;
        }

        this.trace('login', 'trackAnalyticsEvent -> login started');
        chainSettings.trackAnalyticsEvent(TELOS_ANALYTICS_EVENT_NAMES.loginStarted);

        // launch the login flow
        await oreId.popup.auth({ provider: this.provider as AuthProvider });
        const userData = await oreId.auth.user.getData();
        this.trace('login', 'userData', userData);

        this.userChainAccount = userData.chainAccounts.find(
            (account: UserChainAccount) => this.getChainNetwork(network) === account.chainNetwork) ?? null;

        if (!this.userChainAccount) {
            const appName = this.options.appName;
            const networkName = useChainStore().getNetworkSettings(network).getDisplay();

            this.trace('login', 'trackAnalyticsEvent -> login failed', this.getName(), TELOS_ANALYTICS_EVENT_NAMES.loginFailedOreId);
            chainSettings.trackAnalyticsEvent(TELOS_ANALYTICS_EVENT_NAMES.loginFailedOreId);

            throw new AntelopeError('antelope.wallets.error_oreid_no_chain_account', {
                networkName,
                appName,
            });
        }

        const address = (this.userChainAccount?.chainAccount as addressString) ?? null;
        this.trace('login', 'userChainAccount', this.userChainAccount);
        trackSuccessfulLogin();

        // now we set autoLogin to this.getName() and rawAddress to the address
        // to avoid the auto-login to be triggered again
        localStorage.setItem('autoLogin', this.getName());
        localStorage.setItem('rawAddress', address);

        useFeedbackStore().unsetLoading(`${this.getName()}.login`);
        return address;
    }

    async logout(): Promise<void> {
        this.trace('logout');
        if (oreId) {
            await oreId.logout();
        }
        return Promise.resolve();
    }

    getName(): string {
        return name;
    }

    // this is the important instance creation where we define a label to assign to this instance of the authenticator
    newInstance(label: string): EVMAuthenticator {
        this.trace('newInstance', label);
        return new OreIdAuth(this.options, label);
    }

    get provider(): string {
        return this.options.provider ?? '';
    }

    setProvider(provider: string): void {
        this.trace('setProvider', provider);
        this.options.provider = provider;
    }


    async isConnectedTo(chainId: string): Promise<boolean> {
        this.trace('isConnectedTo', chainId);
        return true;
    }

    async externalProvider(): Promise<ethers.providers.ExternalProvider> {
        this.trace('externalProvider');
        return new Promise((resolve) => {
            resolve(null as unknown as ethers.providers.ExternalProvider);
        });
    }

    async web3Provider(): Promise<ethers.providers.Web3Provider> {
        this.trace('web3Provider');
        try {
            const p:RpcEndpoint = this.getChainSettings().getRPCEndpoint();
            const url = `${p.protocol}://${p.host}:${p.port}${p.path ?? ''}`;
            const jsonRpcProvider = new ethers.providers.JsonRpcProvider(url);
            await jsonRpcProvider.ready;
            const web3Provider = jsonRpcProvider as ethers.providers.Web3Provider;
            return web3Provider;
        } catch (e) {
            console.error('web3Provider', e);
            throw e;
        }
    }

    // returns the associated account address acording to the label
    getAccountAddress(): addressString {
        return this.userChainAccount?.chainAccount as addressString;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleCatchError(error: Error): AntelopeError {
        this.trace('handleCatchError', error.message);
        if (
            error.message === 'Closed by user' ||
            error.message === 'sign_transaction_cancelled_by_user'
        ) {
            return new AntelopeError('antelope.evm.error_transaction_canceled');
        } else {
            return new AntelopeError('antelope.evm.error_send_transaction', { error });
        }
    }

    /**
     * utility function to check if the user has a valid chain account and the oreId instance is initialized
     */
    checkIntegrity(): boolean {
        if (!this.userChainAccount) {
            console.error('Inconsistency error: userChainAccount is null');
            throw new AntelopeError('antelope.evm.error_no_provider');
        }

        if (!oreId) {
            console.error('Inconsistency error: oreId is null');
            throw new AntelopeError('antelope.evm.error_no_provider');
        }

        return true;
    }

    async performOreIdTransaction(from: addressString, json: JSONObject): Promise<EvmTransactionResponse> {
        this.trace('performOreIdTransaction', from, json);
        const oreIdInstance = oreId as OreId;

        // sign a blockchain transaction
        const transaction = await oreIdInstance.createTransaction({
            transaction: json,
            chainAccount: from,
            chainNetwork: this.getChainNetwork(this.getChainSettings().getNetwork()),
            signOptions: {
                broadcast: true,
                returnSignedTransaction: true,
            },
        });

        // have the user approve signature
        const { transactionId } = await oreIdInstance.popup.sign({ transaction });

        return {
            hash: transactionId,
            wait: async () => Promise.resolve({} as ethers.providers.TransactionReceipt),
        } as EvmTransactionResponse;
    }

    async sendSystemToken(to: string, amount: ethers.BigNumber): Promise<EvmTransactionResponse> {
        this.trace('sendSystemToken', to, amount.toString());
        const from = this.getAccountAddress();
        const value = amount.toHexString();

        // Send the transaction
        return this.performOreIdTransaction(from, {
            from,
            to,
            value,
        }).then(
            (transaction: ethers.providers.TransactionResponse) => transaction,
        ).catch((error) => {
            throw this.handleCatchError(error);
        });
    }

    async signCustomTransaction(contract: string, abi: EvmABI, parameters: EvmFunctionParam[], value?: BigNumber): Promise<EvmTransactionResponse> {
        this.trace('signCustomTransaction', contract, [abi], parameters, value?.toString());
        this.checkIntegrity();

        const from = this.getAccountAddress();
        const method = abi[0].name;

        // if the developer is passing more than one function in the abi
        // we must warn we asume the first one is the one to be called
        if (abi.length > 1) {
            console.warn(
                `signCustomTransaction: abi contains more than one function,
                we asume the first one (${method}) is the one to be called`,
            );
        }

        // transaction body: wrap system token
        const transactionBody = {
            from,
            to: contract,
            'contract': {
                abi,
                parameters,
                'method': abi[0].name,
            },
        } as unknown as JSONObject;

        if (value) {
            transactionBody.value = value.toHexString();
        }

        return this.performOreIdTransaction(from, transactionBody);
    }
}
