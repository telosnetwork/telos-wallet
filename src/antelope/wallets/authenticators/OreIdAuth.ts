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



const name = 'OreId';

// This instance needs to be placed outside to avoid watch function to crash
let oreId: OreId | null = null;

export class OreIdAuth extends EVMAuthenticator {

    options: OreIdOptions;
    userChainAccount: UserChainAccount | null = null;

    // this is just a dummy label to identify the authenticator base class
    constructor(options: OreIdOptions, label = name) {
        super(label);
        this.options = options;
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

    async login(network: string): Promise<addressString | null> {
        this.trace('login', network);

        const oreIdOptions: OreIdOptions = {
            plugins: { popup: WebPopup() },
            ... this.options,
        };

        oreId = new OreId(oreIdOptions);
        await oreId.init();

        // launch the login flow
        await oreId.popup.auth({ provider: 'google' as AuthProvider });
        const userData = await oreId.auth.user.getData();
        this.userChainAccount = userData.chainAccounts.find((account: UserChainAccount) => account.chainNetwork !== ChainNetwork.OreTest) ?? null;
        const address = (this.userChainAccount?.chainAccount as addressString) ?? null;
        return address;
    }


    async logout(): Promise<void> {
        this.trace('logout');
    }

    async getSystemTokenBalance(address: addressString): Promise<ethers.BigNumber> {
        this.trace('getSystemTokenBalance', address);
        return ethers.BigNumber.from(0);
    }

    async getERC20TokenBalance(address: addressString, token: addressString): Promise<ethers.BigNumber> {
        this.trace('getERC20TokenBalance', [address, token]);
        return ethers.BigNumber.from(0);
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
        console.log('createTransaction()...');
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
        console.log('Signing a transaction...', transaction);
        const { transactionId } = await oreId.popup.sign({ transaction });
        console.log('transactionId: ', transactionId);

        return {
            hash: transactionId,
        } as EvmTransactionResponse;
    }

    async prepareTokenForTransfer(token: TokenClass | null, amount: ethers.BigNumber, to: string): Promise<void> {
        this.trace('prepareTokenForTransfer', [token], amount, to);
    }

    async isConnectedTo(chainId: string): Promise<boolean> {
        this.trace('isConnectedTo', chainId);
        return false;
    }

    async web3Provider(): Promise<ethers.providers.Web3Provider> {
        this.trace('web3Provider');
        const web3Provider = new ethers.providers.Web3Provider(await this.externalProvider());
        await web3Provider.ready;
        return web3Provider;
    }

    async externalProvider(): Promise<ethers.providers.ExternalProvider> {
        this.trace('externalProvider');
        return new Promise(async (resolve) => {
            resolve({} as unknown as ethers.providers.ExternalProvider);
        });
    }

}
