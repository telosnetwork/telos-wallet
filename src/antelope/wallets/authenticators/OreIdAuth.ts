import { AuthProvider, ChainNetwork, OreId, OreIdOptions, JSONObject, UserChainAccount } from 'oreid-js';
import { BigNumber, ethers } from 'ethers';
import { WebPopup } from 'oreid-webpopup';
import {
    erc20Abi,
    stlosAbiDeposit,
    stlosAbiWithdraw,
    wtlosAbiDeposit,
    wtlosAbiWithdraw,
} from 'src/antelope/types';
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
        const trackSuccessfulLogin = () => {
            this.trace('login', 'trackAnalyticsEvent -> generic login succeeded', TELOS_ANALYTICS_EVENT_IDS.loginSuccessful);
            chainSettings.trackAnalyticsEvent(
                { id: TELOS_ANALYTICS_EVENT_IDS.loginSuccessful },
            );
            this.trace('login', 'trackAnalyticsEvent -> login succeeded', this.getName(), TELOS_ANALYTICS_EVENT_IDS.loginSuccessfulOreId);
            chainSettings.trackAnalyticsEvent(
                { id: TELOS_ANALYTICS_EVENT_IDS.loginSuccessfulOreId },
            );
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
            typeof localStorage.getItem('account') === 'string'
        ) {
            // auto login without the popup
            const chainAccount = localStorage.getItem('account') as addressString;
            this.userChainAccount = { chainAccount } as UserChainAccount;
            this.trace('login', 'userChainAccount', this.userChainAccount);
            // track the login start for auto-login procceess
            this.trace('login', 'trackAnalyticsEvent -> login started');
            chainSettings.trackAnalyticsEvent(
                { id: TELOS_ANALYTICS_EVENT_IDS.loginStarted },
            );
            // then track the successful login
            trackSuccessfulLogin();
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
        trackSuccessfulLogin();

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
        this.checkIntegrity();

        // prepare variables
        const from = this.userChainAccount?.chainAccount as addressString;
        const value = amount.toHexString();
        const abi = erc20Abi;

        // transaction body: transfer system tokens
        const systemTransfer = {
            from,
            to,
            value,
        };

        // transaction body: transfer erc20 tokens
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

        return this.performOreIdTransaction(from, transactionBody);
    }

    async prepareTokenForTransfer(token: TokenClass | null, amount: ethers.BigNumber, to: string): Promise<void> {
        this.trace('prepareTokenForTransfer', [token], amount, to);
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

        const oreIdInstance = oreId as OreId;

        // sign a blockchain transaction
        this.trace('createTransaction()');
        const transaction = await oreIdInstance.createTransaction({
            transaction: json,
            chainAccount: from,
            chainNetwork: this.getChainNetwork(useChainStore().getChain(this.label).settings.getNetwork()),
            signOptions: {
                broadcast: true,
                returnSignedTransaction: true,
            },
        });

        // have the user approve signature
        this.trace('Signing a transaction...', transaction);

        const { transactionId } = await oreIdInstance.popup.sign({ transaction });
        this.trace('transactionId:', transactionId);

        return {
            hash: transactionId,
            wait: async () => Promise.resolve({} as ethers.providers.TransactionReceipt),
        } as EvmTransactionResponse;
    }

    async wrapSystemToken(amount: BigNumber): Promise<EvmTransactionResponse> {
        this.trace('wrapSystemToken', amount);
        this.checkIntegrity();

        // prepare variables
        const chainSettings = (useChainStore().currentChain.settings as EVMChainSettings);
        const wrappedSystemTokenContractAddress = chainSettings.getWrappedSystemToken().address as addressString;
        const from = this.userChainAccount?.chainAccount as addressString;
        const value = amount.toHexString();
        const abi = wtlosAbiDeposit;

        // transaction body: wrap system token
        const wrapTransaction = {
            from,
            to: wrappedSystemTokenContractAddress,
            value,
            'contract': {
                abi,
                'parameters': [],
                'method': 'deposit',
            },
        } as unknown as JSONObject;

        return this.performOreIdTransaction(from, wrapTransaction);
    }

    async unwrapSystemToken(amount: BigNumber): Promise<EvmTransactionResponse> {
        this.trace('unwrapSystemToken', amount.toString());
        this.checkIntegrity();

        // prepare variables
        const chainSettings = (useChainStore().currentChain.settings as EVMChainSettings);
        const wrappedSystemTokenContractAddress = chainSettings.getWrappedSystemToken().address as addressString;
        const from = this.userChainAccount?.chainAccount as addressString;
        const value = amount.toHexString();
        const abi = wtlosAbiWithdraw;

        // transaction body: unwrap system token
        const unwrapTransaction = {
            from,
            to: wrappedSystemTokenContractAddress,
            'contract': {
                abi,
                'parameters': [value],
                'method': 'withdraw',
            },
        } as unknown as JSONObject;

        return this.performOreIdTransaction(from, unwrapTransaction);
    }

    async stakeSystemTokens(amount: BigNumber): Promise<EvmTransactionResponse> {
        this.trace('stakeSystemTokens', amount.toString());
        this.checkIntegrity();

        // prepare variables
        const chainSettings = (useChainStore().currentChain.settings as EVMChainSettings);
        const systemTokenContractAddress = chainSettings.getSystemToken().address as addressString;
        const from = this.userChainAccount?.chainAccount as addressString;
        const value = amount.toHexString();
        const abi = stlosAbiDeposit;

        console.assert(stlosAbiDeposit.length === 1, 'warning: we are assuming stlosAbiDeposit has only one method');
        // transaction body: stake system token
        const stakeTransaction = {
            from,
            to: systemTokenContractAddress,
            value,
            'contract': {
                abi,
                'parameters': [],
                'method': stlosAbiDeposit[0].name,
            },
        } as unknown as JSONObject;

        return this.performOreIdTransaction(from, stakeTransaction);
    }

    async unstakeSystemTokens(amount: BigNumber): Promise<EvmTransactionResponse> {
        this.trace('unstakeSystemTokens', amount.toString());
        this.checkIntegrity();

        // prepare variables
        const chainSettings = (useChainStore().currentChain.settings as EVMChainSettings);
        const systemTokenContractAddress = chainSettings.getSystemToken().address as addressString;
        const from = this.userChainAccount?.chainAccount as addressString;
        const value = amount.toHexString();
        const abi = stlosAbiWithdraw;

        // transaction body: unstake system token
        const unstakeTransaction = {
            from,
            to: systemTokenContractAddress,
            'contract': {
                abi,
                'parameters': [value],
                'method': 'withdraw',
            },
        } as unknown as JSONObject;

        return this.performOreIdTransaction(from, unstakeTransaction);
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

    async getSigner(): Promise<ethers.Signer> {
        this.trace('getSigner');
        const provider = await this.web3Provider();
        return provider.getSigner();
    }

}

