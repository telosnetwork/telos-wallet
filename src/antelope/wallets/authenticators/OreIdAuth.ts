import { AuthProvider, ChainNetwork, OreId, OreIdOptions, JSONObject, UserChainAccount } from 'oreid-js';
import { ethers } from 'ethers';
import { WebPopup } from 'oreid-webpopup';
import { erc20Abi } from 'src/antelope/types';
import { EVMAuthenticator } from 'src/antelope/wallets';
import {
    AntelopeError,
    TokenClass,
    addressString,
    EvmTransactionResponse,
} from 'src/antelope/types';
import { useFeedbackStore } from 'src/antelope/stores/feedback';
import { useChainStore } from 'src/antelope/stores/chain';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { RpcEndpoint } from 'universal-authenticator-library';
import { TELOS_ANALYTICS_EVENT_IDS } from 'src/antelope/chains/chain-constants';


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

    get provider(): string {
        return this.options.provider ?? '';
    }

    setProvider(provider: string): void {
        this.trace('setProvider', provider);
        this.options.provider = provider;
    }

    // EVMAuthenticator API ----------------------------------------------------------

    getName(): string {
        return name;
    }

    // this is the important instance creation where we define a label to assign to this instance of the authenticator
    newInstance(label: string): EVMAuthenticator {
        this.trace('newInstance', label);
        return new OreIdAuth(this.options, label);
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
        const chainSettings = useChainStore().currentChain.settings as EVMChainSettings;

        useFeedbackStore().setLoading(`${this.getName()}.login`);
        const oreIdOptions: OreIdOptions = {
            plugins: { popup: WebPopup() },
            ... this.options,
        };

        oreId = new OreId(oreIdOptions);
        await oreId.init();

        if (
            localStorage.getItem('autoLogin') === this.getName() &&
            typeof localStorage.getItem('account') === 'string'
        ) {
            // auto login without the popup
            const chainAccount = localStorage.getItem('account') as addressString;
            this.userChainAccount = { chainAccount } as UserChainAccount;
            this.trace('login', 'userChainAccount', this.userChainAccount);
            return chainAccount;
        }

        this.trace('login', 'trackAnalyticsEvent -> login started');
        chainSettings.trackAnalyticsEvent(
            { id: TELOS_ANALYTICS_EVENT_IDS.loginStarted },
        );

        // launch the login flow
        await oreId.popup.auth({ provider: this.provider as AuthProvider });
        const userData = await oreId.auth.user.getData();
        this.trace('login', 'userData', userData);

        this.userChainAccount = userData.chainAccounts.find(
            (account: UserChainAccount) => this.getChainNetwork(network) === account.chainNetwork) ?? null;

        if (!this.userChainAccount) {
            const appName = this.options.appName;
            const networkName = useChainStore().getNetworkSettings(network).getDisplay();

            this.trace('login', 'trackAnalyticsEvent -> login failed', this.getName(), TELOS_ANALYTICS_EVENT_IDS.loginFailedOreId);
            chainSettings.trackAnalyticsEvent(
                { id: TELOS_ANALYTICS_EVENT_IDS.loginFailedOreId },
            );

            throw new AntelopeError('antelope.wallets.error_oreid_no_chain_account', {
                networkName,
                appName,
            });
        }

        const address = (this.userChainAccount?.chainAccount as addressString) ?? null;
        this.trace('login', 'userChainAccount', this.userChainAccount);
        this.trace('login', 'trackAnalyticsEvent -> generic login succeeded', TELOS_ANALYTICS_EVENT_IDS.loginSuccessful);
        chainSettings.trackAnalyticsEvent(
            { id: TELOS_ANALYTICS_EVENT_IDS.loginSuccessful },
        );
        this.trace('login', 'trackAnalyticsEvent -> login succeeded', this.getName(), TELOS_ANALYTICS_EVENT_IDS.loginSuccessfulOreId);
        chainSettings.trackAnalyticsEvent(
            { id: TELOS_ANALYTICS_EVENT_IDS.loginSuccessfulOreId },
        );

        useFeedbackStore().unsetLoading(`${this.getName()}.login`);
        return address;
    }

    logout(): Promise<void> {
        this.trace('logout');
        if (oreId) {
            oreId.logout();
        }
        return Promise.resolve();
    }

    async getSystemTokenBalance(address: addressString | string): Promise<ethers.BigNumber> {
        this.trace('getSystemTokenBalance', address);
        const provider = await this.web3Provider();
        if (provider) {
            return provider.getBalance(address);
        } else {
            throw new AntelopeError('antelope.evm.error_no_provider');
        }
    }

    async getERC20TokenBalance(address: addressString, token: addressString): Promise<ethers.BigNumber> {
        this.trace('getERC20TokenBalance', [address, token]);
        const provider = await this.web3Provider();
        if (provider) {
            const erc20Contract = new ethers.Contract(token, erc20Abi, provider);
            const balance = await erc20Contract.balanceOf(address);
            return balance;
        } else {
            throw new AntelopeError('antelope.evm.error_no_provider');
        }
    }

    async transferTokens(token: TokenClass, amount: ethers.BigNumber, to: addressString): Promise<EvmTransactionResponse> {
        this.trace('transferTokens', token, amount, to);

        if (!this.userChainAccount) {
            console.error('Inconsistency error: userChainAccount is null');
            throw new AntelopeError('antelope.evm.error_no_provider');
        }

        if (!oreId) {
            console.error('Inconsistency error: oreId is null');
            throw new AntelopeError('antelope.evm.error_no_provider');
        }

        const from = this.userChainAccount.chainAccount as addressString;
        const value = amount.toHexString();
        const abi = erc20Abi;

        const systemTransfer = {
            from,
            to,
            value,
        };

        const erc20Transfer = {
            from,
            to: token.address,
            'contract': {
                abi,
                'parameters': [to, value],
                'method': 'transfer',
            },
        } as unknown as JSONObject;

        let transactionBody = null as unknown as JSONObject;
        if (token.isSystem) {
            transactionBody = systemTransfer;
        } else {
            transactionBody = erc20Transfer;
        }

        // sign a blockchain transaction
        this.trace('createTransaction()');
        const transaction = await oreId.createTransaction({
            transaction: transactionBody,
            chainAccount: from,
            chainNetwork: ChainNetwork.TelosEvmTest,
            signOptions: {
                broadcast: true,
                returnSignedTransaction: true,
            },
        });

        // have the user approve signature
        this.trace('Signing a transaction...', transaction);

        const { transactionId } = await oreId.popup.sign({ transaction });
        this.trace('transactionId:', transactionId);

        return {
            hash: transactionId,
            wait: async () => Promise.resolve({} as ethers.providers.TransactionReceipt),
        } as EvmTransactionResponse;
    }

    async prepareTokenForTransfer(token: TokenClass | null, amount: ethers.BigNumber, to: string): Promise<void> {
        this.trace('prepareTokenForTransfer', [token], amount, to);
    }

    async isConnectedTo(chainId: string): Promise<boolean> {
        this.trace('isConnectedTo', chainId);
        return true;
    }

    async web3Provider(): Promise<ethers.providers.Web3Provider> {
        this.trace('web3Provider');
        const p:RpcEndpoint = (useChainStore().getChain(this.label).settings as EVMChainSettings).getRPCEndpoint();
        const url = `${p.protocol}://${p.host}:${p.port}${p.path ?? ''}`;
        const web3Provider = new ethers.providers.JsonRpcProvider(url);
        await web3Provider.ready;
        return web3Provider as ethers.providers.Web3Provider;
    }

    async externalProvider(): Promise<ethers.providers.ExternalProvider> {
        this.trace('externalProvider');
        return new Promise(async (resolve) => {
            resolve(null as unknown as ethers.providers.ExternalProvider);
        });
    }

}