/*
-- Documentations --

---
sidebar_positon: 4
hide_table_of_contents: true
title: Reading data from a Contract
---

# Reading data from a Contract

## Interacting

On EVM the ontracts may hold data in a private way, which means is not accesible to the public. However, the contracts may have public methods that allow to read the data. These methods are called `view` or `pure` methods. The `view` methods are the ones that read data from the blockchain, while the `pure` methods are the ones that do not read data from the blockchain. Both methods are free to use and do not require any signing.

In order execute a read function, you need to instantiate a contract object and call the method you want to execute. In this chapter we will show how to read the `balanceOf` method from the `ERC20` contract using JsonRpcProvider as the provider for remote access to the blockchain.

### Create the web3 provider

First, we need to create a web3 provider. In this example we will use the `JsonRpcProvider` as the provider for remote access to the blockchain.

```typescript
async web3Provider(): Promise<ethers.providers.Web3Provider> {
    const RPC_ENDPOINT = {
        protocol: 'https',
        host: 'mainnet.telos.net',
        port: 443,
        path: '/evm',
    };
    const url = `${RPC_ENDPOINT.protocol}://${RPC_ENDPOINT.host}:${RPC_ENDPOINT.port}${RPC_ENDPOINT.path ?? ''}`;
    const web3Provider = new ethers.providers.JsonRpcProvider(url);
    await web3Provider.ready;
    return web3Provider as ethers.providers.Web3Provider;
}
```

### Create the contract object

Then, we need to create a contract object. In this example we will use the `ERC20` contract.

```typescript
const provider = await this.web3Provider();
// you don't need the whole ABI, just the methods you want to call
const erc20Abi = [
    'function balanceOf(address account) view returns (uint256)',
];
const erc20Contract = new ethers.Contract(token, erc20Abi, provider);
```

### Call the method

Finally, we need to call the method. In this example we will call the `balanceOf` method.

```typescript
const balance: ethers.BigNumber = await erc20Contract.balanceOf(address);

// you can convert the balance to a number using the ethers.utils.formatUnits method
const tokenDecimals = 18;
const balanceNumber: number = ethers.utils.formatUnits(balance, tokenDecimals);
```

## Conclusion

In this chapter we have shown how to read data from a contract using the `view` methods, prforming a remote call to the blockchain endpoint through the `JsonRpcProvider` provider. You can execute any `view` or `pure` method from any contract using the same approach. All you need is a provider and the contract ABI.

*/
